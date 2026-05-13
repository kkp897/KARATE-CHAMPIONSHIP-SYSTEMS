import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc
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

// =========================
// NEXT POWER OF 2
// =========================

function getBracketSize(n) {

  let size = 2;

  while (size < n) {
    size *= 2;
  }

  return size;
}

// =========================
// SMART PAIRING
// =========================

function smartPair(players) {

  const result = [];
  const used = new Set();

  for (
    let i = 0;
    i < players.length;
    i++
  ) {

    if (used.has(i))
      continue;

    let found = -1;

    // Prefer different academy
    // and coach
    for (
      let j = i + 1;
      j < players.length;
      j++
    ) {

      if (used.has(j))
        continue;

      const sameAcademy =
        players[i].academy ===
        players[j].academy;

      const sameCoach =
        players[i].coach ===
        players[j].coach;

      if (
        !sameAcademy &&
        !sameCoach
      ) {

        found = j;
        break;
      }
    }

    // fallback
    if (found === -1) {

      for (
        let j = i + 1;
        j < players.length;
        j++
      ) {

        if (
          !used.has(j)
        ) {

          found = j;
          break;
        }
      }
    }

    used.add(i);

    if (
      found !== -1
    ) {

      used.add(found);

      result.push([
        players[i],
        players[found]
      ]);

    } else {

      result.push([
        players[i],
        null
      ]);
    }
  }

  return result;
}

// =========================
// GENERATE FIXTURE
// =========================

async function generateFixture() {

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
        doc => doc.data()
      );

    const players =
      participants.filter(
        p => {

          const playerCategory =
            `${p.division} | ${p.gender} | ${p.kumiteCategory}`;

          return (
            p.checkedIn ===
              true &&

            (
              p.eventType ===
                "Kumite" ||

              p.eventType ===
                "Both"
            ) &&

            playerCategory ===
              category
          );
        }
      );

    if (
      players.length === 0
    ) {

      fixtureContainer.innerHTML =
        `
        <h2>
          No Players Found
        </h2>
        `;

      return;
    }

    // =====================
    // FIXTURE ID
    // =====================

    const fixtureId =
      category
        .replaceAll(
          "|",
          "_"
        )
        .replaceAll(
          " ",
          ""
        );

    const fixtureRef =
      doc(
        db,
        "fixtures",
        fixtureId
      );

    const existingFixture =
      await getDoc(
        fixtureRef
      );

    let rounds = [];

    // Load existing
    if (
      existingFixture.exists()
    ) {

      rounds =
  existingFixture
    .data()
    .rounds || [];

    }

    // Create new
    else {

      const rawBouts =
        smartPair(
          players
        );

     

const firstRound =
  rawBouts.map(
    (
      pair,
      index
    ) => ({

      boutNo:
        index + 1,

      aka:
        pair[0] || null,

      ao:
        pair[1] || null,

      winner:
        null,

      winnerSide:
        null
    })
  );

// Create future rounds
const rounds = [];

rounds.push({
  roundName:
    "Round 1",

  bouts:
    firstRound
});

let currentSize =
  firstRound.length;

let roundNo = 2;

while (
  currentSize > 1
) {

  const nextBouts =
    [];

  const matchCount =
    Math.ceil(
      currentSize / 2
    );

  for (
    let i = 0;
    i < matchCount;
    i++
  ) {

    nextBouts.push({

      boutNo:
        i + 1,

      aka:
        null,

      ao:
        null,

      winner:
        null,

      winnerSide:
        null
    });
  }

  rounds.push({

    roundName:
      `Round ${roundNo}`,

    bouts:
      nextBouts
  });

  currentSize =
    matchCount;

  roundNo++;
}

await setDoc(
  fixtureRef,
  {
    category,

    isLocked:
      false,

    createdAt:
      new Date()
        .toISOString(),

    rounds
  }
);
    }

    // =====================
    // ROUND NAME
    // =====================

    const bracketSize =
      getBracketSize(
        players.length
      );

    const byes =
      bracketSize -
      players.length;

    let roundName =
      "Final";

    if (
      bracketSize === 4
    ) {

      roundName =
        "Semi Final";
    }

    if (
      bracketSize >= 8
    ) {

      roundName =
        "Quarter Final";
    }

    // =====================
    // UI
    // =====================

    let html = `
      <div
        class="stat-card"
        style="
          padding:15px;
        "
      >

      <h2>
        ${category}
      </h2>

      <div
        style="
          display:flex;
          justify-content:
          space-between;
          margin-bottom:10px;
          font-size:14px;
        "
      >

        <span>
          Players:
          ${players.length}
        </span>

        <span>
          Byes:
          ${byes}
        </span>

      </div>

      <hr>

      <h3>
        ${roundName}
      </h3>
    `;

    rounds.forEach(
  (round) => {

    html += `
      <h3>
        ${round.roundName}
      </h3>
    `;

    round.bouts.forEach(
      (
        bout,
        index
      ) => {

        const player1 =
          bout.aka;

        const player2 =
          bout.ao;

        html += `
          <div
            class="fixture-card"
            style="
              background:#111827;
              padding:10px;
              border-radius:12px;
              margin-bottom:10px;
              border:1px solid #374151;
            "
          >

            <strong>
              Bout ${index + 1}
            </strong>

            <p>
              🔴 ${
                player1?.name ||
                "Waiting..."
              }
            </p>

            <p>
              🔵 ${
                player2?.name ||
                "Waiting..."
              }
            </p>

            ${
              bout.winner
              ? `
              <p
                style="
                  color:#22c55e;
                "
              >
                ✅ Winner:
                ${bout.winner.name}
              </p>
              `
              : ""
            }

          </div>
        `;
      }
    );
  }
);

    html += `
      </div>
    `;

    fixtureContainer.innerHTML =
      html;

  } catch (error) {

    console.error(
      error
    );

    fixtureContainer.innerHTML =
      `
      <h2>
        Error generating
        fixture
      </h2>
      `;
  }
}

generateFixture();