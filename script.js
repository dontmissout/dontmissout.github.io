const GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";
const SUBMISSIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";

const SERVICE_ID = "service_yfaukwg";
const TEMPLATE_ID = "template_rmz7ocl";

let gamesMap = {};
let submissions = [];
let searchQuery = "";
let sortBy = "soonest";

// CSV Parser
function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines.shift().split(",").map(h => h.trim());
    return lines.map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] ? values[i].trim() : ""; });
        return obj;
    });
}

// Render Core
function renderEvents() {
    const urgentCont = document.getElementById("container-urgent");
    const activeCont = document.getElementById("container-active");
    const libraryCont = document.getElementById("container-library");

    urgentCont.innerHTML = "";
    activeCont.innerHTML = "";
    libraryCont.innerHTML = "";

    const groupsActive = {};
    const groupsUrgent = {};
    const gamesWithEvents = new Set();
    const now = new Date();
    const urgentTime = 48 * 60 * 60 * 1000;

    submissions.forEach(e => {
        if (e.approved !== "TRUE" || !gamesMap[e.game_key]) return;
        
        const end = new Date(e.end_datetime_utc);
        if (isNaN(end.getTime()) || now > end) return;

        const text = `${gamesMap[e.game_key].display_name} ${e.event_title}`.toLowerCase();
        if (searchQuery && !text.includes(searchQuery)) return;

        gamesWithEvents.add(e.game_key);
        const targetGroup = (end - now <= urgentTime) ? groupsUrgent : groupsActive;
        
        if (!targetGroup[e.game_key]) targetGroup[e.game_key] = { meta: gamesMap[e.game_key], events: [] };
        targetGroup[e.game_key].events.push(e);
    });

    buildAccordion(groupsUrgent, urgentCont);
    buildAccordion(groupsActive, activeCont);
    buildLibrary(gamesWithEvents, libraryCont);
    updateTimers();
}

function buildAccordion(data, container) {
    Object.values(data).forEach(group => {
        const sec = document.createElement("div");
        sec.className = "game-section";
        sec.innerHTML = `
            <div class="game-header">
                <img src="${group.meta.cover_image}">
                <h3>${group.meta.display_name}</h3>
                <span class="game-arrow">▶</span>
            </div>
            <div class="events-container"></div>
        `;
        
        const eventsDiv = sec.querySelector(".events-container");
        group.events.forEach(ev => {
            const card = document.createElement("div");
            card.className = "event-card";
            card.innerHTML = `
                <div class="event-top"><strong>${ev.event_title}</strong><span>${ev.type}</span></div>
                <div class="countdown" data-date="${ev.end_datetime_utc}">--</div>
            `;
            eventsDiv.appendChild(card);
        });

        sec.querySelector(".game-header").onclick = () => sec.classList.toggle("open");
        container.appendChild(sec);
    });
}

function buildLibrary(activeSet, container) {
    const libGrid = document.createElement("div");
    libGrid.className = "library-grid";
    Object.values(gamesMap).forEach(g => {
        if (activeSet.has(g.game_key)) return;
        const card = document.createElement("div");
        card.className = "library-card";
        card.innerHTML = `<img src="${g.cover_image}"><h3>${g.display_name}</h3>`;
        libGrid.appendChild(card);
    });
    container.appendChild(libGrid);
}

function updateTimers() {
    document.querySelectorAll('.countdown').forEach(el => {
        const t = new Date(el.dataset.date) - new Date();
        if (t <= 0) return el.innerText = "Ended";
        const d = Math.floor(t / 86400000), h = Math.floor((t / 3600000) % 24), m = Math.floor((t / 60000) % 60), s = Math.floor((t / 1000) % 60);
        el.innerText = `${d}d ${h}h ${m}m ${s}s`;
    });
}

// Subscription Modal Logic
function renderSubscriptionList() {
    const cont = document.getElementById('game-subscription-list');
    cont.innerHTML = '';
    Object.values(gamesMap).sort((a,b) => a.display_name.localeCompare(b.display_name)).forEach(g => {
        const item = document.createElement('label');
        item.className = 'checkbox-item';
        item.innerHTML = `<input type="checkbox" value="${g.display_name}" checked>${g.display_name}`;
        cont.appendChild(item);
    });
}

// Initial Load
Promise.all([
    fetch(GAMES_URL).then(r => r.text()),
    fetch(SUBMISSIONS_URL).then(r => r.text())
]).then(([gCSV, sCSV]) => {
    parseCSV(gCSV).forEach(g => gamesMap[g.game_key] = g);
    submissions = parseCSV(sCSV);
    renderEvents();
    setInterval(updateTimers, 1000);
});

// Theme Switcher
const themes = ['dark', 'sunrise', 'light', 'sunset'];
let tIdx = 0;
document.getElementById('themeToggle').onclick = () => {
    tIdx = (tIdx + 1) % themes.length;
    document.body.setAttribute('data-theme', themes[tIdx]);
};

// Search
document.getElementById("searchInput").oninput = (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderEvents();
};

// Category Toggle
document.querySelectorAll('.category-header').forEach(h => {
    h.onclick = () => h.parentElement.classList.toggle('collapsed');
});

// Modal Logic
const modal = document.getElementById("notifyModal");
document.getElementById("openNotify").onclick = () => { modal.style.display = "flex"; renderSubscriptionList(); };
document.querySelector(".close-modal").onclick = () => modal.style.display = "none";

document.getElementById('subscribeForm').onsubmit = (e) => {
    e.preventDefault();
    const selected = Array.from(document.querySelectorAll('#game-subscription-list input:checked')).map(i => i.value);
    emailjs.send(SERVICE_ID, TEMPLATE_ID, { user_email: document.getElementById('userEmail').value, message: selected.join(", ") })
    .then(() => { alert("Subscribed!"); modal.style.display="none"; });
};
