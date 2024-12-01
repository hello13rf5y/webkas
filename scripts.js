import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGszzdRV-P4HcNWwz24FT1FyZF5RMZngc",
  authDomain: "core-project-70fb1.firebaseapp.com",
  databaseURL: "https://core-project-70fb1-default-rtdb.firebaseio.com",
  projectId: "core-project-70fb1",
  storageBucket: "core-project-70fb1.appspot.com",
  messagingSenderId: "973484049142",
  appId: "1:973484049142:web:03589b8f79edeb36d762d7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function calculateTotal(snapshot) {
  let total = 0;
  snapshot.forEach((child) => {
    total += child.val().amount;
  });
  document.getElementById("totalKas").textContent = `Total Uang Kas: Rp ${total.toLocaleString()}`;
}

function calculateMonthlyHistory(snapshot) {
  const monthlyTotals = {};
  snapshot.forEach((child) => {
    const { amount, month } = child.val();
    monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;
  });

  const historyContainer = document.getElementById("historyContainer");
  historyContainer.innerHTML = "<h4>Histori Bulanan</h4>";
  for (const month in monthlyTotals) {
    const box = `
      <div class="history-box">
        <h4>${month}</h4>
        <p class="amount">Rp ${monthlyTotals[month].toLocaleString()}</p>
      </div>`;
    historyContainer.innerHTML += box;
  }
}

function downloadCSV(snapshot) {
  let csvContent = "Nama, Jumlah, Bulan\n";
  snapshot.forEach((child) => {
    const { name, amount, month } = child.val();
    csvContent += `${name},${amount},${month}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data_kas.csv";
  link.click();
}

document.getElementById("submitAdmin").addEventListener("click", () => {
  const name = document.getElementById("nameInput").value.trim();
  const amount = parseInt(document.getElementById("amountInput").value.trim(), 10);
  const month = new Date().toLocaleString("default", { month: "long" });

  if (!name || isNaN(amount)) {
    swal("Peringatan!", "Harap isi nama dan jumlah dengan benar!", "warning");
    return;
  }

  const uangKasRef = ref(db, "uangKas");

  onValue(
    uangKasRef,
    (snapshot) => {
      let existingKey = null;
      let existingAmount = 0;

      snapshot.forEach((child) => {
        const data = child.val();
        if (data.name === name) {
          existingKey = child.key;
          existingAmount = data.amount;
        }
      });

      if (existingKey) {
        const updatedAmount = existingAmount + amount;
        update(ref(db, `uangKas/${existingKey}`), { amount: updatedAmount })
          .then(() => swal("Berhasil!", "Jumlah uang berhasil diperbarui!", "success"))
          .catch((err) => swal("Gagal!", err.message, "error"));
      } else {
        const key = `${Date.now()}_${name}`;
        set(ref(db, `uangKas/${key}`), { name, amount, month })
          .then(() => swal("Berhasil!", "Data berhasil disimpan!", "success"))
          .catch((err) => swal("Gagal!", err.message, "error"));
      }
    },
    { onlyOnce: true }
  );
});

const uangKasRef = ref(db, "uangKas");
onValue(uangKasRef, (snapshot) => {
  const dataContainer = document.getElementById("dataContainer");
  dataContainer.innerHTML = "";

  // Update total kas
  calculateTotal(snapshot);

  // Update monthly history
  calculateMonthlyHistory(snapshot);

  // Display individual data
  snapshot.forEach((child) => {
    const data = child.val();
    const box = `
      <div class="data-box">
        <h4>${data.name}</h4>
        <p class="amount">Rp ${data.amount.toLocaleString()}</p>
        <p>Bulan: <strong>${data.month}</strong></p>
      </div>`;
    dataContainer.innerHTML += box;
  });
});

// Download data kas as CSV
document.getElementById("downloadData").addEventListener("click", () => {
  onValue(uangKasRef, (snapshot) => {
    if (snapshot.exists()) {
      downloadCSV(snapshot);
      swal("Berhasil!", "Data kas berhasil diunduh!", "success");
    } else {
      swal("Peringatan!", "Data kas kosong, tidak ada yang dapat diunduh!", "warning");
    }
  }, { onlyOnce: true });
});
