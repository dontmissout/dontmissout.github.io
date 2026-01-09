const GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";
const SUBMISSIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";

let gamesMap = {};
let submissions = [];
let searchQuery = "";
let sortBy = "soonest"; // Default sort order

// 1. Fetch and Parse
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",").map(h => h.trim());

  return lines.map((line) => {
    const values = line.split(","); 
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ? values[i].trim() : "";
    });
    return obj;
  });
}

// 2. Build the Structure
function renderEvents() {
  const container = document.getElementById("games-container");
  container.innerHTML = "";

  const grouped = {};

  submissions.forEach((e) => {
    if (e.approved !== "TRUE") return;
    if (!gamesMap[e.game_key]) return;

    // Filter by search
    const searchText = `${gamesMap[e.game_key].display_name} ${e.event_title} ${e.type} ${e.submitted_by}`.toLowerCase();
    if (searchQuery && !searchText.includes(searchQuery)) return;

    // Don't show expired events
    const endDate = new Date(e.end_datetime_utc);
    if (new Date() > endDate) return; 

    if (!grouped[e.game_key]) {
      grouped[e.game_key] = {
        meta: gamesMap[e.game_key],
        events: []
      };
    }
    grouped[e.game_key].events.push(e);
  });

  // --- SORTING LOGIC START ---
  let sortedGroups = Object.values(grouped);

  if (sortBy === 'alpha') {
      // Sort Games Alphabetically
      sortedGroups.sort((a, b) => a.meta.display_name.localeCompare(b.meta.display_name));
  } else {
      // Sort Games by "Ending Soonest"
      sortedGroups.sort((a, b) => {
          const getEarliest = (group) => Math.min(...group.events.map(e => new Date(e.end_datetime_utc)));
          return getEarliest(a) - getEarliest(b);
      });
  }
  // --- SORTING LOGIC END ---

  // Render sorted groups
  sortedGroups.forEach((group) => {
    const game = group.meta;
    
    // Sort events INSIDE the card as well (Always soonest first inside the card)
    group.events.sort((a, b) => new Date(a.end_datetime_utc) - new Date(b.end_datetime_utc));

    const section = document.createElement("div");
    section.className = "game-section"; 
    // If searching, automatically open sections to show results
    if(searchQuery) section.classList.add("open");

    // Build header
    const header = document.createElement("div");
    header.className = "game-header";
    header.innerHTML = `
        <img src="${game.cover_image}" alt="${game.display_name}">
        <h2>${game.display_name}</h2>
        <span class="arrow">▶</span>
    `;

    header.addEventListener("click", () => {
        section.classList.toggle("open");
    });

    // Build Events Container
    const eventsDiv = document.createElement("div");
    eventsDiv.className = "events-container";

    group.events.forEach((ev) => {
        const card = document.createElement("div");
        card.className = "event-card";
        
        card.innerHTML = `
            <h3>${ev.event_title}</h3>
            <span class="event-type">${ev.type}</span>
            <div class="countdown" data-date="${ev.end_datetime_utc}">
                Loading...
            </div>
            <div class="submitter">Submitted by ${ev.submitted_by}</div>
        `;
        eventsDiv.appendChild(card);
    });

    section.appendChild(header);
    section.appendChild(eventsDiv);
    container.appendChild(section);
  });
  
  updateTimers();
}

// 3. Update Timers
function updateTimers() {
    const timerElements = document.querySelectorAll('.countdown');
    const now = new Date();

    timerElements.forEach(el => {
        const endDate = new Date(el.dataset.date);
        const total = endDate - now;

        if (total <= 0) {
            el.innerText = "Event Ended";
            el.parentElement.classList.add("expired");
            return;
        }

        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        el.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });
}

// 4. Initialize
Promise.all([
  fetch(GAMES_URL).then((r) => r.text()),
  fetch(SUBMISSIONS_URL).then((r) => r.text()),
]).then(([gamesCSV, subsCSV]) => {
  const gamesList = parseCSV(gamesCSV);
  gamesList.forEach((g) => { gamesMap[g.game_key] = g; });
  submissions = parseCSV(subsCSV);

  renderEvents();
  setInterval(updateTimers, 1000);
});

// 5. Event Listeners
document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderEvents();
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
    sortBy = e.target.value;
    renderEvents();
});
