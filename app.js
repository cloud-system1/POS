
const products = [
  { id: "P01", name: "Veg Fried Rice", price: 75000 },
  { id: "P02", name: "Veg Kottu", price: 90000 },
  { id: "P03", name: "Veg Noodles", price: 80000 },
  { id: "P04", name: "Veg Roti", price: 18000 },
  { id: "P05", name: "Lime Juice", price: 35000 },
  { id: "P06", name: "Veg Rolls", price: 15000 }
];

// All amounts use cents to avoid floating-point errors.
const cart = new Map();
const $ = id => document.getElementById(id);
const money = cents => (cents / 100).toFixed(2);
let saving = false;

function totalCents() {
  return [...cart.values()].reduce(
    (sum, item) => sum + item.price * item.qty, 0
  );
}

function renderProducts() {
  $("products").replaceChildren();
  products.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "product";
    btn.textContent = `${p.name} — Rs. ${money(p.price)}`;
    btn.onclick = () => {
      const item = cart.get(p.id);
      cart.set(p.id, { ...p, qty: (item?.qty || 0) + 1 });
      renderCart();
    };
    $("products").appendChild(btn);
  });
}

function renderCart() {
  $("cart").replaceChildren();

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const label = document.createElement("span");
    label.textContent = `${item.name} x${item.qty}`;

    const remove = document.createElement("button");
    remove.className = "secondary";
    remove.textContent = "−";
    remove.onclick = () => {
      if (item.qty === 1) cart.delete(item.id);
      else cart.set(item.id, { ...item, qty: item.qty - 1 });
      renderCart();
    };

    row.append(label, remove);
    $("cart").appendChild(row);
  });

  $("total").textContent = money(totalCents());
  updateChange();
}

function updateChange() {
  const cash = Number($("cash").value);
  const cents = Math.round(cash * 100);
  $("change").textContent =
    Number.isFinite(cents) && cents >= totalCents()
      ? money(cents - totalCents()) : "0.00";
}

async function refreshPending() {
  $("pending").textContent = (await getAll("outbox")).length;
}

function updateStatus() {
  $("status").textContent = navigator.onLine
    ? "Network available — cloud sync not configured"
    : "Offline — local billing";
}

async function checkout() {
  if (saving || !cart.size) return;

  const cash = Number($("cash").value);
  const received = Math.round(cash * 100);
  const total = totalCents();

  if (!Number.isSafeInteger(received) ||
      received < total || received < 0) {
    $("message").textContent = "Enter sufficient cash received.";
    return;
  }

  saving = true;
  $("checkout").disabled = true;

  const sale = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currency: "LKR",
    items: [...cart.values()].map(x => ({ ...x })),
    totalCents: total,
    receivedCents: received,
    changeCents: received - total,
    paymentMethod: "cash"
  };

  try {
    await saveSale(sale);
    cart.clear();
    $("cash").value = "";
    renderCart();
    $("message").textContent =
      `Sale ${sale.id.slice(0, 8)} saved locally.`;
    await refreshPending();
  } catch (err) {
    $("message").textContent = "Sale not saved: " + err.message;
  } finally {
    saving = false;
    $("checkout").disabled = false;
  }
}

async function exportBackup() {
  const sales = await getAll("sales");
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), sales }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `veg-pos-backup-${Date.now()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$("cash").addEventListener("input", updateChange);
$("checkout").addEventListener("click", checkout);
$("export").addEventListener("click", exportBackup);
window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);

renderProducts();
renderCart();
updateStatus();
refreshPending().catch(err => {
  $("message").textContent = "Database error: " + err.message;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(console.error);
}

