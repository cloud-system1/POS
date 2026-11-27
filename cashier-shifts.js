
"use strict";

(async function () {
  const root = document.createElement("section");
  root.id = "cashier-shift-panel";
  root.style.cssText = "padding:12px;margin:12px;border:1px solid #2563eb;border-radius:8px;background:#0b1528;color:white;font:14px Arial,sans-serif";
  root.innerHTML = `<strong>Cashier Shift</strong> <span id="shift-state">Checking...</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center">
    <label>Outlet <input id="shift-outlet" placeholder="Outlet code" maxlength="20" style="width:95px"></label>
    <label>Opening float (LKR) <input id="shift-float" type="number" min="0" step="0.01" value="5000" style="width:110px"></label>
    <button id="shift-open" type="button">Open Shift</button>
    <button id="shift-refresh" type="button">Refresh Status</button>
    <button id="shift-movements" type="button">Cash In / Out &amp; Expenses</button>
    <button id="shift-corrections" type="button">Rejected Settlements</button>
    <button id="shift-close" type="button">Close / Settle Shift</button></div>
    <small id="shift-message" style="display:block;margin-top:6px"></small>`;

  const anchor = document.querySelector(".page-content") || document.body;
  anchor.prepend(root);

  const $ = id => document.getElementById(id);
  const msg = value => {
    $("shift-message").textContent = value;
  };

  async function current() {
    const device = await getSetting("device");

    if (!device?.token) {
      throw new Error("Registered terminal required");
    }

    const response = await fetch("/api/cashier/shifts/current", {
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + device.token
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to verify cashier session");
    }

    return result.shift;
  }


  async function refresh() {
    const version = networkVersion;

    const isOnline = () =>
      navigator.onLine && version === networkVersion;

    disableOnlineControls();

    try {
      if (!isOnline()) return;

      const shift = await current();
      const device = await getSetting("device");
      const previous = await getSetting("activeShift");

      if (!isOnline()) return;

      if (!device?.deviceId) {
        throw new Error("Registered terminal required");
      }

      if (shift) {
        const meResponse = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store"
        });

        const me = await meResponse.json();

        if (!meResponse.ok || me.user?.role !== "cashier") {
          throw new Error("Cashier login required");
        }

        if (
          previous?.shiftId === shift.shift_id &&
          previous.deviceId !== device.deviceId
        ) {
          throw new Error(
            "Shift belongs to a different registered terminal"
          );
        }

        if (!isOnline()) return;

        await setSetting("activeShift", {
          shiftId: shift.shift_id,
          cashierId: me.user.userId,
          outletCode: shift.outlet_code,
          outletId: shift.outlet_id,
          deviceId: device.deviceId
        });

        if (!isOnline()) return;

        $("shift-state").textContent =
          `OPEN — ${shift.outlet_code} — LKR ${(shift.opening_cents / 100).toFixed(2)}`;

        $("shift-open").disabled = true;
        $("shift-close").disabled = false;
        $("shift-movements").disabled = false;
        $("shift-corrections").disabled = false;
        $("shift-refresh").disabled = false;

      } else {
        const pending = await getAll("outbox");

        if (!isOnline()) return;

        if (
          previous &&
          pending.some(
            e => e.payload?.shiftId === previous.shiftId
          )
        ) {
          $("shift-state").textContent =
            "CLOSED / OFFLINE PENDING — reconcile before next shift";

          $("shift-refresh").disabled = false;

          msg(
            "Unsynchronized sales require reconciliation."
          );

          return;
        }

        await setSetting("activeShift", null);

        if (!isOnline()) return;

        $("shift-state").textContent = "No open shift";

        $("shift-open").disabled = false;
        $("shift-close").disabled = true;
        $("shift-movements").disabled = true;
        $("shift-corrections").disabled = false;
        $("shift-refresh").disabled = false;
      }

      msg(
        "Online verification complete. Offline billing is permitted only with a cached shift."
      );

    } catch (error) {
      if (!isOnline()) return;

      disableOnlineControls();

      $("shift-state").textContent =
        "Login / network verification required";

      $("shift-refresh").disabled = false;

      msg(
        error.message ||
        "Unable to verify cashier shift."
      );
    }
  }


  // CASH IN / OUT AND EXPENSES

  $("shift-movements").onclick = async () => {
    try {
      const shift = await current();
      const device = await getSetting("device");

      if (!shift) throw new Error("Open a shift first");

      const headers = {
        Authorization: "Bearer " + device.token,
        "Content-Type": "application/json"
      };

      const api = async body => {
        const r = await fetch("/api/cashier/cash-movements", {
          credentials: "same-origin",
          cache: "no-store",
          headers,
          ...(body ? {
            method: "POST",
            body: JSON.stringify(body)
          } : {})
        });

        const x = await r.json();

        if (!r.ok) throw new Error(x.error || "Request failed");

        return x;
      };

      const d = document.createElement("dialog");

      d.style.cssText =
        "background:#101b30;color:white;border:1px solid #36547d;border-radius:12px;padding:20px;width:min(600px,90vw);max-height:85vh;overflow:auto";

      d.innerHTML = `
        <h2>Cash In / Out &amp; Expenses</h2>
        <p>Current shift · online recording only</p>
        <form style="display:grid;gap:10px">
          <label>Direction
            <select name="type">
              <option value="cash_out">Cash Out / Expenses</option>
              <option value="cash_in">Cash In / Receipts</option>
            </select>
          </label>
          <label>Category
            <select name="category"></select>
          </label>
          <label>Amount (LKR)
            <input name="amount" type="number" min="0.01" max="10000000" step="0.01" required>
          </label>
          <label>Recipient / reference / reason
            <textarea name="reason" maxlength="180" required></textarea>
          </label>
          <button type="submit">Record movement</button>
          <button type="button" data-close>Close</button>
          <p role="status"></p>
        </form>
        <h3>Current shift movements</h3>
        <div data-list></div>`;

      const f = d.querySelector("form");
      const status = d.querySelector('[role="status"]');
      const list = d.querySelector("[data-list]");

      const cats = {
        cash_out: [
          "Gas expense",
          "Ingredient purchases",
          "Transport expense",
          "Electricity / Water",
          "Staff advance",
          "Short-term loan issued",
          "Loan repayment paid",
          "Supplier payment",
          "Maintenance",
          "Owner withdrawal",
          "Other expenses"
        ],
        cash_in: [
          "Loan repayment",
          "Additional cash float",
          "Loan received",
          "Owner contribution",
          "Other cash receipts"
        ]
      };

      const options = () => {
        f.elements.category.replaceChildren(
          ...cats[f.elements.type.value].map(x => new Option(x, x))
        );
      };

      options();
      f.elements.type.onchange = options;

      const load = async () => {
        const x = await api();
        list.replaceChildren();

        for (const m of x.movements) {
          const row = document.createElement("p");

          row.textContent =
            `${m.type === "cash_out" ? "−" : "+"} Rs. ${(m.amount_cents / 100).toFixed(2)} | ${m.reason} | ${m.created_at}`;

          list.append(row);
        }

        if (!x.movements.length) {
          list.textContent = "No cash movements yet.";
        }
      };

      let pending = null;
      let busy = false;

      const fields = [...f.querySelectorAll("input,select,textarea")];
      const submit = f.querySelector('[type="submit"]');
      const close = f.querySelector("[data-close]");

      close.onclick = () => {
        if (!pending && !busy) d.close();
      };

      d.addEventListener("cancel", e => {
        if (pending || busy) e.preventDefault();
      });

      d.addEventListener("close", () => d.remove(), {
        once: true
      });

      f.onsubmit = async e => {
        e.preventDefault();

        if (busy) return;

        const amount = Number(f.elements.amount.value);

        if (!pending) {
          if (
            !f.elements.reason.value.trim() ||
            !Number.isSafeInteger(Math.round(amount * 100)) ||
            amount <= 0
          ) {
            status.textContent = "Enter valid amount and reason";
            return;
          }

          pending = {
            movementId: crypto.randomUUID(),
            shiftId: shift.shift_id,
            type: f.elements.type.value,
            category: f.elements.category.value,
            amountCents: Math.round(amount * 100),
            reason: f.elements.reason.value.trim()
          };
        }

        busy = true;
        fields.forEach(x => x.disabled = true);
        submit.disabled = true;
        close.disabled = true;

        try {
          await api(pending);

          pending = null;
          f.reset();
          options();

          status.textContent = "Movement recorded successfully";

          try {
            await load();
          } catch {
            status.textContent = "Recorded; history refresh failed.";
          }

        } catch (err) {

          status.textContent =
            err.message + " — retry the same entry. Do not pay twice.";

        } finally {

          busy = false;
          submit.disabled = false;

          submit.textContent = pending
            ? "Retry same entry"
            : "Record movement";

          close.disabled = !!pending;
          fields.forEach(x => x.disabled = !!pending);
        }
      };

      document.body.append(d);
      d.showModal();

      try {
        await load();
      } catch (e) {
        status.textContent = e.message;
      }

    } catch (e) {
      msg(e.message);
    }
  };

  // CASH DENOMINATION AND SETTLEMENT

  function countCash(details, correction = false) {
    const values = [5000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

    const money = cents =>
      "Rs. " + (cents / 100).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

    const fields = [
      details.opening_cents,
      details.cash_sales_cents,
      details.cash_in_cents,
      details.cash_out_cents
    ];

    if (!fields.every(Number.isSafeInteger)) {
      msg("Cash summary unavailable. Refresh and try again.");
      return Promise.resolve(null);
    }

    const expected = fields[0] + fields[1] + fields[2] - fields[3];

    return new Promise(resolve => {
      const dialog = document.createElement("dialog");

      dialog.style.cssText =
        "color:#f8fafc;background:#101b30;border:1px solid #36547d;border-radius:14px;width:min(680px,94vw);max-height:90vh;padding:20px;overflow:auto;font:15px Arial,sans-serif;box-shadow:0 20px 80px #0009";

      dialog.innerHTML = `
        <style>
          .cash-count-grid {
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:8px
          }
          .cash-count-row {
            display:grid;
            grid-template-columns:1fr 85px 1fr;
            align-items:center;
            gap:8px;
            padding:5px 0;
            border-bottom:1px solid #263750
          }
          .cash-count-row input {
            width:100%;
            box-sizing:border-box;
            background:#0b1528;
            color:white;
            border:1px solid #486080;
            border-radius:5px;
            padding:7px
          }
          .cash-count-row span:last-child {
            text-align:right
          }
          .cash-count-btn {
            padding:10px 14px;
            border:0;
            border-radius:6px;
            cursor:pointer;
            font-weight:bold
          }
          dialog::backdrop {
            background:#000b
          }
        </style>

        <h2 style="margin:0 0 6px">Cash Settlement</h2>
        <p style="color:#aabbd2">Premium POS · End of Shift</p>

        <div class="cash-count-grid">
          ${["Opening float", "Cash sales", "Cash in", "Cash out"].map(
            (label, i) => `
              <div style="background:#1b2b43;padding:10px;border-radius:7px">
                ${label}<br>
                <strong>${money(fields[i])}</strong>
              </div>`
          ).join("")}
        </div>

        <p>Enter the quantity of each note or coin.</p>

        <form>
          <div class="cash-count-row">
            <strong>Denomination</strong>
            <strong>Quantity</strong>
            <strong style="text-align:right">Amount</strong>
          </div>

          ${values.map((v, i) => `
            ${i === 0 || i === 7 ? `
              <div style="color:#8bbcff;margin-top:10px;font-weight:bold">
                ${i === 0 ? "BANKNOTES" : "COINS / SMALL CHANGE"}
              </div>` : ""}
            <label class="cash-count-row">
              <span>${money(Math.round(v * 100))}</span>
              <input type="number"
                min="0"
                max="100000"
                step="1"
                value="0"
                data-value="${Math.round(v * 100)}"
                aria-label="Quantity for ${v} rupees">
              <span>Rs. 0.00</span>
            </label>
          `).join("")}

          <div style="background:#1b2b43;padding:12px;margin-top:12px;border-radius:8px;line-height:1.8">
            Expected cash: <strong>${money(expected)}</strong><br>
            Total counted: <strong data-total></strong><br>
            Cash discrepancy: <strong data-variance></strong>
          </div>

          <p data-error role="alert" style="color:#fbbf24"></p>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="cash-count-btn" type="button" data-cancel>Cancel</button>
            <button class="cash-count-btn" type="button" data-reset>Reset</button>
            <button class="cash-count-btn" style="background:#2563eb;color:white;flex:1" type="submit">
              ${correction ? "Resubmit settlement" : "Confirm &amp; Close Shift"}
            </button>
          </div>
        </form>`;

      const form = dialog.querySelector("form");
      const inputs = [...form.querySelectorAll("input")];

      let result = null;

      function update() {
        let total = 0;
        let valid = true;

        const denominations = inputs.map(input => {
          const count = Number(input.value || 0);
          const valueCents = Number(input.dataset.value);

          if (
            !input.validity.valid ||
            !Number.isSafeInteger(count) ||
            count < 0 ||
            count > 100000
          ) {
            valid = false;
          }

          const amount = valueCents * count;

          input.nextElementSibling.textContent = money(amount);
          total += amount;

          return { valueCents, count };
        });

        valid =
          valid &&
          Number.isSafeInteger(total) &&
          total <= 1000000000;

        dialog.querySelector("[data-total]").textContent = money(total);

        const variance = dialog.querySelector("[data-variance]");

        variance.textContent =
          money(total - expected) +
          (total === expected
            ? " — Balanced"
            : total < expected
              ? " — Shortage"
              : " — Surplus");

        variance.style.color =
          total === expected ? "#4ade80" : "#fbbf24";

        dialog.querySelector("[data-error]").textContent =
          valid ? "" : "Enter valid whole quantities and cash total.";

        form.querySelector('[type="submit"]').disabled = !valid;

        return valid ? denominations : null;
      }

      form.addEventListener("input", update);

      dialog.querySelector("[data-reset]").onclick = () => {
        inputs.forEach(input => input.value = "0");
        update();
      };

      dialog.querySelector("[data-cancel]").onclick = () => {
        dialog.close();
      };

      form.addEventListener("submit", event => {
        event.preventDefault();

        const counts = update();

        if (!counts) return;

        result = counts;
        dialog.close();
      });

      dialog.addEventListener("close", () => {
        dialog.remove();
        resolve(result);
      }, { once: true });

      document.body.append(dialog);
      update();
      dialog.showModal();
    });
  }

  // CLOSE AND SETTLE SHIFT

  $("shift-close").addEventListener("click", async () => {
    const shift = await getSetting("activeShift");
    const device = await getSetting("device");

    if (!shift?.shiftId || !device?.token) {
      msg("No active registered shift");
      return;
    }

    const pending = await getAll("outbox");

    if (pending.length) {
      msg(`Cannot close: ${pending.length} unsynchronized sale(s). Sync first.`);
      return;
    }

    let details;

    try {
      details = await current();
    } catch (error) {
      msg(error.message);
      return;
    }

    if (!details || details.shift_id !== shift.shiftId) {
      msg("Shift changed. Refresh status.");
      return;
    }

    const denominations = await countCash(details);

    if (!denominations) return;

    if ((await getAll("outbox")).length) {
      msg("Sync pending sales before closing.");
      return;
    }

    $("shift-close").disabled = true;

    try {
      const response = await fetch("/api/cashier/shifts/close", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + device.token
        },
        body: JSON.stringify({
          shiftId: shift.shiftId,
          denominations
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Closing failed");
      }

      await setSetting("activeShift", null);
      await setSetting("offlineCashierAuthorizationV1", null);

      msg(`Shift closed; settlement ${result.settlementId} awaits administrator approval.`);

      await refresh();

    } catch (error) {
      msg(error.message);
      $("shift-close").disabled = false;
    }
  });

  // REJECTED SETTLEMENT CORRECTIONS

  $("shift-corrections").addEventListener("click", async () => {
    const btn = $("shift-corrections");
    btn.disabled = true;

    try {
      const device = await getSetting("device");

      if (!device?.token) {
        throw Error("Registered terminal required");
      }

      const api = async body => {
        const r = await fetch("/api/cashier/settlement-corrections", {
          method: body ? "POST" : "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Authorization: "Bearer " + device.token,
            "Content-Type": "application/json"
          },
          body: body ? JSON.stringify(body) : undefined
        });

        const d = await r.json();

        if (!r.ok) {
          throw Error(d.error || "Correction failed");
        }

        return d;
      };

      const data = await api();

      if (!data.settlements.length) {
        msg("No rejected settlements for this terminal.");
        return;
      }

      const dialog = document.createElement("dialog");

      dialog.style.cssText =
        "background:#101b30;color:white;padding:20px;max-width:90vw";

      const title = document.createElement("h2");
      title.textContent = "Rejected settlements";
      dialog.append(title);

      for (const row of data.settlements) {
        const b = document.createElement("button");

        b.type = "button";
        b.style.cssText = "display:block;margin:10px;padding:10px";

        b.textContent =
          row.outlet_code + " | " +
          row.submitted_at + " | " +
          (row.rejection_reason || "No reason recorded") +
          " | Correct";

        b.onclick = () => {
          dialog.close();
          dialog.remove();

          (async () => {
            try {
              if ((await getAll("outbox")).length) {
                throw Error("Sync pending sales first");
              }

              const counts = await countCash(row, true);

              if (!counts) return;

              await api({
                settlementId: row.settlement_id,
                denominations: counts
              });

              msg("Correction submitted for administrator approval.");

            } catch (e) {
              msg(e.message);
            }
          })();
        };

        dialog.append(b);
      }

      const close = document.createElement("button");
      close.textContent = "Cancel";
      close.onclick = () => dialog.close();

      dialog.append(close);

      dialog.addEventListener("close", () => dialog.remove(), {
        once: true
      });

      document.body.append(dialog);
      dialog.showModal();

    } catch (e) {
      msg(e.message);
    } finally {
      btn.disabled = false;
    }
  });

  // MANUAL SHIFT STATUS REFRESH

  $("shift-refresh").addEventListener("click", refresh);

  // OPEN CASHIER SHIFT

  $("shift-open").addEventListener("click", async () => {
    const device = await getSetting("device");

    if (!device?.token) {
      msg("Register this terminal first.");
      return;
    }

    const value = Number($("shift-float").value);
    const openingCents = Math.round(value * 100);

    if (
      !Number.isSafeInteger(openingCents) ||
      value < 0 ||
      Math.abs(openingCents / 100 - value) > 0.00001
    ) {
      msg("Enter a valid cash float with no more than 2 decimal places.");
      return;
    }

    $("shift-open").disabled = true;

    try {
      const response = await fetch("/api/cashier/shifts/open", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + device.token
        },
        body: JSON.stringify({
          outletCode: $("shift-outlet").value.trim().toUpperCase(),
          openingCents
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Opening failed");
      }

      msg("Shift opened successfully.");

      await refresh();
      await window.posRefreshAuthorization?.();

    } catch (error) {
      msg(error.message);
      $("shift-open").disabled = false;
    }
  });


  // AUTOMATIC OFFLINE STATUS AND SHIFT RECOVERY

  let reconnecting = false;
  let networkVersion = 0;

  const onlineControls = [
    "shift-open",
    "shift-close",
    "shift-refresh",
    "shift-movements",
    "shift-corrections"
  ];

  function disableOnlineControls() {
    onlineControls.forEach(id => {
      $(id).disabled = true;
    });
  }

  async function showOfflineStatus() {
    const version = networkVersion;

    disableOnlineControls();

    $("shift-state").textContent = "OFFLINE";

    msg(
      "Network unavailable. Online shift operations are disabled."
    );

    try {
      const cached = await getSetting("activeShift");

      if (version !== networkVersion || navigator.onLine) {
        return;
      }

      $("shift-state").textContent = cached?.shiftId
        ? "OFFLINE — cached shift"
        : "OFFLINE — no cached shift";

      msg(
        cached?.shiftId
          ? "Offline billing requires valid cached authorization."
          : "Reconnect to open or verify a cashier shift."
      );

    } catch {
      msg("Offline. Unable to verify cached shift.");
    }
  }

  window.addEventListener("offline", () => {
    networkVersion++;
    void showOfflineStatus();
  });

  async function recoverOnlineStatus() {
    if (reconnecting || !navigator.onLine) return;

    reconnecting = true;
    const version = networkVersion;

    disableOnlineControls();

    $("shift-state").textContent = "Verifying shift...";

    msg("Connection restored. Verifying cashier shift.");

    try {
      await refresh();

      if (!navigator.onLine || version !== networkVersion) {
        return;
      }

      await window.posRefreshAuthorization?.();

      if (!navigator.onLine || version !== networkVersion) {
        return;
      }

      const state = $("shift-state").textContent;

      const verified =
        state.startsWith("OPEN —") ||
        state === "No open shift";

      $("shift-refresh").disabled = false;
      $("shift-movements").disabled =
        !state.startsWith("OPEN —");

      $("shift-corrections").disabled = !verified;

    } catch (error) {
      disableOnlineControls();

      msg(
        "Unable to verify online session. Refresh Status to retry."
      );

      if (navigator.onLine) {
        $("shift-refresh").disabled = false;
      }

    } finally {
      reconnecting = false;

      if (!navigator.onLine) {
        await showOfflineStatus();
      } else if (version !== networkVersion) {
        void recoverOnlineStatus();
      }
    }
  }

  window.addEventListener("online", () => {
    networkVersion++;
    void recoverOnlineStatus();
  });

  // Keep online-only controls disabled while offline.
  setInterval(() => {
    if (!navigator.onLine) {
      disableOnlineControls();
    }
  }, 1000);

  // INITIAL SHIFT VERIFICATION

  if (navigator.onLine) {
    await recoverOnlineStatus();
  } else {
    await showOfflineStatus();
  }

})();
