import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const resultDiv = document.getElementById("result");

async function onScanSuccess(decodedText) {

  // Stop duplicate rapid scans
  html5QrCode.pause();

  try {

    const participantsRef = collection(db, "participants");

    const q = query(
      participantsRef,
      where("participantId", "==", decodedText)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

      resultDiv.innerHTML = `
        <h2>❌ Participant Not Found</h2>
      `;

      setTimeout(() => {
        html5QrCode.resume();
      }, 2000);

      return;
    }

    const participantDoc = snapshot.docs[0];
    const participant = participantDoc.data();

    // Already checked in?
    if (participant.checkedIn) {

      resultDiv.innerHTML = `
        <h2>⚠️ Already Checked In</h2>
        <p>${participant.name}</p>
        <p>${participant.participantId}</p>
      `;

      setTimeout(() => {
        html5QrCode.resume();
      }, 2000);

      return;
    }

    // Mark present
    await updateDoc(doc(db, "participants", participantDoc.id), {
      checkedIn: true,
      checkInTime: new Date()
    });

    resultDiv.innerHTML = `
      <h2>✅ CHECKED IN</h2>
      <h3>${participant.name}</h3>
      <p>${participant.participantId}</p>
      <p>${participant.eventType}</p>
    `;

  } catch (error) {

    console.error(error);

    resultDiv.innerHTML = `
      <h2>❌ Error</h2>
    `;
  }

  // Resume scanner
  setTimeout(() => {
    html5QrCode.resume();
  }, 2000);
}

const html5QrCode = new Html5Qrcode("reader");

html5QrCode.start(
  { facingMode: "environment" },
  {
    fps: 10,
    qrbox: 250
  },
  onScanSuccess
);