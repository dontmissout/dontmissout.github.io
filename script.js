console.log("Website loaded successfully!");

const eventsContainer = document.getElementById("events");

const event = {
    game: "Fortnite",
    title: "Winterfest Skins",
    type: "Skin",
    endDate: "2026-01-07"
};

function daysRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

eventsContainer.innerHTML = `
    <h2>${event.game}</h2>
    <h3>${event.title}</h3>
    <p>Type: ${event.type}</p>
    <p>Ends in ${daysRemaining(event.endDate)} days</p>
`;

