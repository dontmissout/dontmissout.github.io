const GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";
const SUBMISSIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";

let gamesMap = {};
let submissions = [];
let searchQuery = "";
let sortBy = "soonest"; 

// 1. Data Parsing
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",").map(h => h.trim());
  return lines.map((line) => {
    const values = line.split(","); 
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ? values[i].trim() : ""; });
    return obj;
  });
}

// 2. Main Logic
function renderEvents() {
  // Clear both containers
  const urgentContainer = document.getElementById("container-urgent");
  const allContainer = document.getElementById("container-all");
  urgentContainer.innerHTML = "";
  allContainer.innerHTML = "";

  // Grouping objects
  const groupsAll = {};
  const groupsUrgent = {};
  const now = new Date();
  const urgentThreshold = 48 * 60 * 60 * 1000; // 48 Hours in milliseconds

  submissions.forEach((e) => {
    if (e.approved !== "TRUE") return;
    if (!gamesMap[e.game_key]) return;

    // Search Filter
    const searchText = `${gamesMap[e.game_key].display_name} ${e.event_title} ${e.type}`.toLowerCase();
    if (searchQuery && !searchText.includes(searchQuery)) return;

    const endDate = new Date(e.end_datetime_utc);
    if (isNaN(endDate.getTime())) return; // Invalid date
    if (now > endDate) return; // Expired

    const timeDiff = endDate - now;

    // Add to "All" Group
    addToGroup(groupsAll, e);

    // Add to "Urgent" Group if < 48 hours
    if (timeDiff <= urgentThreshold) {
        addToGroup(groupsUrgent, e);
    }
  });

  // Render the lists
  renderList(groupsAll, allContainer);
  
  // If no urgent events, show a placeholder or just leave empty
  if (Object.keys(groupsUrgent).length === 0) {
      urgentContainer.innerHTML = "<div style='padding:20px; color:#94a3b8; text-align:center;'>No events ending soon.</div>";
  } else {
      renderList(groupsUrgent, urgentContainer);
  }
  
  // If searching, auto-expand the categories
  if (searchQuery) {
      document.querySelectorAll('.category-section').forEach(el => el.classList.remove('collapsed'));
  }

  updateTimers();
}

// Helper to push to groups
function addToGroup(groupObj, event) {
    if (!groupObj[event.game_key]) {
        groupObj[event.game_key] = {
            meta: gamesMap[event.game_key],
            events: []
        };
    }
    groupObj[event.game_key].events.push(event);
}

// Helper to Render a specific dictionary of groups into a DOM container
function renderList(groupedData, domContainer) {
    let sortedGroups = Object.values(groupedData);

    // Sort Logic
    if (sortBy === 'alpha') {
        sortedGroups.sort((a, b) => a.meta.display_name.localeCompare(b.meta.display_name));
    } else {
        sortedGroups.sort((a, b) => {
            const getMin = (g) => Math.min(...g.events.map(e => new Date(e.end_datetime_utc).getTime())) || 9999999999999;
            return getMin(a) - getMin(b);
        });
    }

    sortedGroups.forEach((group) => {
        const game = group.meta;
        // Sort events inside card
        group.events.sort((a, b) => new Date(a.end_datetime_utc) - new Date(b.end_datetime_utc));

        const section = document.createElement("div");
        section.className = "game-section";
        if(searchQuery) section.classList.add("open"); // Auto open on search

        // Header
        const header = document.createElement("div");
        header.className = "game-header";
        header.innerHTML = `
            <img src="${game.cover_image}" alt="${game.display_name}">
            <h3>${game.display_name}</h3>
            <span class="game-arrow">▶</span>
        `;
        header.addEventListener("click", () => section.classList.toggle("open"));

        // Events
        const eventsDiv = document.createElement("div");
        eventsDiv.className = "events-container";

        group.events.forEach((ev) => {
            const card = document.createElement("div");
            card.className = "event-card";
            card.innerHTML = `
                <div class="event-top">
                    <span class="event-title">${ev.event_title}</span>
                    <span class="event-tag">${ev.type}</span>
                </div>
                <div class="countdown" data-date="${ev.end_datetime_utc}">Loading...</div>
                <div class="submitter">By ${ev.submitted_by}</div>
            `;
            eventsDiv.appendChild(card);
        });

        section.appendChild(header);
        section.appendChild(eventsDiv);
        domContainer.appendChild(section);
    });
}

// 3. Timer Logic
function updateTimers() {
    const now = new Date();
    document.querySelectorAll('.countdown').forEach(el => {
        const endDate = new Date(el.dataset.date);
        const total = endDate - now;

        if (total <= 0) {
            el.innerText = "Event Ended";
            el.parentElement.classList.add("expired");
            return;
        }

        const d = Math.floor(total / (1000 * 60 * 60 * 24));
        const h = Math.floor((total / (1000 * 60 * 60)) % 24);
        const m = Math.floor((total / 1000 / 60) % 60);
        const s = Math.floor((total / 1000) % 60);

        el.innerText = `${d}d ${h}h ${m}m ${s}s`;
    });
}

// 4. Initializers & Listeners
// Handle Main Category Toggles
document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', function() {
        this.parentElement.classList.toggle('collapsed');
    });
});

Promise.all([
  fetch(GAMES_URL).then(r => r.text()),
  fetch(SUBMISSIONS_URL).then(r => r.text()),
]).then(([gamesCSV, subsCSV]) => {
  const gamesList = parseCSV(gamesCSV);
  gamesList.forEach(g => { gamesMap[g.game_key] = g; });
  submissions = parseCSV(subsCSV);

  renderEvents();
  setInterval(updateTimers, 1000);
});

document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderEvents();
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
    sortBy = e.target.value;
    renderEvents();
});
