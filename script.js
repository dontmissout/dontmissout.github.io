// --- Configuration ---
const GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";
const SUBMISSIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";
const SERVICE_ID = "service_yfaukwg";
const TEMPLATE_ID = "template_rmz7ocl";

let gamesMap = {};
let submissions = [];
let searchQuery = "";

function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines.shift().split(",").map(h => h.trim());
    return lines.map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ""; });
        return obj;
    });
}

function renderEvents() {
    const urgentBox = document.getElementById("container-urgent");
    const activeBox = document.getElementById("container-active");
    const libraryBox = document.getElementById("container-library");
    
    urgentBox.innerHTML = ""; activeBox.innerHTML = ""; libraryBox.innerHTML = "";
    const activeGroups = {}, urgentGroups = {}, gamesWithEvents = new Set(), now = new Date();

    submissions.forEach(e => {
        if (e.approved !== "TRUE" || !gamesMap[e.game_key]) return;
        const endDate = new Date(e.end_datetime_utc);
        if (isNaN(endDate) || now > endDate) return;
        const searchText = `${gamesMap[e.game_key].display_name} ${e.event_title}`.toLowerCase();
        if (searchQuery && !searchText.includes(searchQuery)) return;

        gamesWithEvents.add(e.game_key);
        const diff = endDate - now;
        const targetGroup = diff < (48 * 60 * 60 * 1000) ? urgentGroups : activeGroups;
        if (!targetGroup[e.game_key]) targetGroup[e.game_key] = { meta: gamesMap[e.game_key], events: [] };
        targetGroup[e.game_key].events.push(e);
    });

    buildAccordion(urgentGroups, urgentBox);
    buildAccordion(activeGroups, activeBox);
    
    Object.values(gamesMap).forEach(g => {
        if (!gamesWithEvents.has(g.game_key)) {
            if (searchQuery && !g.display_name.toLowerCase().includes(searchQuery)) return;
            const card = document.createElement("div");
            card.className = "library-card"; 
            card.innerHTML = `
                <img src="${g.cover_image}" onerror="this.src='https://via.placeholder.com/60?text=Game'">
                <h4>${g.display_name}</h4>
                <div class="library-overlay">
                    <p style="font-size:0.8rem; margin-bottom:8px;">No active events.</p>
                    <a href="mailto:dontmissoutdev@gmail.com?subject=Event Report: ${g.display_name}" class="email-link">Email Us!</a>
                </div>`;
            libraryBox.appendChild(card);
        }
    });
}

function buildAccordion(data, container) {
    Object.values(data).forEach(group => {
        const section = document.createElement("div");
        section.className = "game-section";
        section.innerHTML = `
            <div class="game-header"><img src="${group.meta.cover_image}" onerror="this.src='https://via.placeholder.com/40'"><span>${group.meta.display_name}</span></div>
            <div class="events-container"></div>`;
        const eventBox = section.querySelector(".events-container");
        group.events.forEach(ev => {
            const el = document.createElement("div");
            el.className = "event-card";
            el.innerHTML = `<div style="padding:10px 15px;"><strong>${ev.event_title}</strong><div class="countdown" data-date="${ev.end_datetime_utc}" style="color:var(--accent); font-family:monospace; margin-top:5px;"></div></div>`;
            eventBox.appendChild(el);
        });
        section.querySelector(".game-header").onclick = () => section.classList.toggle("open");
        container.appendChild(section);
    });
}

function updateTimers() {
    const now = new Date();
    document.querySelectorAll(".countdown").forEach(el => {
        const diff = new Date(el.dataset.date) - now;
        if (diff <= 0) { el.innerText = "Ended"; return; }
        const d = Math.floor(diff / 86400000), h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
        el.innerText = `${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`;
    });
}

// UI Actions
document.getElementById("openPrivacy").onclick = (e) => { e.preventDefault(); document.getElementById("privacyModal").style.display = "flex"; };
document.getElementById("closePrivacy").onclick = () => { document.getElementById("privacyModal").style.display = "none"; };
document.getElementById("openNotify").onclick = () => { document.getElementById("notifyModal").style.display = "flex"; };
document.querySelectorAll(".close-modal").forEach(btn => btn.onclick = () => { 
    document.getElementById("notifyModal").style.display = "none"; 
    document.getElementById("privacyModal").style.display = "none"; 
});

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = "none";
};

document.getElementById("searchInput").oninput = (e) => { searchQuery = e.target.value.toLowerCase(); renderEvents(); };

document.querySelectorAll(".category-header").forEach(h => {
    h.onclick = () => h.parentElement.classList.toggle("collapsed");
});

document.getElementById("themeToggle").onclick = () => {
    const themes = ['dark', 'sunrise', 'light', 'sunset'];
    let current = document.body.getAttribute('data-theme');
    let next = themes[(themes.indexOf(current) + 1) % themes.length];
    document.body.setAttribute('data-theme', next);
    const icon = document.getElementById("themeIcon");
    if (next === 'sunrise') icon.className = 'fa-solid fa-mountain-sun';
    else if (next === 'light') icon.className = 'fa-solid fa-sun';
    else if (next === 'sunset') icon.className = 'fa-solid fa-cloud-sun';
    else icon.className = 'fa-solid fa-moon';
};

// Initialization
Promise.all([
    fetch(GAMES_URL).then(r => r.text()),
    fetch(SUBMISSIONS_URL).then(r => r.text())
]).then(([gCSV, sCSV]) => {
    parseCSV(gCSV).forEach(g => gamesMap[g.game_key] = g);
    submissions = parseCSV(sCSV);
    renderEvents();
    setInterval(updateTimers, 1000);
});
