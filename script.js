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
const supabaseSettings =
  window.safeMindSupabase && typeof window.safeMindSupabase === "object"
    ? window.safeMindSupabase
    : {};
const supabaseSdk =
  window.supabase && typeof window.supabase.createClient === "function"
    ? window.supabase
    : null;

const moodButtons = document.querySelectorAll(".mood-pill");
const moodResponse = document.querySelector("#mood-response");
const ratingStars = document.querySelectorAll(".rating-star");
const ratingStarsGroup = document.querySelector(".rating-stars");
const ratingStatus = document.querySelector("#rating-status");
const ratingMeta = document.querySelector("#rating-meta");
const ownerAuthForm = document.querySelector("#owner-auth-form");
const ownerEmailInput = document.querySelector("#owner-email");
const ownerLogoutButton = document.querySelector("#owner-logout");
const dashboardRefreshButton = document.querySelector("#dashboard-refresh");
const dashboardStatus = document.querySelector("#dashboard-status");
const dashboardAccessNote = document.querySelector("#dashboard-access-note");
const dashboardUser = document.querySelector("#dashboard-user");
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

let fallbackVisitorId = null;
let supabaseClient = null;
let ownerAuthSubscription = null;
let ownerMagicLinkCooldownTimer = null;

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

function getSupabaseConfig() {
  const url =
    typeof supabaseSettings.url === "string" ? supabaseSettings.url.trim() : "";
  const anonKey =
    typeof supabaseSettings.anonKey === "string"
      ? supabaseSettings.anonKey.trim()
      : "";

  return {
    url,
    anonKey,
  };
}

function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();

  return Boolean(url && anonKey && supabaseSdk);
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !supabaseSdk) {
    return null;
  }

  supabaseClient = supabaseSdk.createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
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
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Feedback storage is not configured.");
  }

  const { error } = await client.rpc("submit_site_rating", {
    input_visitor_id: ensureVisitorId(),
    input_rating: rating,
  });

  if (error) {
    throw error;
  }
}

function setupWebsiteRating() {
  if (!ratingStars.length || !ratingStatus) {
    return;
  }

  let selectedRating = readSavedRating();
  let latestSubmissionId = 0;

  updateRatingState(selectedRating);

  if (isSupabaseConfigured()) {
    setRatingMeta(
      selectedRating
        ? "Your most recent rating is saved on this device and synced anonymously."
        : "Anonymous feedback is saved once per device."
    );
  } else {
    setRatingMeta(
      "Feedback storage is not connected yet. Add your Supabase settings to turn on live ratings.",
      "warning"
    );
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

      if (!isSupabaseConfigured()) {
        setRatingMeta(
          "Saved on this device. Connect Supabase to collect live ratings from all visitors.",
          "warning"
        );
        return;
      }

      setRatingMeta("Saving your anonymous feedback...");

      void submitRating(selectedRating)
        .then(() => {
          if (submissionId !== latestSubmissionId) {
            return;
          }

          setRatingMeta(
            "Anonymous feedback saved. Thank you for helping improve SafeMind.",
            "success"
          );
        })
        .catch(() => {
          if (submissionId !== latestSubmissionId) {
            return;
          }

          setRatingMeta(
            "Saved on this device, but live sync is unavailable right now.",
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

function renderDashboardSummary(summary) {
  if (!summary || typeof summary !== "object") {
    showDashboardPlaceholder("No ratings yet.");
    return;
  }

  const totalRatings = Number(summary.totalRatings) || 0;
  const averageRating = Number(summary.averageRating);
  const breakdown = Array.isArray(summary.breakdown) ? summary.breakdown : [];
  const recentRatings = Array.isArray(summary.recentRatings)
    ? summary.recentRatings
    : [];
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
        .slice()
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

function setOwnerUiState(user) {
  if (dashboardUser) {
    dashboardUser.textContent = user && user.email
      ? `Signed in as ${user.email}`
      : "Not signed in";
  }

  if (dashboardAccessNote) {
    dashboardAccessNote.textContent = user
      ? "Your session is active. If this account matches the owner access rule in Supabase, the rating summary will load below."
      : "Enter the owner email address to receive a secure magic link from Supabase.";
  }

  if (ownerLogoutButton) {
    ownerLogoutButton.hidden = !user;
  }
}

function getOwnerSendButton() {
  if (!ownerAuthForm) {
    return null;
  }

  return ownerAuthForm.querySelector('button[type="submit"]');
}

function setOwnerSendButtonLabel(label) {
  const ownerSendButton = getOwnerSendButton();

  if (!ownerSendButton) {
    return;
  }

  ownerSendButton.textContent = label;
}

function setOwnerSendButtonDisabled(isDisabled) {
  const ownerSendButton = getOwnerSendButton();

  if (!ownerSendButton) {
    return;
  }

  ownerSendButton.disabled = isDisabled;
}

function clearOwnerMagicLinkCooldown() {
  if (ownerMagicLinkCooldownTimer) {
    window.clearInterval(ownerMagicLinkCooldownTimer);
    ownerMagicLinkCooldownTimer = null;
  }

  setOwnerSendButtonDisabled(false);
  setOwnerSendButtonLabel("Email Magic Link");
}

function startOwnerMagicLinkCooldown(seconds) {
  let remainingSeconds = Math.max(0, Math.floor(seconds));

  clearOwnerMagicLinkCooldown();

  if (remainingSeconds === 0) {
    return;
  }

  setOwnerSendButtonDisabled(true);
  setOwnerSendButtonLabel(`Wait ${remainingSeconds}s`);

  ownerMagicLinkCooldownTimer = window.setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      clearOwnerMagicLinkCooldown();
      return;
    }

    setOwnerSendButtonLabel(`Wait ${remainingSeconds}s`);
  }, 1000);
}

function getOwnerRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

async function fetchCurrentOwner() {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getUser();

  if (error) {
    return null;
  }

  return data && data.user ? data.user : null;
}

async function requestOwnerMagicLink(email) {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getOwnerRedirectUrl(),
    },
  });

  if (error) {
    throw error;
  }
}

function isRateLimitError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = "status" in error ? Number(error.status) : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";

  return status === 429 || /too many requests|rate limit/i.test(message);
}

async function signOutOwner() {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

async function fetchDashboardSummary() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client.rpc("get_site_rating_summary");

  if (error) {
    throw error;
  }

  return data;
}

async function refreshOwnerDashboard() {
  if (!dashboardStatus) {
    return;
  }

  if (!isSupabaseConfigured()) {
    showDashboardPlaceholder("Add your Supabase project settings to load ratings.");
    setOwnerUiState(null);
    setDashboardStatus(
      "Supabase is not configured yet. Add your project URL and anon key in supabase-config.js.",
      "warning"
    );
    return;
  }

  setDashboardStatus("Checking owner session...");

  const user = await fetchCurrentOwner();

  setOwnerUiState(user);

  if (!user) {
    showDashboardPlaceholder("Sign in to load rating data.");
    setDashboardStatus(
      "Owner sign-in required. Enter your email to receive a magic link.",
      "warning"
    );
    return;
  }

  setDashboardStatus("Loading saved ratings...");

  try {
    const summary = await fetchDashboardSummary();

    renderDashboardSummary(summary);

    const totalRatings = Number(summary && summary.totalRatings) || 0;
    const pluralSuffix = totalRatings === 1 ? "" : "s";

    setDashboardStatus(
      totalRatings
        ? `Showing ${totalRatings} saved rating${pluralSuffix}.`
        : "Dashboard connected. No ratings have been saved yet.",
      "success"
    );
  } catch (error) {
    showDashboardPlaceholder("This account could not load the rating summary.");
    setDashboardStatus(
      "Signed in, but this account does not have dashboard access yet. Check the Supabase owner policy in supabase-setup.sql.",
      "warning"
    );
  }
}

function setupOwnerDashboard() {
  if (!dashboardStatus) {
    return;
  }

  showDashboardPlaceholder("Loading owner access...");
  setOwnerUiState(null);

  if (ownerAuthForm) {
    ownerAuthForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = ownerEmailInput ? ownerEmailInput.value.trim() : "";

      if (!email) {
        setDashboardStatus("Enter an email address to receive the owner magic link.", "warning");
        return;
      }

      if (!isSupabaseConfigured()) {
        setDashboardStatus(
          "Supabase is not configured yet. Add your project URL and anon key first.",
          "warning"
        );
        return;
      }

      setDashboardStatus("Sending owner magic link...");
      setOwnerSendButtonDisabled(true);
      setOwnerSendButtonLabel("Sending...");

      void requestOwnerMagicLink(email)
        .then(() => {
          startOwnerMagicLinkCooldown(60);
          setDashboardStatus(
            "Magic link sent. Open the email and return here to load the dashboard.",
            "success"
          );
        })
        .catch((error) => {
          if (isRateLimitError(error)) {
            startOwnerMagicLinkCooldown(60);
            setDashboardStatus(
              "Supabase is rate-limiting magic links right now. Wait at least 60 seconds, then try again.",
              "warning"
            );
            return;
          }

          clearOwnerMagicLinkCooldown();
          setDashboardStatus(
            "Could not send the magic link. Recheck your Supabase Auth email settings and redirect URL.",
            "warning"
          );
        });
    });
  }

  if (dashboardRefreshButton) {
    dashboardRefreshButton.addEventListener("click", () => {
      void refreshOwnerDashboard();
    });
  }

  if (ownerLogoutButton) {
    ownerLogoutButton.addEventListener("click", () => {
      setDashboardStatus("Signing out...");

      void signOutOwner()
        .then(() => {
          showDashboardPlaceholder("Signed out. Sign in again to load rating data.");
          setDashboardStatus("Signed out.", "success");
          setOwnerUiState(null);
        })
        .catch(() => {
          setDashboardStatus("Could not sign out right now.", "warning");
        });
    });
  }

  const client = getSupabaseClient();

  if (client && !ownerAuthSubscription) {
    const subscription = client.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        void refreshOwnerDashboard();
      }, 0);
    });

    ownerAuthSubscription = subscription && subscription.data
      ? subscription.data.subscription
      : null;
  }

  void refreshOwnerDashboard();
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
