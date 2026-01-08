const GAMES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";
const SUBMISSIONS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";

let gamesMap = {};
let submissions = [];
let searchQuery = "";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });
    return obj;
  });
}

function getTimeRemaining(endDate) {
  const total = new Date(endDate) - new Date();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

function renderEvents() {
  const container = document.getElementById("games");
  container.innerHTML = "";

  const grouped = {};

  submissions.forEach(e => {
    if (e.approved !== "TRUE") return;
    if (!gamesMap[e.game_key]) return;

    const remaining = getTimeRemaining(e.end_datetime_utc);
    if (remaining.total <= 0) return;

    const searchText = `
      ${gamesMap[e.game_key].display_name}
      ${e.event_title}
      ${e.type}
      ${e.submitted_by}
    `.toLowerCase();

    if (searchQuery && !searchText.includes(searchQuery)) return;

    if (!grouped[e.game_key]) {
      grouped[e.game_key] = {
        display_name: gamesMap[e.game_key].display_name,
        cover: gamesMap[e.game_key].cover_image,
        events: []
      };
    }

    grouped[e.game_key].events.push({ ...e, remaining });
  });

  Object.values(grouped).forEach(game => {
    const section = document.createElement("section");
    section.className = "game-section";

    section.innerHTML = `
      <div class="game-header">
        <img src="${game.cover}" alt="${game.display_name}">
        <h2>${game.display_name}</h2>
      </div>
      <div class="events"></div>
    `;

    const eventsDiv = section.querySelector(".events");

    game.events.forEach(ev => {
      const el = document.createElement("div");
      el.className = "event-card";

      el.innerHTML = `
        <h3>${ev.event_title}</h3>
        <p>${ev.type}</p>
        <p class="countdown">
          ${ev.remaining.days}d
          ${ev.remaining.hours}h
          ${ev.remaining.minutes}m
          ${ev.remaining.seconds}s
        </p>
        <small>Submitted by ${ev.submitted_by}</small>
      `;

      eventsDiv.appendChild(el);
    });

    container.appendChild(section);
  });
}

Promise.all([
  fetch(GAMES_URL).then(r => r.text()),
  fetch(SUBMISSIONS_URL).then(r => r.text())
]).then(([gamesCSV, subsCSV]) => {
  const games = parseCSV(gamesCSV);
  submissions = parseCSV(subsCSV);

  games.forEach(g => {
    gamesMap[g.game_key] = g;
  });

  renderEvents();

  setInterval(renderEvents, 1000);
});

document.addEventListener("input", e => {
  if (e.target.id === "searchInput") {
    searchQuery = e.target.value.toLowerCase();
    renderEvents();
  }
});

