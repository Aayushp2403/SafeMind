const moodResponses = {
  overwhelmed:
    "Pause for one minute. Unclench your jaw, drop your shoulders, and choose just one person or tool that feels safest right now.",
  anxious:
    "Try naming five things you can see and one thing you can hear. Grounding first can make the next decision feel less intense.",
  sad:
    "Choose one gentle action: text someone you trust, step outside for air, or write one honest sentence about how today feels.",
  numb:
    "Start with small signals from your body. Drink some water, stretch your hands, and check whether being around one safe person might help.",
  stressed:
    "Pick the smallest pressure you can reduce today. Finishing everything is not the goal; lowering the load is.",
  unsure:
    "You do not need a perfect label. Start with: 'Something feels off, and I do not want to handle it alone.'",
};

const ratingMessages = {
  1: "Thanks for the honest feedback. We can make SafeMind more helpful.",
  2: "Thanks for rating SafeMind. We still have room to make this easier to use.",
  3: "Thanks for rating SafeMind. It helps to know this felt somewhat useful.",
  4: "Thanks for rating SafeMind. We are glad this felt helpful.",
  5: "Thanks for rating SafeMind. We are really glad this supported you today.",
};

const conditionLibrary = Array.isArray(window.conditionLibrary)
  ? window.conditionLibrary
  : [];
const conditionBySlug = new Map(
  conditionLibrary.map((condition) => [condition.slug, condition])
);

const moodButtons = document.querySelectorAll(".mood-pill");
const moodResponse = document.querySelector("#mood-response");
const ratingStars = document.querySelectorAll(".rating-star");
const ratingStarsGroup = document.querySelector(".rating-stars");
const ratingStatus = document.querySelector("#rating-status");
const ratingMeta = document.querySelector("#rating-meta");
const dashboardKeyForm = document.querySelector("#dashboard-key-form");
const dashboardKeyInput = document.querySelector("#dashboard-key");
const dashboardRefreshButton = document.querySelector("#dashboard-refresh");
const dashboardStatus = document.querySelector("#dashboard-status");
const dashboardAverage = document.querySelector("#dashboard-average");
const dashboardAverageNote = document.querySelector("#dashboard-average-note");
const dashboardTotal = document.querySelector("#dashboard-total");
const dashboardFiveStarShare = document.querySelector("#dashboard-five-star-share");
const dashboardBreakdown = document.querySelector("#dashboard-breakdown");
const dashboardRecent = document.querySelector("#dashboard-recent");
const dashboardLastUpdated = document.querySelector("#dashboard-last-updated");
const year = document.querySelector("#year");
const websiteRatingStorageKey = "safemind-website-rating";
const websiteRatingVisitorKey = "safemind-rating-visitor-id";
const dashboardKeyStorageKey = "safemind-dashboard-key";
let fallbackVisitorId = null;

if (year) {
  year.textContent = new Date().getFullYear().toString();
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;

    moodButtons.forEach((item) => {
      item.classList.remove("is-active");
    });

    button.classList.add("is-active");

    if (mood && moodResponse) {
      moodResponse.textContent = moodResponses[mood];
    }
  });
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderConditionCards() {
  const conditionsGrid = document.querySelector("#conditions-grid");

  if (!conditionsGrid || !conditionLibrary.length) {
    return;
  }

  const cards = conditionLibrary
    .map((condition) => {
      const subtitle = condition.subtitle
        ? `<p class="condition-subtitle">${escapeHtml(condition.subtitle)}</p>`
        : "";

      return `
        <a class="condition-card condition-link reveal" href="condition.html?slug=${encodeURIComponent(condition.slug)}">
          <div class="condition-link-copy">
            ${subtitle}
            <h3>${escapeHtml(condition.title)}</h3>
            <p class="condition-excerpt">${escapeHtml(condition.teaser)}</p>
          </div>
          <span class="condition-link-row">
            <span class="condition-link-text">Open guide</span>
            <span class="condition-arrow" aria-hidden="true">→</span>
          </span>
        </a>
      `;
    })
    .join("");

  conditionsGrid.innerHTML = cards;
}

function renderConditionPage() {
  const conditionPage = document.querySelector("#condition-page");

  if (!conditionPage) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || "";
  const condition = conditionBySlug.get(slug);
  const metaDescription = document.querySelector('meta[name="description"]');

  if (!condition) {
    conditionPage.innerHTML = `
      <section class="condition-hero reveal">
        <p class="eyebrow">Mental Health Library</p>
        <h1>Topic not found</h1>
        <p class="hero-text">
          That page does not exist yet. Head back to the library and choose one of the available guides.
        </p>
        <div class="hero-actions">
          <a class="button" href="index.html#conditions">Back to library</a>
          <a class="button button-ghost" href="index.html#urgent">Urgent support</a>
        </div>
      </section>
    `;
    return;
  }

  document.title = `${condition.title} | SafeMind`;

  if (metaDescription) {
    metaDescription.setAttribute(
      "content",
      `${condition.title}: what it is, common symptoms, and next steps for getting support.`
    );
  }

  const subtitle = condition.subtitle
    ? `<p class="condition-subtitle">${escapeHtml(condition.subtitle)}</p>`
    : "";
  const symptoms = condition.symptoms
    .map((symptom) => `<li>${escapeHtml(symptom)}</li>`)
    .join("");

  conditionPage.innerHTML = `
    <section class="condition-hero reveal">
      <p class="eyebrow">Mental Health Library</p>
      ${subtitle}
      <h1>${escapeHtml(condition.title)}</h1>
      <p class="hero-text">
        Learn what this condition can look like, what signs to watch for, and what support steps may help next.
      </p>
      <div class="hero-actions">
        <a class="button" href="index.html#conditions">Back to library</a>
        <a class="button button-ghost" href="index.html#urgent">Urgent support</a>
      </div>
    </section>

    <section class="condition-page-grid">
      <article class="condition-page-section reveal">
        <p class="card-kicker">What it is</p>
        <h2>Understanding ${escapeHtml(condition.title)}</h2>
        <p>${escapeHtml(condition.whatItIs)}</p>
      </article>

      <article class="condition-page-section condition-page-section-wide reveal">
        <p class="card-kicker">Symptoms</p>
        <h2>Common signs</h2>
        <ul class="condition-list">
          ${symptoms}
        </ul>
      </article>

      <article class="condition-page-section reveal">
        <p class="card-kicker">What to do</p>
        <h2>Next steps</h2>
        <p>${escapeHtml(condition.whatToDo)}</p>
      </article>

      <aside class="condition-page-note reveal">
        <p class="card-kicker">Reminder</p>
        <h2>You do not have to figure it out alone</h2>
        <p>
          SafeMind is a starting point for learning and support. It is not a diagnosis,
          and it does not replace a licensed mental health professional or emergency care.
        </p>
      </aside>
    </section>
  `;
}

function readStoredValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function saveStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function removeStoredValue(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // Ignore storage errors for optional conveniences.
  }
}

function readSavedRating() {
  const storedRating = Number(readStoredValue(websiteRatingStorageKey));

  return storedRating >= 1 && storedRating <= 5 ? storedRating : null;
}

function saveRating(rating) {
  saveStoredValue(websiteRatingStorageKey, String(rating));
}

function createVisitorId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function ensureVisitorId() {
  const storedVisitorId = readStoredValue(websiteRatingVisitorKey);

  if (storedVisitorId) {
    return storedVisitorId;
  }

  if (fallbackVisitorId) {
    return fallbackVisitorId;
  }

  const newVisitorId = createVisitorId();
  const wasSaved = saveStoredValue(websiteRatingVisitorKey, newVisitorId);

  if (!wasSaved) {
    fallbackVisitorId = newVisitorId;
  }

  return newVisitorId;
}

function setRatingMeta(message, tone = "") {
  if (!ratingMeta) {
    return;
  }

  ratingMeta.textContent = message;
  ratingMeta.classList.remove("is-success", "is-warning");

  if (tone === "success") {
    ratingMeta.classList.add("is-success");
  }

  if (tone === "warning") {
    ratingMeta.classList.add("is-warning");
  }
}

function updateRatingState(selectedRating, previewRating = selectedRating) {
  if (!ratingStars.length || !ratingStatus) {
    return;
  }

  ratingStars.forEach((star) => {
    const starValue = Number(star.dataset.rating);
    const isFilled = starValue <= previewRating;
    const isSelected = starValue === selectedRating;

    star.classList.toggle("is-active", isFilled);
    star.setAttribute("aria-pressed", String(isSelected));
  });

  if (selectedRating && ratingMessages[selectedRating]) {
    ratingStatus.textContent = `You rated SafeMind ${selectedRating} out of 5 stars. ${ratingMessages[selectedRating]}`;
  } else {
    ratingStatus.textContent = "Tap a star to share how helpful this website felt.";
  }
}

async function submitRating(rating) {
  const response = await window.fetch("/api/ratings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rating,
      visitorId: ensureVisitorId(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to save rating (${response.status})`);
  }

  return response.json();
}

function setupWebsiteRating() {
  if (!ratingStars.length || !ratingStatus) {
    return;
  }

  let selectedRating = readSavedRating();
  let latestSubmissionId = 0;

  updateRatingState(selectedRating);

  if (selectedRating) {
    setRatingMeta("Your most recent rating is saved on this device.");
  } else {
    setRatingMeta("Anonymous feedback is saved once per device.");
  }

  ratingStars.forEach((star) => {
    const starValue = Number(star.dataset.rating);

    star.addEventListener("mouseenter", () => {
      updateRatingState(selectedRating, starValue);
    });

    star.addEventListener("focus", () => {
      updateRatingState(selectedRating, starValue);
    });

    star.addEventListener("click", () => {
      selectedRating = starValue;
      latestSubmissionId += 1;

      const submissionId = latestSubmissionId;

      saveRating(selectedRating);
      updateRatingState(selectedRating);
      setRatingMeta("Saving your anonymous feedback...");

      void submitRating(selectedRating)
        .then((payload) => {
          if (submissionId !== latestSubmissionId) {
            return;
          }

          const totalRatings = payload && payload.summary
            ? Number(payload.summary.totalRatings)
            : null;

          if (Number.isFinite(totalRatings)) {
            const pluralSuffix = totalRatings === 1 ? "" : "s";
            setRatingMeta(
              `Anonymous feedback saved. ${totalRatings} rating${pluralSuffix} collected so far.`,
              "success"
            );
          } else {
            setRatingMeta(
              "Anonymous feedback saved. Thank you for helping us improve SafeMind.",
              "success"
            );
          }
        })
        .catch(() => {
          if (submissionId !== latestSubmissionId) {
            return;
          }

          setRatingMeta(
            "Saved on this device. Server sync is unavailable right now.",
            "warning"
          );
        });
    });
  });

  if (ratingStarsGroup) {
    ratingStarsGroup.addEventListener("mouseleave", () => {
      updateRatingState(selectedRating);
    });

    ratingStarsGroup.addEventListener("focusout", (event) => {
      if (!ratingStarsGroup.contains(event.relatedTarget)) {
        updateRatingState(selectedRating);
      }
    });
  }
}

function setDashboardStatus(message, tone = "") {
  if (!dashboardStatus) {
    return;
  }

  dashboardStatus.textContent = message;
  dashboardStatus.classList.remove("is-success", "is-warning");

  if (tone === "success") {
    dashboardStatus.classList.add("is-success");
  }

  if (tone === "warning") {
    dashboardStatus.classList.add("is-warning");
  }
}

function formatRatingShare(value) {
  return Number.isFinite(value) ? `${Math.round(value)}%` : "0%";
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function showDashboardPlaceholder(message) {
  if (dashboardAverage) {
    dashboardAverage.textContent = "--";
  }

  if (dashboardAverageNote) {
    dashboardAverageNote.textContent = "Waiting for data";
  }

  if (dashboardTotal) {
    dashboardTotal.textContent = "0";
  }

  if (dashboardFiveStarShare) {
    dashboardFiveStarShare.textContent = "0%";
  }

  if (dashboardLastUpdated) {
    dashboardLastUpdated.textContent = "--";
  }

  if (dashboardBreakdown) {
    dashboardBreakdown.innerHTML = `<p class="dashboard-empty">${escapeHtml(message)}</p>`;
  }

  if (dashboardRecent) {
    dashboardRecent.innerHTML = `<li class="dashboard-empty">${escapeHtml(message)}</li>`;
  }
}

async function fetchDashboardSummary(dashboardKey = "") {
  const headers = {};

  if (dashboardKey) {
    headers["x-dashboard-key"] = dashboardKey;
  }

  const response = await window.fetch("/api/ratings/summary", {
    headers,
  });

  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  if (!response.ok) {
    throw new Error(`Unable to load summary (${response.status})`);
  }

  return response.json();
}

function renderDashboardSummary(summary) {
  if (!summary) {
    showDashboardPlaceholder("No ratings yet.");
    return;
  }

  const totalRatings = Number(summary.totalRatings) || 0;
  const averageRating = Number(summary.averageRating);
  const breakdown = Array.isArray(summary.breakdown) ? summary.breakdown : [];
  const recentRatings = Array.isArray(summary.recentRatings) ? summary.recentRatings : [];
  const fiveStarCount =
    breakdown.find((entry) => Number(entry.rating) === 5)?.count || 0;
  const fiveStarShare = totalRatings
    ? Math.round((Number(fiveStarCount) / totalRatings) * 100)
    : 0;

  if (dashboardAverage) {
    dashboardAverage.textContent =
      totalRatings && Number.isFinite(averageRating)
        ? averageRating.toFixed(1)
        : "--";
  }

  if (dashboardAverageNote) {
    dashboardAverageNote.textContent = totalRatings
      ? "Average out of 5"
      : "No saved ratings yet";
  }

  if (dashboardTotal) {
    dashboardTotal.textContent = String(totalRatings);
  }

  if (dashboardFiveStarShare) {
    dashboardFiveStarShare.textContent = formatRatingShare(fiveStarShare);
  }

  if (dashboardLastUpdated) {
    dashboardLastUpdated.textContent = formatDateTime(summary.lastUpdated);
  }

  if (dashboardBreakdown) {
    if (!breakdown.length) {
      dashboardBreakdown.innerHTML =
        '<p class="dashboard-empty">No ratings have been saved yet.</p>';
    } else {
      dashboardBreakdown.innerHTML = breakdown
        .sort((left, right) => Number(right.rating) - Number(left.rating))
        .map((entry) => {
          const share = totalRatings
            ? Math.round((Number(entry.count) / totalRatings) * 100)
            : 0;
          const trackWidth = share === 0 ? 0 : Math.max(share, 4);

          return `
            <div class="breakdown-row">
              <div class="breakdown-meta">
                <span>${escapeHtml(entry.rating)} star${Number(entry.rating) === 1 ? "" : "s"}</span>
                <strong>${escapeHtml(entry.count)}</strong>
              </div>
              <div class="breakdown-track" aria-hidden="true">
                <span style="width: ${trackWidth}%"></span>
              </div>
              <p class="breakdown-share">${share}% of saved ratings</p>
            </div>
          `;
        })
        .join("");
    }
  }

  if (dashboardRecent) {
    if (!recentRatings.length) {
      dashboardRecent.innerHTML =
        '<li class="dashboard-empty">Recent submissions will appear here.</li>';
    } else {
      dashboardRecent.innerHTML = recentRatings
        .map((entry) => {
          const starLabel = `${entry.rating}/5 stars`;

          return `
            <li class="recent-item">
              <span class="recent-rating">${escapeHtml(starLabel)}</span>
              <time datetime="${escapeHtml(entry.updatedAt)}">${escapeHtml(
                formatDateTime(entry.updatedAt)
              )}</time>
            </li>
          `;
        })
        .join("");
    }
  }
}

function setupOwnerDashboard() {
  if (!dashboardStatus) {
    return;
  }

  let latestRequestId = 0;

  showDashboardPlaceholder("Loading saved ratings...");

  if (dashboardKeyInput) {
    dashboardKeyInput.value = readStoredValue(dashboardKeyStorageKey) || "";
  }

  const loadSummary = async (dashboardKey = "") => {
    latestRequestId += 1;
    const requestId = latestRequestId;

    setDashboardStatus("Loading saved ratings...");

    try {
      const summary = await fetchDashboardSummary(dashboardKey);

      if (requestId !== latestRequestId) {
        return;
      }

      renderDashboardSummary(summary);

      if (dashboardKey) {
        saveStoredValue(dashboardKeyStorageKey, dashboardKey);
      } else {
        removeStoredValue(dashboardKeyStorageKey);
      }

      const totalRatings = Number(summary.totalRatings) || 0;
      const pluralSuffix = totalRatings === 1 ? "" : "s";

      setDashboardStatus(
        totalRatings
          ? `Showing ${totalRatings} saved rating${pluralSuffix}.`
          : "Dashboard is connected. No saved ratings yet.",
        "success"
      );
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      if (error instanceof Error && error.message === "unauthorized") {
        showDashboardPlaceholder("Enter the dashboard key to view ratings.");
        setDashboardStatus(
          "This summary is protected. Enter the owner dashboard key and load again.",
          "warning"
        );
        return;
      }

      showDashboardPlaceholder("The SafeMind server is not reachable right now.");
      setDashboardStatus(
        "Could not load ratings. Check that the SafeMind server is running.",
        "warning"
      );
    }
  };

  if (dashboardKeyForm) {
    dashboardKeyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const dashboardKey = dashboardKeyInput ? dashboardKeyInput.value.trim() : "";
      void loadSummary(dashboardKey);
    });
  }

  if (dashboardRefreshButton) {
    dashboardRefreshButton.addEventListener("click", () => {
      const dashboardKey = dashboardKeyInput ? dashboardKeyInput.value.trim() : "";
      void loadSummary(dashboardKey);
    });
  }

  void loadSummary(readStoredValue(dashboardKeyStorageKey) || "");
}

function setupRevealObserver() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!revealItems.length) {
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}

renderConditionCards();
renderConditionPage();

setupWebsiteRating();
setupOwnerDashboard();
setupRevealObserver();
