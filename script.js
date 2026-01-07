console.log("Website loaded successfully!");

fetch("events.json")
  .then(res => res.json())
  .then(events => {
    const container = document.getElementById("games-container");
    if (!container) return;

    const games = {};

    events.forEach(e => {
      if (!games[e.game]) games[e.game] = [];
      games[e.game].push(e);
    });

    Object.keys(games).forEach(game => {
      const section = document.createElement("section");

      const header = document.createElement("div");
      header.className = "game-header";
      header.innerHTML = `
        <img src="${games[game][0].cover}">
        <h2>${game}</h2>
        <span class="arrow">▶</span>
      `;

      const list = document.createElement("div");
      list.className = "events hidden";

      games[game].forEach(ev => {
        const days = getDaysLeft(ev.endDate);
        if (days < 0) return;

        const item = document.createElement("div");
        item.className = "event";
        item.innerHTML = `
          <h3>${ev.title}</h3>
          <p>${ev.type}</p>
          <p class="countdown">Ends in: ${days} days</p>
        `;
        list.appendChild(item);
      });

      header.onclick = () => {
        list.classList.toggle("hidden");
        header.querySelector(".arrow").classList.toggle("open");
      };

      section.append(header, list);
      container.appendChild(section);
    });
  })
  .catch(err => console.error("ERROR:", err));

function getDaysLeft(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}
