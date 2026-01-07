const SUBMISSIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";
const GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";

let gamesMap = {};
let submissions = [];

Promise.all([
  fetch(GAMES_URL).then(res => res.text()),
  fetch(SUBMISSIONS_URL).then(res => res.text())
])
.then(([gamesCSV, subsCSV]) => {
  gamesMap = mapGames(parseCSV(gamesCSV));
  submissions = parseCSV(subsCSV);
  renderEvents();
  setInterval(renderEvents, 60000);
})
.catch(err => {
  console.error("FETCH ERROR:", err);
});

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
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

function mapGames(rows) {
  const map = {};
  rows.forEach(g => {
    map[g.game_key] = {
      display_name: g.display_name,
      cover_image: g.cover_image
    };
  });
  return map;
}

function renderEvents() {
  const container = document.getElementById("games-container");
  container.innerHTML = "";

  const grouped = {};

  submissions.forEach(e => {
    if (e.approved !== "TRUE") return;
    if (!gamesMap[e.game_key]) return;

    const remaining = getTimeRemaining(e.end_datetime_utc);
    if (remaining.total <= 0) return;

    if (!grouped[e.game_key]) {
      grouped[e.game_key] = {
        name: gamesMap[e.game_key].display_name,
        cover: gamesMap[e.game_key].cover_image,
        events: []
      };
    }

    grouped[e.game_key].events.push({ ...e, remaining });
  });

  Object.values(grouped).forEach(game => {
    const section = document.createElement("section");

    const header = document.createElement("div");
    header.className = "game-header";
    header.innerHTML = `
      <img src="${game.cover}">
      <h2>${game.name}</h2>
      <span class="arrow">▶</span>
    `;

    const list = document.createElement("div");
    list.className = "events hidden";

    game.events.forEach(ev => {
      const item = document.createElement("div");
      item.className = "event";
      item.innerHTML = `
        <h3>${ev.event_title}</h3>
        <p>${ev.type}</p>
        <p class="countdown">
          Ends in: ${ev.remaining.days}d ${ev.remaining.hours}h ${ev.remaining.minutes}m
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
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return { total: 0 };

  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60)
  };
}
