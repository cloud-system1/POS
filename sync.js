
"use strict";

// POS Phase 2 - Device Registration
// Automatic sales synchronization will be added later.

const syncUI = id => document.getElementById(id);

function showSyncMessage(message) {
  const element = syncUI("sync-message");
  if (element) element.textContent = message;
}

async function updateDeviceStatus() {
  try {
    const db = await openDB();

    if (!db.objectStoreNames.contains("settings")) {
      db.close();
      showSyncMessage(
        "Device storage is not ready. Database update required."
      );
      return;
    }

    db.close();

    const device = await getSetting("device");

    if (device && device.deviceId && device.token) {
      syncUI("device-status").textContent =
        "Registered: " + device.deviceId;

      syncUI("registration").hidden = true;

      showSyncMessage(
        "Device registered. Cloud sales sync is not enabled yet."
      );
    } else {
      syncUI("device-status").textContent =
        "Device not registered";

      syncUI("registration").hidden = false;

      showSyncMessage(
        "Enter your cashier ID and one-time registration code."
      );
    }
  } catch (error) {
    showSyncMessage("Database error: " + error.message);
  }
}

async function registerCashierPC() {
  const deviceId = syncUI("device-id").value.trim();
  const code = syncUI("registration-code").value.trim();

  if (!/^POS-[A-Za-z0-9-]{1,40}$/.test(deviceId)) {
    showSyncMessage("Enter a valid ID such as POS-01.");
    return;
  }

  if (!/^[a-fA-F0-9]{48}$/.test(code)) {
    showSyncMessage(
      "Registration code must contain 48 hexadecimal characters."
    );
    return;
  }

  const button = syncUI("register-device");
  button.disabled = true;

  showSyncMessage("Registering cashier PC...");

  try {
    const existingDevice = await getSetting("device");

    if (existingDevice) {
      throw new Error("This browser is already registered.");
    }

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deviceId,
        code
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Registration failed"
      );
    }

    if (!result.deviceId || !result.token) {
      throw new Error("Invalid server registration response.");
    }

    await setSetting("device", {
      deviceId: result.deviceId,
      token: result.token
    });

    syncUI("registration-code").value = "";

    await updateDeviceStatus();

    showSyncMessage(
      "Registration successful. Device: " + result.deviceId
    );
  } catch (error) {
    showSyncMessage(
      "Registration error: " + error.message
    );
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  syncUI("register-device")
    ?.addEventListener("click", registerCashierPC);

  syncUI("sync-now")
    ?.addEventListener("click", () => {
      showSyncMessage(
        "Cloud sales synchronization is not enabled yet."
      );
    });

  if (typeof getSetting !== "function" ||
      typeof setSetting !== "function") {
    showSyncMessage(
      "Please update db.js before registering this device."
    );
    return;
  }

  updateDeviceStatus();
});

