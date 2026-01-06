console.log("Website loaded successfully!");

const events = [
    {
        game: "Fortnite",
        title: "Winterfest Skins",
        type: "Skin",
        endDate: "2026-01-07"
    },
    {
        game: "Fortnite",
        title: "Christmas Challenges",
        type: "Event",
        endDate: "2026-01-05"
    },
    {
        game: "The Finals",
        title: "Twitch Drops",
        type: "Drop",
        endDate: "2026-01-09"
    }
];

const eventsContainer = document.getElementById("events");

function daysRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const eventsByGame = {};

events.forEach(event => {
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
            <p>Ends in ${daysRemaining(event.endDate)} days</p>
        `;

        gameSection.appendChild(eventCard);
    });

    eventsContainer.appendChild(gameSection);
}
