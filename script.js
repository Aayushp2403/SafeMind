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

const moodButtons = document.querySelectorAll(".mood-pill");
const moodResponse = document.querySelector("#mood-response");
const revealItems = document.querySelectorAll(".reveal");
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
