import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const generateBtn =
  document.getElementById("generateBtn");

const kumiteContainer =
  document.getElementById("kumiteContainer");

generateBtn.addEventListener(
  "click",
  async () => {

    kumiteContainer.innerHTML =
      "<h2>Loading Categories...</h2>";

    try {

      const snapshot =
        await getDocs(
          collection(db, "participants")
        );

      const participants =
        snapshot.docs.map(doc =>
          doc.data()
        );

      // Only Present + Kumite/Both
      const kumitePlayers =
        participants.filter(p => {

          return (
            p.checkedIn === true &&
            (
              p.eventType ===
                "Kumite" ||

              p.eventType ===
                "Both"
            )
          );
        });

      // Group Categories
      const groups = {};

      kumitePlayers.forEach(player => {

        // FIXED SINGLE LINE
        const groupName =
          `${player.division} | ${player.gender} | ${player.kumiteCategory}`;

        if (!groups[groupName]) {
          groups[groupName] = [];
        }

        groups[groupName]
          .push(player);
      });

      kumiteContainer.innerHTML = "";

      Object.keys(groups)
        .forEach(group => {

        const players =
          groups[group];

        const encoded =
          encodeURIComponent(group);

        const card =
          document.createElement("div");

        card.className =
          "stat-card";

        card.innerHTML = `
          <h2>${group}</h2>

          <p>
            ${players.length}
            Players
          </p>

          <button
            onclick="
              window.location.href=
              'fixture.html?category=${encoded}'
            "
          >
            Open Fixture
          </button>
        `;

        kumiteContainer
          .appendChild(card);
      });

      if (
        Object.keys(groups)
          .length === 0
      ) {

        kumiteContainer.innerHTML =
          `
          <h2>
            No Kumite Players Present
          </h2>
          `;
      }

    } catch (error) {

      console.error(error);

      kumiteContainer.innerHTML =
        `
        <h2>
          Error Loading Categories
        </h2>
        `;
    }
  }
);