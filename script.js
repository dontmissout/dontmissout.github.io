console.log("Website loaded successfully!");

fetch("events.json")
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById("games-container");

    const games = {};

    data.forEach(event => {
      if (!games[event.game]) {
        games[event.game] = [];
      }
      games[event.game].push(event);
    });

    for (const game in games) {
      const section = document.createElement("section");
      section.className = "game-section";

      const header = document.createElement("div");
      header.className = "game-header";

      header.innerHTML = `
        <img src="${games[game][0].cover}" alt="${game}">
        <h2>${game}</h2>
        <span class="arrow">▶</span>
      `;

      const eventsDiv = document.createElement("div");
      eventsDiv.className = "events hidden";

      games[game].forEach(event => {
        const daysLeft = getDaysRemaining(event.endDate);

        if (daysLeft < 0) return; // hide expired events

        const eventDiv = document.createElement("div");
        eventDiv.className = "event";

        eventDiv.innerHTML = `
          <h3>${event.title}</h3>
          <p>Type: ${event.type}</p>
          <p class="countdown">Ends in: ${daysLeft} days</p>
        `;

        eventsDiv.appendChild(eventDiv);
      });

      header.addEventListener("click", () => {
        eventsDiv.classList.toggle("hidden");
        header.querySelector(".arrow").classList.toggle("open");
      });

      section.appendChild(header);
      section.appendChild(eventsDiv);
      container.appendChild(section);
    }
  });

function getDaysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
