const GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";
const SUBMISSIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";

let gamesMap = {};
let submissions = [];
let searchQuery = "";
let sortBy = "soonest"; 

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

function renderEvents() {
  const urgentContainer = document.getElementById("container-urgent");
  const activeContainer = document.getElementById("container-active");
  const libraryContainer = document.getElementById("container-library");
  
  urgentContainer.innerHTML = "";
  activeContainer.innerHTML = "";
  libraryContainer.innerHTML = "";

  const groupsActive = {};
  const groupsUrgent = {};
  
  // Keep track of which games have active events
  const gamesWithEvents = new Set();
  
  const now = new Date();
  const urgentThreshold = 48 * 60 * 60 * 1000; // 48 Hours

  // 1. Process Active Events
  submissions.forEach((e) => {
    if (e.approved !== "TRUE") return;
    if (!gamesMap[e.game_key]) return;

    const searchText = `${gamesMap[e.game_key].display_name} ${e.event_title} ${e.type}`.toLowerCase();
    if (searchQuery && !searchText.includes(searchQuery)) return;

    const endDate = new Date(e.end_datetime_utc);
    if (isNaN(endDate.getTime())) return;
    if (now > endDate) return; // Expired

    // Mark this game as having something happening
    gamesWithEvents.add(e.game_key);

    const timeDiff = endDate - now;

    if (timeDiff <= urgentThreshold) {
        addToGroup(groupsUrgent, e);
    } else {
        addToGroup(groupsActive, e);
    }
  });

  // 2. Process Library (Games with NO active events)
  const libraryGames = [];
  Object.values(gamesMap).forEach(game => {
      // If searching, filter library too
      if (searchQuery && !game.display_name.toLowerCase().includes(searchQuery)) return;

      // Only add if it DOESN'T have an active event
      if (!gamesWithEvents.has(game.game_key)) {
          libraryGames.push(game);
      }
  });

  // 3. Render
  renderAccordionList(groupsUrgent, urgentContainer);
  renderAccordionList(groupsActive, activeContainer);
  renderLibraryList(libraryGames, libraryContainer);
  
  // Empty State Handlers
  if (Object.keys(groupsUrgent).length === 0) urgentContainer.innerHTML = "<div style='padding:20px; color:#94a3b8; text-align:center;'>No urgent events.</div>";
  if (Object.keys(groupsActive).length === 0) activeContainer.innerHTML = "<div style='padding:20px; color:#94a3b8; text-align:center;'>No active events.</div>";
  
  updateTimers();
}

// Helper: Add to dictionary
function addToGroup(groupObj, event) {
    if (!groupObj[event.game_key]) {
        groupObj[event.game_key] = {
            meta: gamesMap[event.game_key],
            events: []
        };
    }
    groupObj[event.game_key].events.push(event);
}

// Helper: Render standard Accordions (Active/Urgent)
function renderAccordionList(groupedData, domContainer) {
    let sortedGroups = Object.values(groupedData);

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
        group.events.sort((a, b) => new Date(a.end_datetime_utc) - new Date(b.end_datetime_utc));

        const section = document.createElement("div");
        section.className = "game-section";
        if(searchQuery) section.classList.add("open"); 

        const header = document.createElement("div");
        header.className = "game-header";
        header.innerHTML = `
            <img src="${game.cover_image}" alt="${game.display_name}">
            <h3>${game.display_name}</h3>
            <span class="game-arrow">▶</span>
        `;
        header.addEventListener("click", () => section.classList.toggle("open"));

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

// Helper: Render Library Grid (Quiet games)
function renderLibraryList(gamesList, domContainer) {
    // Always alphabetical for library
    gamesList.sort((a, b) => a.display_name.localeCompare(b.display_name));

    gamesList.forEach(game => {
        const card = document.createElement("div");
        card.className = "library-card";
        card.innerHTML = `
            <img src="${game.cover_image}" alt="${game.display_name}">
            <h3>${game.display_name}</h3>
            <div class="library-overlay">
                <p>No events yet.</p>
                <p style="font-size:0.75rem; color:#94a3b8; margin-bottom:12px;">Think this is a mistake?</p>
                <a href="mailto:dontmissoutdev@gmail.com?subject=Event Report for ${game.display_name}" class="email-link">Tell us!</a>
            </div>
        `;
        domContainer.appendChild(card);
    });
}

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
