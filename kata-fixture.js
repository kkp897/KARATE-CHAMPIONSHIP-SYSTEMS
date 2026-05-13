import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fixtureContainer =
  document.getElementById(
    "fixtureContainer"
  );

const params =
  new URLSearchParams(
    window.location.search
  );

const category =
  decodeURIComponent(
    params.get("category")
  );

// ======================
// SHUFFLE
// ======================

function shuffle(array) {

  const arr =
    [...array];

  for (
    let i =
      arr.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random()
        * (i + 1)
      );

    [
      arr[i],
      arr[j]
    ] = [
      arr[j],
      arr[i]
    ];
  }

  return arr;
}

// ======================
// SMART PAIRING
// Avoid same coach
// and academy
// ======================

function smartPair(
  players
) {

  const shuffled =
    shuffle(
      players
    );

  const result =
    [];

  const used =
    new Set();

  for (
    let i = 0;
    i <
    shuffled.length;
    i++
  ) {

    if (
      used.has(i)
    ) continue;

    let found =
      -1;

    for (
      let j = i + 1;
      j <
      shuffled.length;
      j++
    ) {

      if (
        used.has(j)
      ) continue;

      const sameCoach =
        shuffled[i]
          .coach ===
        shuffled[j]
          .coach;

      const sameAcademy =
        shuffled[i]
          .academy ===
        shuffled[j]
          .academy;

      if (
        !sameCoach &&
        !sameAcademy
      ) {

        found =
          j;
        break;
      }
    }

    used.add(i);

    if (
      found !== -1
    ) {

      used.add(
        found
      );

      result.push([
        shuffled[i],
        shuffled[
          found
        ]
      ]);

    } else {

      // odd player
      result.push([
        shuffled[i],
        null
      ]);
    }
  }

  return result;
}

// ======================
// LOAD FIXTURE
// ======================

async function
loadFixture() {

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
          id:
            doc.id,
          ...doc.data()
        })
      );

    const players =
      participants.filter(
        player => {

          const group =
            `${player.division} | ${player.gender} | Kata`;

          return (
            player.checkedIn &&
            (
              player.eventType ===
                "Kata" ||

              player.eventType ===
                "Both"
            ) &&
            group ===
              category
          );
        }
      );

    const matches =
      smartPair(
        players
      );

    renderFixture(
      matches,
      players.length
    );

  } catch (
    error
  ) {

    console.error(
      error
    );

    fixtureContainer.innerHTML =
      `
      <h2>
        Error loading
        kata sheet
      </h2>
      `;
  }
}

// ======================
// RENDER
// ======================

function renderFixture(
  matches,
  totalPlayers
) {

  let html = `
  <div class="stat-card">

    <h2>
      ${category}
    </h2>

    <p>
      Total Players:
      ${totalPlayers}
    </p>

    <hr>
  `;

  matches.forEach(
    (
      pair,
      index
    ) => {

      html += `
      <div
        class="fixture-card"
        style="
          background:#111827;
          padding:20px;
          border-radius:14px;
          margin-bottom:15px;
          border:1px solid #374151;
        "
      >

      <h3>
        Match
        ${index + 1}
      </h3>

      <p
        style="
          font-size:18px;
        "
      >
      🔴 AKA:
      ${
        pair[0]
          ?.name ||
        "-"
      }
      </p>

      <p
        style="
          font-size:18px;
        "
      >
      🔵 AO:
      ${
        pair[1]
          ?.name ||
        "Waiting"
      }
      </p>

      </div>
      `;
    }
  );

  html +=
    "</div>";

  fixtureContainer.innerHTML =
    html;
}

loadFixture();