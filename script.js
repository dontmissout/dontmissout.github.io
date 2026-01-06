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
    .then(response => response.json())
    .then(events => {
        const eventsByGame = {};

        const today = new Date();

events.forEach(event => {
    const eventEnd = new Date(event.endDate);
    if (eventEnd < today) return;

    if (!eventsByGame[event.game]) {
        eventsByGame[event.game] = [];
    }
    eventsByGame[event.game].push(event);
});

            if (!eventsByGame[event.game]) {
                eventsByGame[event.game] = [];
            }
            eventsByGame[event.game].push(event);
        });

        for (const game in eventsByGame) {
            const gameSection = document.createElement("div");
            gameSection.className = "game-section";
            gameSection.innerHTML = `<h2>${game}</h2>`;

            eventsByGame[game].forEach(event => {
                const eventCard = document.createElement("div");
                eventCard.className = "event-card";

                eventCard.innerHTML = `
                    <h3>${event.title}</h3>
                    <p>Type: ${event.type}</p>
                    <p>Ends in ${timeRemaining(event.endDate)}</p>
                `;

                gameSection.appendChild(eventCard);
            });

            eventsContainer.appendChild(gameSection);
        }
    })
    .catch(error => {
        console.error("Failed to load events:", error);
        eventsContainer.innerHTML = "<p>Failed to load events.</p>";
    });

setInterval(() => {
    location.reload();
}, 60000);
