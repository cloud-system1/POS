
"use strict";

// Vegetarian Takeaway POS
// Secure offline-first cloud synchronization.

const SYNC_INTERVAL_MS = 30000;
let syncRunning = false;

const syncUI = id => document.getElementById(id);

function showSyncMessage(message) {
  const element = syncUI("sync-message");
  if (element) element.textContent = message;
}

function updateNetworkStatus() {
  const status = syncUI("status");
  if (!status) return;

  status.textContent = navigator.onLine
    ? "Network available — cloud sync enabled"
    : "Offline — sales saved locally";
}

async function updateDeviceStatus() {
  const device = await getSetting("device");

  const status = syncUI("device-status");
  const registration = syncUI("registration");

  if (device?.deviceId && device?.token) {
    if (status) {
      status.textContent = "Registered: " + device.deviceId;
    }

    if (registration) registration.hidden = true;
  } else {
    if (status) {
      status.textContent = "Device not registered";
    }

    if (registration) registration.hidden = false;
  }

  return device;
}

async function refreshSyncCount() {
  const pending = await getAll("outbox");
  const element = syncUI("pending");

  if (element) {
    element.textContent = pending.length;
  }

  return pending;
}

// Register a new cashier PC.
async function registerCashierPC() {
  const deviceId = syncUI("device-id").value.trim();
  const code = syncUI("registration-code").value.trim();

  if (!/^POS-[A-Za-z0-9-]{1,40}$/.test(deviceId)) {
    showSyncMessage("Enter a valid ID such as POS-01.");
    return;
  }

  if (!/^[a-fA-F0-9]{48}$/.test(code)) {
    showSyncMessage("Invalid registration code.");
    return;
  }

  const button = syncUI("register-device");
  button.disabled = true;

  try {
    const existing = await getSetting("device");

    if (existing) {
      throw new Error("This device is already registered.");
    }

    showSyncMessage("Registering cashier PC...");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ deviceId, code })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Registration failed"
      );
    }

    if (!result.deviceId || !result.token) {
      throw new Error("Invalid registration response.");
    }

    await setSetting("device", {
      deviceId: result.deviceId,
      token: result.token
    });

    syncUI("registration-code").value = "";

    await updateDeviceStatus();

    showSyncMessage(
      "Device registered successfully: " + result.deviceId
    );

    await syncPendingSales();
  } catch (error) {
    showSyncMessage("Registration error: " + error.message);
  } finally {
    button.disabled = false;
  }
}

// Upload pending sales to Cloudflare D1.
async function syncPendingSales() {
  if (syncRunning) return;

  if (!navigator.onLine) {
    showSyncMessage(
      "Offline. Pending sales remain saved locally."
    );
    return;
  }

  syncRunning = true;

  const button = syncUI("sync-now");
  if (button) button.disabled = true;

  try {
    const device = await getSetting("device");

    if (!device?.deviceId || !device?.token) {
      showSyncMessage(
        "Register this cashier PC to enable synchronization."
      );
      return;
    }

    const events = await refreshSyncCount();

    if (events.length === 0) {
      showSyncMessage(
        "All sales synchronized. Nothing pending."
      );
      return;
    }

    showSyncMessage(
      "Synchronizing " + events.length + " sale(s)..."
    );

    let uploaded = 0;

    for (const event of events) {
      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        15000
      );

      let response;

      try {
        response = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + device.token
          },
          body: JSON.stringify(event),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      const result = await response.json();

      // Never delete local events without a valid
      // acknowledgement from the cloud.
      if (
        !response.ok ||
        result.success !== true ||
        result.acknowledgedEventId !== event.id ||
        result.saleId !== event.saleId
      ) {
        throw new Error(
          result.error || "Cloud acknowledgement failed"
        );
      }

      await deleteOutboxEvent(event.id);
      uploaded++;

      await refreshSyncCount();
    }

    showSyncMessage(
      uploaded + " sale(s) synchronized successfully."
    );
  } catch (error) {
    showSyncMessage(
      "Sync pending: " + error.message +
      ". Local sales retained."
    );
  } finally {
    syncRunning = false;

    if (button) button.disabled = false;

    try {
      await refreshSyncCount();
    } catch (error) {
      showSyncMessage(
        "Unable to refresh pending count: " + error.message
      );
    }
  }
}

// Allow app.js to request synchronization later.
window.requestSync = syncPendingSales;

// Initialize after the page is loaded.
document.addEventListener("DOMContentLoaded", async () => {
  syncUI("register-device")
    ?.addEventListener("click", registerCashierPC);

  syncUI("sync-now")
    ?.addEventListener("click", syncPendingSales);

  window.addEventListener("online", () => {
    updateNetworkStatus();
    syncPendingSales();
  });

  window.addEventListener("offline", updateNetworkStatus);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncPendingSales();
    }
  });

  updateNetworkStatus();

  try {
    if (
      typeof getSetting !== "function" ||
      typeof setSetting !== "function" ||
      typeof deleteOutboxEvent !== "function"
    ) {
      throw new Error(
        "Database functions unavailable. Update db.js."
      );
    }

    const device = await updateDeviceStatus();
    await refreshSyncCount();

    if (device) {
      showSyncMessage("Cloud synchronization ready.");
    } else {
      showSyncMessage(
        "Enter your cashier ID and registration code."
      );
    }
  } catch (error) {
    showSyncMessage(
      "Initialization error: " + error.message
    );
  }

  // Automatic synchronization every 30 seconds.
  setInterval(syncPendingSales, SYNC_INTERVAL_MS);
});
