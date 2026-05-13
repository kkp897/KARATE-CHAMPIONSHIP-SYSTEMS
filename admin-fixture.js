import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
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

// ========================
// SMART PAIRING
// ========================

function smartPair(players) {

  const result = [];
  const used = new Set();

  for (let i = 0; i < players.length; i++) {

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

// ========================
// BUILD ROUNDS
// ========================

function buildRounds(players) {

  const rawBouts =
    smartPair(players);

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

  return rounds;
}

// ========================
// LOAD FIXTURE
// ========================

async function loadFixture() {

  try {

    const fixtureId =
      category
        .replaceAll("|", "_")
        .replaceAll(" ", "");

    const fixtureRef =
      doc(
        db,
        "fixtures",
        fixtureId
      );

    const fixtureSnap =
      await getDoc(
        fixtureRef
      );

    if (
      !fixtureSnap.exists()
    ) {

      fixtureContainer.innerHTML =
        `
        <h2>
          Fixture not found
        </h2>
        `;

      return;
    }

    const fixtureData =
      fixtureSnap.data();

    const rounds =
      fixtureData.rounds || [];

    const isLocked =
      fixtureData.isLocked
      || false;

    // =====================
    // GET PLAYERS
    // =====================

    const participantSnap =
      await getDocs(
        collection(
          db,
          "participants"
        )
      );

    const participants =
      participantSnap.docs
        .map(doc =>
          doc.data()
        )
        .filter(p => {

          const playerCategory =
            `${p.division} | ${p.gender} | ${p.kumiteCategory}`;

          return (
            p.checkedIn &&
            (
              p.eventType ===
                "Kumite" ||

              p.eventType ===
                "Both"
            ) &&
            playerCategory ===
              category
          );
        });

    let html = `
      <div class="stat-card">

        <h2>
          ${category}
        </h2>
    `;

    rounds.forEach(
      (
        round,
        roundIndex
      ) => {

        html += `
          <h2
            style="
              margin-top:30px;
              color:#facc15;
            "
          >
            ${round.roundName}
          </h2>
        `;

        round.bouts.forEach(
          (
            bout,
            index
          ) => {

            html += `
              <div
                class="fixture-card"
                style="
                  background:#111827;
                  padding:15px;
                  border-radius:14px;
                  margin-bottom:15px;
                  border:1px solid #374151;
                "
              >

                <h3>
                  Bout ${index + 1}
                </h3>

                <label>
                  🔴 AKA
                </label>

                <select
                  id="aka-${roundIndex}-${index}"
                >
                  <option value="">
                    Select Player
                  </option>
            `;

            participants.forEach(
              player => {

                html += `
                  <option
                    value="${player.name}"

                    ${
                      bout.aka?.name ===
                      player.name
                      ? "selected"
                      : ""
                    }
                  >
                    ${player.name}
                  </option>
                `;
              }
            );

            html += `
                </select>

                <br><br>

                <label>
                  🔵 AO
                </label>

                <select
                  id="ao-${roundIndex}-${index}"
                >

                  <option
                    value="BYE"

                    ${
                      !bout.ao
                      ? "selected"
                      : ""
                    }
                  >
                    🟡 BYE
                  </option>
            `;

            participants.forEach(
              player => {

                html += `
                  <option
                    value="${player.name}"

                    ${
                      bout.ao?.name ===
                      player.name
                      ? "selected"
                      : ""
                    }
                  >
                    ${player.name}
                  </option>
                `;
              }
            );

            html += `
                </select>

                <div
                  style="
                    margin-top:15px;
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                  "
                >
            `;

            if (
              !bout.winner
            ) {

              html += `
                <button
                  onclick="
                    selectWinner(
                      ${roundIndex},
                      ${index},
                      'AKA'
                    )
                  "
                >
                  🔴 AKA Wins
                </button>
              `;

              if (
                bout.ao
              ) {

                html += `
                  <button
                    onclick="
                      selectWinner(
                        ${roundIndex},
                        ${index},
                        'AO'
                      )
                    "
                  >
                    🔵 AO Wins
                  </button>
                `;
              }

            } else {

              html += `
                <strong
                  style="
                    color:#22c55e;
                  "
                >
                  ✅ Winner:
                  ${bout.winner.name}
                  (${bout.winnerSide})
                </strong>
              `;
            }

            html += `
                </div>
              </div>
            `;
          }
        );
      }
    );

    html += `
      </div>

      <button id="lockBtn">
        ${
          isLocked
          ? "🔒 Locked"
          : "🔒 Lock Fixture"
        }
      </button>

      <br><br>

      <button id="rebuildBtn">
        🔄 Rebuild Fixture
      </button>

      <br><br>

      <button id="saveBtn">
        💾 Save Changes
      </button>
    `;

    fixtureContainer.innerHTML =
      html;

    // =====================
    // REBUILD
    // =====================

    document
      .getElementById(
        "rebuildBtn"
      )
      .addEventListener(
        "click",
        async () => {

          const yes =
            confirm(
              "Rebuild Fixture?"
            );

          if (!yes) return;

          const rebuiltRounds =
            buildRounds(
              participants
            );

          await updateDoc(
            fixtureRef,
            {
              rounds:
                rebuiltRounds
            }
          );

          location.reload();
        }
      );

  } catch (error) {

    console.error(error);

    fixtureContainer.innerHTML =
      `
      <h2>
        Error loading admin panel
      </h2>
      `;
  }
}

// ========================
// WINNER SYSTEM
// ========================

window.selectWinner =
async function (
  roundIndex,
  boutIndex,
  side
) {

  const fixtureId =
    category
      .replaceAll("|", "_")
      .replaceAll(" ", "");

  const fixtureRef =
    doc(
      db,
      "fixtures",
      fixtureId
    );

  const snap =
    await getDoc(
      fixtureRef
    );

  const data =
    snap.data();

  const rounds =
    data.rounds;

  const bout =
    rounds[
      roundIndex
    ].bouts[
      boutIndex
    ];

  const winner =
    side === "AKA"
      ? bout.aka
      : bout.ao;

  if (!winner) {

    alert(
      "No player found"
    );

    return;
  }

  bout.winner =
    winner;

  bout.winnerSide =
    side;

  const nextRound =
    rounds[
      roundIndex + 1
    ];

  if (nextRound) {

    const nextBoutIndex =
      Math.floor(
        boutIndex / 2
      );

    const nextBout =
      nextRound.bouts[
        nextBoutIndex
      ];

    if (
      boutIndex % 2 === 0
    ) {

      nextBout.aka =
        winner;

    } else {

      nextBout.ao =
        winner;
    }
  }

  await updateDoc(
    fixtureRef,
    {
      rounds
    }
  );

  location.reload();
};

loadFixture();