
const DB_NAME = "veg_takeaway_pos";
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("sales")) {
        db.createObjectStore("sales", {
          keyPath: "id"
        });
      }

      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", {
          keyPath: "id"
        });
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", {
          keyPath: "key"
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error(
        "Database upgrade blocked. Close other POS tabs and retry."
      ));
  });
}

// Save a sale and its sync event in one transaction.
async function saveSale(sale) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ["sales", "outbox"],
      "readwrite"
    );

    tx.objectStore("sales").add(sale);

    tx.objectStore("outbox").add({
      id: crypto.randomUUID(),
      saleId: sale.id,
      type: "sale.completed",
      payload: sale,
      createdAt: new Date().toISOString()
    });

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// Read all records from a store.
async function getAll(storeName) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// Save device registration information.
async function setSetting(key, value) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");

    tx.objectStore("settings").put({
      key,
      value
    });

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// Retrieve saved device registration information.
async function getSetting(key) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const request = tx.objectStore("settings").get(key);

    request.onsuccess = () => {
      resolve(request.result?.value ?? null);
    };

    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Remove a synchronized event after cloud acknowledgement.
// This will be used when we implement the sync API.
async function deleteOutboxEvent(eventId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");

    tx.objectStore("outbox").delete(eventId);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
