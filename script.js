// --- Configuration ---
const GAMES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=623150298&single=true&output=csv";
const SUBMISSIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR76r__p7DDeh0CKE8pXB1Z1xDKXAkbtdauoyL4aYyeDrXQkbiOyojWIGl4WTxwcbdf4BaMtJ-FwPm9/pub?gid=0&single=true&output=csv";
const SERVICE_ID = "service_yfaukwg";
const TEMPLATE_ID = "template_rmz7ocl";

let gamesMap = {};
let submissions = [];
let searchQuery = "";
let sortBy = "soonest";

// --- Utilities ---
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

// --- Rendering Logic ---
function renderEvents() {
    const urgentBox = document.getElementById("container-urgent");
    const activeBox = document.getElementById("container-active");
    const libraryBox = document.getElementById("container-library");
    
    urgentBox.innerHTML = ""; activeBox.innerHTML = ""; libraryBox.innerHTML = "";

    const activeGroups = {};
    const urgentGroups = {};
    const gamesWithEvents = new Set();
    const now = new Date();

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
    
    // Library Grid Logic
    Object.values(gamesMap).forEach(g => {
        if (!gamesWithEvents.has(g.game_key)) {
            if (searchQuery && !g.display_name.toLowerCase().includes(searchQuery)) return;
            
            const card = document.createElement("div");
            card.className = "library-card"; 
            
            // IMPORTANT: This innerHTML includes the Overlay div!
            card.innerHTML = `
                <img src="${g.cover_image}">
                <h4>${g.display_name}</h4>
                <div class="library-overlay">
                    <p>No active events.</p>
                    <a href="mailto:dontmissoutdev@gmail.com?subject=Event Report for ${g.display_name}" class="email-link">Tell us!</a>
                </div>
            `;
            
            libraryBox.appendChild(card);
        }
    });
    updateTimers();
}

function buildAccordion(data, container) {
    Object.values(data).forEach(group => {
        const section = document.createElement("div");
        section.className = "game-section";
        section.innerHTML = `
            <div class="game-header">
                <img src="${group.meta.cover_image}">
                <span>${group.meta.display_name}</span>
            </div>
            <div class="events-container"></div>
        `;
        const eventBox = section.querySelector(".events-container");
        group.events.forEach(ev => {
            const el = document.createElement("div");
            el.className = "event-card";
            el.innerHTML = `<strong>${ev.event_title}</strong><div class="countdown" data-date="${ev.end_datetime_utc}"></div>`;
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
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.innerText = `${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`;
    });
}

// --- UI Actions ---
function renderSubList() {
    const box = document.getElementById("game-subscription-list");
    box.innerHTML = "";
    Object.values(gamesMap).sort((a,b) => a.display_name.localeCompare(b.display_name)).forEach(g => {
        const item = document.createElement("label");
        item.className = "checkbox-item";
        item.innerHTML = `<input type="checkbox" value="${g.display_name}" checked> ${g.display_name}`;
        box.appendChild(item);
    });
}

document.getElementById("toggleAllGames").onclick = () => {
    const cbs = document.querySelectorAll("#game-subscription-list input");
    const allOn = Array.from(cbs).every(c => c.checked);
    cbs.forEach(c => c.checked = !allOn);
    document.getElementById("toggleAllGames").innerText = allOn ? "Select All" : "Deselect All";
};

document.getElementById("subscribeForm").onsubmit = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector(".subscribe-submit");
    const selected = Array.from(document.querySelectorAll("#game-subscription-list input:checked")).map(i => i.value);
    
    if(selected.length === 0) { alert("Please select at least one game!"); return; }

    btn.innerText = "Sending...";
    emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        user_email: document.getElementById("userEmail").value,
        message: selected.join(", ")
    }).then(() => {
        alert("Subscribed!");
        document.getElementById("notifyModal").style.display = "none";
        btn.innerText = "Subscribe";
    });
};

document.getElementById("themeToggle").onclick = () => {
    const themes = ['dark', 'sunrise', 'light', 'sunset'];
    let current = document.body.getAttribute('data-theme');
    let next = themes[(themes.indexOf(current) + 1) % themes.length];
    
    document.body.setAttribute('data-theme', next);
    const icon = document.getElementById("themeIcon");
    icon.parentElement.classList.add('animate-icon');
    setTimeout(() => icon.parentElement.classList.remove('animate-icon'), 500);

    if (next === 'sunrise') icon.className = 'fa-solid fa-mountain-sun';
    else if (next === 'light') icon.className = 'fa-solid fa-sun';
    else if (next === 'sunset') icon.className = 'fa-solid fa-cloud-sun';
    else icon.className = 'fa-solid fa-moon';
};

document.getElementById("openNotify").onclick = () => {
    document.getElementById("notifyModal").style.display = "flex";
    renderSubList();
};

document.querySelector(".close-modal").onclick = () => document.getElementById("notifyModal").style.display = "none";

document.getElementById("searchInput").oninput = (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderEvents();
};

document.querySelectorAll(".category-header").forEach(h => {
    h.onclick = () => h.parentElement.classList.toggle("collapsed");
});

// --- Initialization ---
Promise.all([
    fetch(GAMES_URL).then(r => r.text()),
    fetch(SUBMISSIONS_URL).then(r => r.text())
]).then(([gCSV, sCSV]) => {
    parseCSV(gCSV).forEach(g => gamesMap[g.game_key] = g);
    submissions = parseCSV(sCSV);
    renderEvents();
    setInterval(updateTimers, 1000);
});

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2013789685278981"
     crossorigin="anonymous"></script>
