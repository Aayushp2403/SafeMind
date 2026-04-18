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

const conditionLibrary = Array.isArray(window.conditionLibrary)
  ? window.conditionLibrary
  : [];
const conditionBySlug = new Map(
  conditionLibrary.map((condition) => [condition.slug, condition])
);

const moodButtons = document.querySelectorAll(".mood-pill");
const moodResponse = document.querySelector("#mood-response");
const year = document.querySelector("#year");

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
  return value
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

setupRevealObserver();
