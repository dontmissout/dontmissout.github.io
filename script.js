console.log("Website loaded successfully!");

let allEvents = [];

fetch("events.json")
  .then(res => res.json())
  .then(events => {
    allEvents = events;
    renderEvents();
    setInterval(renderEvents, 60000); // update every minute
  })
  .catch(err => console.error(err));

function renderEvents() {
  const container = document.getElementById("games-container");
  container.innerHTML = "";

  const games = {};

  allEvents.forEach(e => {
    if (!games[e.game]) games[e.game] = [];
    games[e.game].push(e);
  });

  Object.keys(games).forEach(game => {
    const section = document.createElement("section");

    const header = document.createElement("div");
    header.className = "game-header";
    header.innerHTML = `
      <img src="${games[game][0].cover}">
      <h2>${game}</h2>
      <span class="arrow">▶</span>
    `;

    const list = document.createElement("div");
    list.className = "events hidden";

    games[game].forEach(ev => {
      const remaining = getTimeRemaining(ev.endDate);
      if (remaining.total <= 0) return;

      const item = document.createElement("div");
      item.className = "event";

      if (remaining.total < 86400000 * 3) {
        item.classList.add("ending-soon");
      }

      item.innerHTML = `
        <h3>${ev.title}</h3>
        <p>${ev.type}</p>
        <p class="countdown">
          Ends in: ${remaining.days}d ${remaining.hours}h ${remaining.minutes}m
        </p>
      `;

      list.appendChild(item);
    });

    header.onclick = () => {
      list.classList.toggle("hidden");
      header.querySelector(".arrow").classList.toggle("open");
    };

    section.append(header, list);
    container.appendChild(section);
  });
}

function getTimeRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60)
  };
}
