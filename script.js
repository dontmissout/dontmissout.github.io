console.log("Website loaded successfully!");

const eventsContainer = document.getElementById("events");

function timeRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
}

fetch("events.json")
    .then(res => res.json())
    .then(events => {
        const today = new Date();
        const games = {};

        events.forEach(event => {
            const eventEnd = new Date(event.endDate);
            if (eventEnd < today) return;

            if (!games[event.game]) {
                games[event.game] = {
                    cover: event.cover,
                    events: []
                };
            }

            games[event.game].events.push(event);
        });

        for (const gameName in games) {
            const section = document.createElement("div");
            section.className = "game-section collapsed";

            const header = document.createElement("div");
            header.className = "game-header";

            header.innerHTML = `
                <img src="${games[gameName].cover}" alt="${gameName}">
                <h2>${gameName}</h2>
                <span class="toggle-arrow">▼</span>
            `;

            const eventsWrapper = document.createElement("div");
            eventsWrapper.className = "game-events";

            games[gameName].events.forEach(event => {
                const card = document.createElement("div");
                card.className = "event-card";

                card.innerHTML = `
                    <h3>${event.title}</h3>
                    <p>Type: ${event.type}</p>
                    <p>Ends in ${timeRemaining(event.endDate)}</p>
                `;

                eventsWrapper.appendChild(card);
            });

            header.addEventListener("click", () => {
                section.classList.toggle("collapsed");
            });

            section.appendChild(header);
            section.appendChild(eventsWrapper);
            eventsContainer.appendChild(section);
        }
    })
    .catch(err => {
        console.error(err);
        eventsContainer.innerHTML = "<p>Failed to load events.</p>";
    });
