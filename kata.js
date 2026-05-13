import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const generateBtn =
  document.getElementById(
    "generateBtn"
  );

const kataContainer =
  document.getElementById(
    "kataContainer"
  );

generateBtn.addEventListener(
  "click",
  async () => {

    kataContainer.innerHTML =
      "<h2>Loading Categories...</h2>";

    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            "participants"
          )
        );

      const participants =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

      // ==================
      // FILTER KATA
      // ==================

      const kataPlayers =
        participants.filter(
          player => {

            return (
              player.checkedIn ===
                true &&

              (
                player.eventType ===
                  "Kata" ||

                player.eventType ===
                  "Both"
              )
            );
          }
        );

      // ==================
      // GROUP CATEGORIES
      // ==================

      const groups = {};

      kataPlayers.forEach(
        player => {

          const groupName =
            `${player.division} | ${player.gender} | Kata`;

          if (
            !groups[groupName]
          ) {

            groups[
              groupName
            ] = [];
          }

          groups[
            groupName
          ].push(player);
        }
      );

      kataContainer.innerHTML =
        "";

      const categories =
        Object.keys(groups);

      if (
        categories.length ===
        0
      ) {

        kataContainer.innerHTML =
          `
          <h2>
            No Kata Players
            Checked In
          </h2>
          `;

        return;
      }

      categories.forEach(
        category => {

          const players =
            groups[
              category
            ];

          const encoded =
            encodeURIComponent(
              category
            );

          const card =
            document.createElement(
              "div"
            );

          card.className =
            "stat-card";

          card.style.marginBottom =
            "20px";

         card.innerHTML =
`
<h2>
  ${category}
</h2>

<p>
  ${players.length}
  Players
</p>

<button
  onclick="
    window.location.href=
    'kata-fixture.html?category=${encoded}'
  "
>
  Open Fixture
</button>
`;
          kataContainer
            .appendChild(card);
        }
      );

    } catch (error) {

      console.error(error);

      kataContainer.innerHTML =
        `
        <h2>
          Error Loading
          Categories
        </h2>
        `;
    }
  }
);