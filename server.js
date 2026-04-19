const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const rootDirectory = __dirname;
const dataDirectory = path.join(rootDirectory, "data");
const ratingsFile = path.join(dataDirectory, "ratings.json");
const port = Number(process.env.PORT) || 3000;
const dashboardKey = process.env.SAFEMIND_DASHBOARD_KEY || "";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
let writeQueue = Promise.resolve();

async function ensureRatingsFile() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(ratingsFile);
  } catch (error) {
    await fs.writeFile(
      ratingsFile,
      JSON.stringify({ ratings: {} }, null, 2),
      "utf8"
    );
  }
}

async function readRatingsStore() {
  await ensureRatingsFile();

  const fileContents = await fs.readFile(ratingsFile, "utf8");
  const parsed = JSON.parse(fileContents);

  if (!parsed || typeof parsed !== "object" || typeof parsed.ratings !== "object") {
    return { ratings: {} };
  }

  return parsed;
}

function updateRatingsStore(mutator) {
  const nextWrite = writeQueue.then(async () => {
    const store = await readRatingsStore();
    const result = await mutator(store);

    await fs.writeFile(ratingsFile, JSON.stringify(store, null, 2), "utf8");

    return result;
  });

  writeQueue = nextWrite.catch(() => {});

  return nextWrite;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(message);
}

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 10_000) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });
}

function isValidRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isValidVisitorId(value) {
  return typeof value === "string" && value.length >= 8 && value.length <= 120;
}

function buildRatingsSummary(store) {
  const ratings = Object.values(store.ratings || {})
    .filter(
      (entry) =>
        entry &&
        isValidRating(entry.rating) &&
        typeof entry.updatedAt === "string"
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );

  const totalRatings = ratings.length;
  const ratingSum = ratings.reduce((sum, entry) => sum + entry.rating, 0);
  const breakdown = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: ratings.filter((entry) => entry.rating === rating).length,
  }));

  return {
    totalRatings,
    averageRating: totalRatings ? Number((ratingSum / totalRatings).toFixed(1)) : null,
    breakdown,
    recentRatings: ratings.slice(0, 8).map((entry) => ({
      rating: entry.rating,
      updatedAt: entry.updatedAt,
    })),
    lastUpdated: ratings[0] ? ratings[0].updatedAt : null,
  };
}

function isDashboardAuthorized(request) {
  if (!dashboardKey) {
    return true;
  }

  return request.headers["x-dashboard-key"] === dashboardKey;
}

async function handleRatingsSubmission(request, response) {
  let body;

  try {
    body = await parseJsonBody(request);
  } catch (error) {
    const isLargePayload =
      error instanceof Error && error.message === "Payload too large";

    sendJson(response, isLargePayload ? 413 : 400, {
      error: isLargePayload
        ? "Rating payload was too large."
        : "Invalid rating payload.",
    });
    return;
  }

  const rating = Number(body.rating);
  const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim() : "";

  if (!isValidRating(rating) || !isValidVisitorId(visitorId)) {
    sendJson(response, 400, {
      error: "A rating between 1 and 5 and a valid visitor ID are required.",
    });
    return;
  }

  const now = new Date().toISOString();
  const summary = await updateRatingsStore((store) => {
    const existingEntry = store.ratings[visitorId];

    store.ratings[visitorId] = {
      rating,
      createdAt:
        existingEntry && typeof existingEntry.createdAt === "string"
          ? existingEntry.createdAt
          : now,
      updatedAt: now,
    };

    return buildRatingsSummary(store);
  });

  sendJson(response, 201, {
    ok: true,
    summary,
  });
}

async function handleRatingsSummary(request, response) {
  if (!isDashboardAuthorized(request)) {
    sendJson(response, 401, {
      error: "Unauthorized",
    });
    return;
  }

  await writeQueue;
  const store = await readRatingsStore();

  sendJson(response, 200, buildRatingsSummary(store));
}

function resolveStaticFile(requestPath) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;

  if (
    normalizedPath.startsWith("/api/") ||
    normalizedPath.startsWith("/data/") ||
    normalizedPath.includes("..")
  ) {
    return null;
  }

  const resolvedPath = path.join(rootDirectory, normalizedPath);

  if (!resolvedPath.startsWith(rootDirectory)) {
    return null;
  }

  return resolvedPath;
}

async function serveStaticFile(requestPath, response) {
  const filePath = resolveStaticFile(requestPath);

  if (!filePath) {
    sendText(response, 404, "Not found");
    return;
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const extension = path.extname(filePath);

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
    });
    response.end(fileBuffer);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendText(response, 404, "Not found");
      return;
    }

    sendText(response, 500, "Unable to load file");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (request.method === "POST" && url.pathname === "/api/ratings") {
      await handleRatingsSubmission(request, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/ratings/summary") {
      await handleRatingsSummary(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Method not allowed");
      return;
    }

    await serveStaticFile(url.pathname, response);
  } catch (error) {
    sendJson(response, 500, {
      error: "Server error",
    });
  }
});

server.listen(port, () => {
  const keyNotice = dashboardKey
    ? "protected dashboard key enabled"
    : "dashboard key not set";

  console.log(`SafeMind server running at http://localhost:${port} (${keyNotice})`);
});
