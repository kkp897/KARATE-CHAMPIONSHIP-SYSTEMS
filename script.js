import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const addBtn = document.getElementById("addBtn");

// =======================
// CATEGORY ENGINE
// =======================

function getDivision(age) {

  if (age <= 5) return "Under 6";
  if (age <= 7) return "6-7 Years";
  if (age <= 9) return "8-9 Years";
  if (age <= 11) return "10-11 Years";
  if (age <= 13) return "Sub-Junior";
  if (age <= 15) return "Cadet";
  if (age <= 17) return "Junior";

  return null;
}

function getKumiteCategory(age, gender, weight) {

  const tolerance = 0.2;

  function findCategory(categories) {

    for (let limit of categories) {
      if (weight <= limit + tolerance) {
        return `-${limit}kg`;
      }
    }

    return `+${categories[categories.length - 1]}kg`;
  }

  // Under 6
  if (age <= 5) {
    return findCategory([15, 20]);
  }

  // 6–7
  if (age <= 7) {
    return findCategory([15, 20]);
  }

  // 8–9
  if (age <= 9) {
    return findCategory([20, 25]);
  }

  // 10–11
  if (age <= 11) {
    return findCategory([25, 30]);
  }

  // 12–13
  if (age <= 13) {
    if (gender === "Male") {
      return findCategory([40, 45, 50, 55]);
    } else {
      return findCategory([42, 47, 52]);
    }
  }

  // Cadet
  if (age <= 15) {
    if (gender === "Male") {
      return findCategory([52, 57, 63, 70]);
    } else {
      return findCategory([47, 54, 61]);
    }
  }

  // Junior
  if (age <= 17) {
    if (gender === "Male") {
      return findCategory([55, 61, 68, 76]);
    } else {
      return findCategory([48, 53, 59, 66]);
    }
  }

  return "Not Eligible";
}

// =======================
// ADD PARTICIPANT
// =======================

addBtn.addEventListener("click", async () => {

  const name =
    document.getElementById("name").value.trim();

  const age =
    Number(document.getElementById("age").value);

  const weight =
    Number(document.getElementById("weight").value);

  const coach =
    document.getElementById("coach").value.trim();

  const academy =
    document.getElementById("academy").value.trim();

  const gender =
    document.getElementById("gender").value;

  const eventType =
    document.getElementById("eventType").value;

  // Validation
  if (
    !name ||
    !age ||
    !weight ||
    !coach ||
    !academy ||
    !gender ||
    !eventType
  ) {
    alert("Please fill all fields");
    return;
  }

  // Age limit
  if (age > 17) {
    alert("Only participants up to 17 years are allowed");
    return;
  }

  try {

    const snapshot =
      await getDocs(collection(db, "participants"));

    const count = snapshot.size + 1;

    const participantId =
      `SMA-${String(count).padStart(3, "0")}`;

    const division =
      getDivision(age);

    const kumiteCategory =
      getKumiteCategory(age, gender, weight);

    const kataCategory =
      `${division} ${gender} Kata`;

    // Save to Firebase
    await addDoc(collection(db, "participants"), {
      participantId,
      name,
      age,
      weight,
      coach,
      academy,
      gender,
      eventType,
      division,
      kumiteCategory,
      kataCategory,
      checkedIn: false,
      checkInTime: null,
      createdAt: new Date()
    });

    // QR Generation
    const qrContainer =
      document.getElementById("qrContainer");

    qrContainer.innerHTML = `
      <h3>QR for ${name}</h3>
      <div id="qrcode"></div>
      <p><strong>ID:</strong> ${participantId}</p>
    `;

    new QRCode(
      document.getElementById("qrcode"),
      {
        text: participantId,
        width: 200,
        height: 200
      }
    );

    alert(
`Participant Added!

ID: ${participantId}

Division: ${division}

Kumite: ${kumiteCategory}

Kata: ${kataCategory}`
    );

    // Reset fields
    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("coach").value = "";
    document.getElementById("academy").value = "";
    document.getElementById("gender").value = "";
    document.getElementById("eventType").value = "";

  } catch (error) {
    console.error(error);
    alert("Error Adding Participant");
  }
});