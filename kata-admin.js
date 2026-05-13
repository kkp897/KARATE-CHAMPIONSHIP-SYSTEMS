import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
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

// =====================
// SHUFFLE
// =====================

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

// =====================
// SMART PAIRING
// =====================

function smartPair(
  players
) {

  const shuffled =
    shuffle(players);

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

        found = j;
        break;
      }
    }

    used.add(i);

    if (
      found !== -1
    ) {

      used.add(found);

      result.push({
        aka:
          shuffled[i],

        ao:
          shuffled[
            found
          ]
      });

    } else {

      result.push({
        aka:
          shuffled[i],

        ao:
          null
      });
    }
  }

  return result;
}

// =====================
// LOAD
// =====================

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

    const fixtureId =
      `kata_${category}`
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
        "kataFixtures",
        fixtureId
      );

    const existing =
      await getDoc(
        fixtureRef
      );

    let bouts =
      [];

    let isLocked =
      false;

    if (
      existing.exists()
    ) {

      const data =
        existing
        .data();

      bouts =
        data.bouts ||
        [];

      isLocked =
        data.isLocked
        || false;

    } else {

      bouts =
        smartPair(
          players
        );

      await setDoc(
        fixtureRef,
        {
          category,
          bouts,
          isLocked:
            false
        }
      );
    }

    renderAdmin(
      bouts,
      players,
      fixtureRef,
      isLocked
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
        Error Loading
      </h2>
      `;
  }
}

// =====================
// RENDER
// =====================

function renderAdmin(
  bouts,
  players,
  fixtureRef,
  isLocked
) {

  let html =
    `
    <div class="stat-card">

    <h2>
      ${category}
    </h2>
  `;

  bouts.forEach(
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
        Match
        ${index + 1}
      </h3>

      <label>
        🔴 AKA
      </label>

      <select
        id="aka-${index}"
        ${
          isLocked
          ? "disabled"
          : ""
        }
      >
        <option value="">
          Select
        </option>
      `;

      players.forEach(
        player => {

          html += `
          <option
            value="${player.name}"
            ${
              bout.aka?.name
              ===
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
        id="ao-${index}"
        ${
          isLocked
          ? "disabled"
          : ""
        }
      >

      <option
        value="BYE"
      >
        🟡 BYE
      </option>
      `;

      players.forEach(
        player => {

          html += `
          <option
            value="${player.name}"
            ${
              bout.ao?.name
              ===
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

      </div>
      `;
    }
  );

  html += `
  </div>

  <button
    id="lockBtn"
  >
    ${
      isLocked
      ? "🔒 Locked"
      : "🔒 Lock Fixture"
    }
  </button>

  <br><br>

  <button
    id="rebuildBtn"
  >
    🔄 Rebuild
  </button>

  <br><br>

  <button
    id="saveBtn"
  >
    💾 Save Changes
  </button>
  `;

  fixtureContainer.innerHTML =
    html;

  // SAVE

  document
    .getElementById(
      "saveBtn"
    )
    .onclick =
    async () => {

      const updated =
        bouts.map(
          (
            bout,
            index
          ) => {

            const aka =
              players.find(
                p =>
                  p.name ===
                  document
                  .getElementById(
                    `aka-${index}`
                  )
                  .value
              );

            const aoValue =
              document
              .getElementById(
                `ao-${index}`
              )
              .value;

            const ao =
              aoValue ===
              "BYE"
              ? null
              : players.find(
                  p =>
                    p.name ===
                    aoValue
                );

            return {
              aka,
              ao
            };
          }
        );

      await updateDoc(
        fixtureRef,
        {
          bouts:
            updated
        }
      );

      alert(
        "Saved!"
      );

      location.reload();
    };

  // LOCK

  document
    .getElementById(
      "lockBtn"
    )
    .onclick =
    async () => {

      await updateDoc(
        fixtureRef,
        {
          isLocked:
            !isLocked
        }
      );

      location.reload();
    };

  // REBUILD

  document
  .getElementById(
    "rebuildBtn"
  )
  .onclick =
  async () => {

    const yes =
      confirm(
        "Rebuild Fixture?"
      );

    if (!yes)
      return;

    try {

      // Fresh fetch
      const snapshot =
        await getDocs(
          collection(
            db,
            "participants"
          )
        );

      const freshParticipants =
        snapshot.docs.map(
          doc => ({
            id:
              doc.id,
            ...doc.data()
          })
        );

      // Filter category again
      const freshPlayers =
        freshParticipants.filter(
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

      const rebuilt =
        smartPair(
          freshPlayers
        );

      await updateDoc(
        fixtureRef,
        {
          bouts:
            rebuilt
        }
      );

      alert(
        "Fixture rebuilt!"
      );

      location.reload();

    } catch (
      error
    ) {

      console.error(
        error
      );

      alert(
        "Rebuild failed"
      );
    }
  };
}

loadFixture();