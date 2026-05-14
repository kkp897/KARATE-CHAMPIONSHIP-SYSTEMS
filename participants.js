import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tableBody =
  document.getElementById("tableBody");

const coachSearch =
  document.getElementById("coachSearch");

const participantSearch =
  document.getElementById("participantSearch");

const ageSearch =
  document.getElementById("ageSearch");

const weightSearch =
  document.getElementById("weightSearch");

let allParticipants = [];

// =======================
// LOAD PARTICIPANTS
// =======================

async function loadParticipants() {

  tableBody.innerHTML = `
    <tr>
      <td colspan="10">
        Loading...
      </td>
    </tr>
  `;

  try {

    const snapshot = await getDocs(
      collection(db, "participants")
    );

    allParticipants =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    updateStats(allParticipants);
    renderParticipants(allParticipants);

  } catch (error) {

    console.error(error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="10">
          Failed to load participants
        </td>
      </tr>
    `;
  }
}

// =======================
// RENDER TABLE
// =======================

function renderParticipants(participants) {

  tableBody.innerHTML = "";

  if (participants.length === 0) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="10">
          No participants found
        </td>
      </tr>
    `;

    return;
  }

  participants.forEach(participant => {

    const status =
      participant.checkedIn
        ? "🟢 Present"
        : `<button onclick="markPresent('${participant.id}')">
            ✅ Present
           </button>`;

    let categoryText = "-";

    if (
      participant.eventType === "Kumite"
    ) {
      categoryText =
        participant.kumiteCategory;
    }

    else if (
      participant.eventType === "Both"
    ) {
      categoryText =
        participant.kumiteCategory;
    }

    tableBody.innerHTML += `
      <tr>
        <td>${participant.name || "-"}</td>
        <td>${participant.gender || "-"}</td>
        <td>${participant.age || "-"}</td>
        <td>${participant.weight || "-"}</td>
        <td>${participant.division || "-"}</td>
        <td class="category-cell">
          ${categoryText}
        </td>
        <td>${participant.coach || "-"}</td>
        <td>${participant.academy || "-"}</td>
        <td>${participant.eventType || "-"}</td>
        <td>${status}</td>
      </tr>
    `;
  });
}

// =======================
// MANUAL PRESENT
// =======================

window.markPresent =
async function(id) {

  try {

    await updateDoc(
      doc(db, "participants", id),
      {
        checkedIn: true,
        checkInTime: new Date()
      }
    );

    loadParticipants();

  } catch (error) {

    console.error(error);
    alert("Error marking present");
  }
};

// =======================
// STATS
// =======================

function updateStats(participants) {

  const total =
    participants.length;

  const present =
    participants.filter(
      p => p.checkedIn
    ).length;

  const pending =
    total - present;

  document.getElementById(
    "totalCount"
  ).textContent = total;

  document.getElementById(
    "presentCount"
  ).textContent = present;

  document.getElementById(
    "pendingCount"
  ).textContent = pending;
}

// =======================
// FILTER SYSTEM
// =======================

function applyFilters() {

  const coachValue =
    coachSearch.value.toLowerCase();

  const participantValue =
    participantSearch.value.toLowerCase();

  const ageValue =
    ageSearch.value.trim();

  const weightValue =
    weightSearch.value.trim();

  const filtered =
    allParticipants.filter(p => {

      const coachMatch =
        (p.coach || "")
          .toLowerCase()
          .includes(coachValue);

      const participantMatch =
        (p.name || "")
          .toLowerCase()
          .includes(participantValue);

      const ageMatch =
        !ageValue ||
        String(p.age) === ageValue;

      const weightMatch =
        !weightValue ||
        String(p.weight) === weightValue;

      return (
        coachMatch &&
        participantMatch &&
        ageMatch &&
        weightMatch
      );
    });

  renderParticipants(filtered);
}

// =======================
// EVENT LISTENERS
// =======================

coachSearch.addEventListener(
  "input",
  applyFilters
);

participantSearch.addEventListener(
  "input",
  applyFilters
);

ageSearch.addEventListener(
  "input",
  applyFilters
);

weightSearch.addEventListener(
  "input",
  applyFilters
);

// =======================
// START
// =======================

loadParticipants();
