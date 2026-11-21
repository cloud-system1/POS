
const products = [
  // Dosa
  { id: "M001", category: "Dosa", name: "Plain Dosa", price: 16000 },
  { id: "M002", category: "Dosa", name: "Masala Dosa", price: 46000 },
  { id: "M003", category: "Dosa", name: "Paper Dosa", price: 33000 },
  { id: "M004", category: "Dosa", name: "Ghee Dosa", price: 39000 },
  { id: "M005", category: "Dosa", name: "Onion Dosa", price: 33000 },
  { id: "M006", category: "Dosa", name: "Cheese Dosa", price: 62000 },
  { id: "M007", category: "Dosa", name: "Ghee Masala Dosa", price: 55000 },

  // Wada
  { id: "M008", category: "Wada", name: "Ulundu Vadai", price: 16000 },
  { id: "M009", category: "Wada", name: "Ala Bonda", price: 16000 },
  { id: "M010", category: "Wada", name: "Keera Wada", price: 16000 },
  { id: "M011", category: "Wada", name: "Masala Vadai", price: 10000 },
  { id: "M012", category: "Wada", name: "Veg Roti", price: 13000 },
  { id: "M013", category: "Wada", name: "Veg Samosa", price: 13000 },
  { id: "M014", category: "Wada", name: "Bajji - Maalu Miris", price: 16000 },

  // Parota
  { id: "M015", category: "Parota", name: "Parota", price: 10000 },
  { id: "M016", category: "Parota", name: "Ala Parata", price: 20000 },
  { id: "M017", category: "Parota", name: "Cheese Parota", price: 33000 },
  { id: "M018", category: "Parota", name: "Ghee Parota", price: 16000 },

  // Special Items
  { id: "M019", category: "Special Items", name: "Chilli Parata", price: 20000 },
  { id: "M020", category: "Special Items", name: "Macaroni", price: 33000 },
  { id: "M021", category: "Special Items", name: "Noodles", price: 33000 },
  { id: "M022", category: "Special Items", name: "Veg Kottu", price: 33000 },

  // Rice
  { id: "M023", category: "Rice", name: "Veg Biriyani", price: 46000 },
  { id: "M024", category: "Rice", name: "Rice and Curry", price: 49000 },

  // Other food
  { id: "M025", category: "Chapathi", name: "Chapathi", price: 33000 },
  { id: "M026", category: "Poori", name: "Poori", price: 33000 },
  { id: "M027", category: "Idli", name: "Idli", price: 34000 },
  { id: "M028", category: "Rulan Pittu", name: "Rulan Pittu", price: 33000 },
  { id: "M029", category: "String Hopper", name: "String Hopper Red", price: 29000 },
  { id: "M030", category: "String Hopper", name: "String Hopper White", price: 26000 },

  // Sweet
  { id: "M031", category: "Sweet", name: "Laddu", price: 17000 },
  { id: "M032", category: "Sweet", name: "Pani Walalu", price: 17000 },
  { id: "M033", category: "Sweet", name: "Son Papdi", price: 17000 },
  { id: "M034", category: "Sweet", name: "Mysore Pak", price: 17000 },
  { id: "M035", category: "Sweet", name: "Barfi", price: 17000 },
  { id: "M036", category: "Sweet", name: "Gulab Jamun", price: 26000 },

  // Tea
  { id: "M037", category: "Tea", name: "Tea (Milk Powder)", price: 16000 },
  { id: "M038", category: "Tea", name: "Tea (Fresh Milk)", price: 20000 },
  { id: "M039", category: "Tea", name: "Plain Tea", price: 7000 },
  { id: "M040", category: "Tea", name: "Kiri Kopi", price: 20000 },
  { id: "M041", category: "Tea", name: "Nestomalt", price: 17000 },
  { id: "M042", category: "Tea", name: "Masala Tea", price: 23000 },

  // Extra Curry
  { id: "M043", category: "Extra Curry", name: "Kadala", price: 16000 },
  { id: "M044", category: "Extra Curry", name: "Potato", price: 16000 },
  { id: "M045", category: "Extra Curry", name: "Soya Meat", price: 13000 },
  { id: "M046", category: "Extra Curry", name: "Mushroom", price: 20000 },
  { id: "M047", category: "Extra Curry", name: "Paneer", price: 26000 },

  // Juice
  { id: "M048", category: "Juice", name: "Avocado", price: 33000 },
  { id: "M049", category: "Juice", name: "Watermelon", price: 23000 },
  { id: "M050", category: "Juice", name: "Mango", price: 34000 },
  { id: "M051", category: "Juice", name: "Divul", price: 33000 },
  { id: "M052", category: "Juice", name: "Pineapple", price: 36000 },
  { id: "M053", category: "Juice", name: "Lime", price: 20000 },

  // Soft Drinks - 250ml
  { id: "M054", category: "Soft Drinks", name: "Pepsi", size: "250ml", price: 12000 },
  { id: "M055", category: "Soft Drinks", name: "Mirinda", size: "250ml", price: 12000 },
  { id: "M056", category: "Soft Drinks", name: "7Up", size: "250ml", price: 12000 },
  { id: "M057", category: "Soft Drinks", name: "Mountain Dew", size: "250ml", price: 12000 },
  { id: "M058", category: "Soft Drinks", name: "String", size: "250ml", price: 12000 },

  // Soft Drinks - 400ml
  { id: "M059", category: "Soft Drinks", name: "Pepsi", size: "400ml", price: 20000 },
  { id: "M060", category: "Soft Drinks", name: "Mirinda", size: "400ml", price: 20000 },
  { id: "M061", category: "Soft Drinks", name: "7Up", size: "400ml", price: 20000 },
  { id: "M062", category: "Soft Drinks", name: "Mountain Dew", size: "400ml", price: 20000 },
  { id: "M063", category: "Soft Drinks", name: "String", size: "400ml", price: 20000 },

  // Soft Drinks - 1Ltr
  { id: "M064", category: "Soft Drinks", name: "Pepsi", size: "1Ltr", price: 27000 },
  { id: "M065", category: "Soft Drinks", name: "Mirinda", size: "1Ltr", price: 27000 },
  { id: "M066", category: "Soft Drinks", name: "7Up", size: "1Ltr", price: 27000 },
  { id: "M067", category: "Soft Drinks", name: "Mountain Dew", size: "1Ltr", price: 27000 },
  { id: "M068", category: "Soft Drinks", name: "String", size: "1Ltr", price: 27000 },

  // Soft Drinks - 1.5Ltr
  { id: "M069", category: "Soft Drinks", name: "Pepsi", size: "1.5Ltr", price: 42000 },
  { id: "M070", category: "Soft Drinks", name: "Mirinda", size: "1.5Ltr", price: 42000 },
  { id: "M071", category: "Soft Drinks", name: "7Up", size: "1.5Ltr", price: 42000 },
  { id: "M072", category: "Soft Drinks", name: "Mountain Dew", size: "1.5Ltr", price: 42000 },
  { id: "M073", category: "Soft Drinks", name: "String", size: "1.5Ltr", price: 42000 },

  // Water
  { id: "M074", category: "Water", name: "Water Bottle", size: "500ml", price: 8000 },
  { id: "M075", category: "Water", name: "Water Bottle", size: "1Ltr", price: 12000 },
  { id: "M076", category: "Water", name: "Water Bottle", size: "1.5Ltr", price: 15000 }
];

// Category numbers are permanent. Item numbers follow menu order.
const categoryNames = [
  "Wada", "Dosa", "Parota", "Special Items", "Rice", "Chapathi",
  "Poori", "Idli", "Rulan Pittu", "String Hopper", "Sweet", "Tea",
  "Extra Curry", "Juice", "Soft Drinks", "Water"
];
const categoryCodes = new Map(categoryNames.map((name, i) => [name, i + 1]));
const counters = new Map();

products.forEach(product => {
  const next = (counters.get(product.category) || 0) + 1;
  counters.set(product.category, next);
  product.code = `${categoryCodes.get(product.category)}-${next}`;
});

const cart = new Map();
const $ = id => document.getElementById(id);
const money = cents => (cents / 100).toFixed(2);

let saving = false;
let activeCategory = "All";
let lastProductId = null;
let selectedIndex = 0;
let visibleProducts = [];

const categories = ["All", ...categoryNames];

function productCode(product) {
  return product.code;
}

function productName(product) {
  return product.size
    ? `${product.name} ${product.size}`
    : product.name;
}

function totalCents() {
  return [...cart.values()].reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
}

function showMessage(message) {
  $("message").textContent = message;
}

function focusSearch(clear = false) {
  const input = $("product-search");
  if (!input) return;

  if (clear) {
    input.value = "";
    activeCategory = "All";
    selectedIndex = 0;
    renderCategories();
    renderProducts();
  }

  input.focus();
  if (!clear) input.select();
}

function addProduct(product, quantity = 1) {
  if (
    saving ||
    !product ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 999
  ) {
    return false;
  }

  const existing = cart.get(product.id);
  const newQuantity = (existing?.qty || 0) + quantity;

  if (newQuantity > 999) {
    showMessage("Maximum quantity is 999 per item.");
    return false;
  }

  cart.set(product.id, {
    ...product,
    qty: newQuantity
  });

  lastProductId = product.id;
  renderCart();
  showMessage(`Added ${productName(product)} x${quantity}`);
  return true;
}

function parseSearch(raw) {
  const text = raw.trim();

  const match = text.match(
    /^(\d{1,2})\s*-\s*(\d{0,2})(?:\s*[*xX]\s*(\d{1,3}))?$/
  );

  if (!match) {
    return {
      text,
      quantity: 1,
      code: null,
      category: null,
      item: null
    };
  }

  return {
    text,
    quantity: match[3] ? Number(match[3]) : 1,
    code: match[2]
      ? `${Number(match[1])}-${Number(match[2])}`
      : null,
    category: Number(match[1]),
    item: match[2] ? Number(match[2]) : null
  };
}

function findProducts(query) {
  const parsed = parseSearch(query);
  const term = parsed.text.toLowerCase();

  if (parsed.category !== null) {
    return products.filter(product =>
      categoryCodes.get(product.category) === parsed.category &&
      (
        parsed.item === null ||
        Number(product.code.split("-")[1]) === parsed.item
      )
    );
  }

  return products.filter(product => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    const searchable = [
      productName(product),
      product.category,
      product.code,
      product.id
    ].join(" ").toLowerCase();

    return matchesCategory &&
      (!term || searchable.includes(term));
  });
}

function renderCategories() {
  const container = $("categories");
  if (!container) return;

  container.replaceChildren();

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";

    button.className =
      "category" +
      (category === activeCategory ? " active" : "");

    const number = categoryCodes.get(category);

    button.textContent = number
      ? `${number} - ${category}`
      : "All";

    button.setAttribute(
      "aria-pressed",
      String(category === activeCategory)
    );

    button.onclick = () => {
      activeCategory = category;
      $("product-search").value = "";
      selectedIndex = 0;
      renderCategories();
      renderProducts();
      $("product-search").focus();
    };

    container.appendChild(button);
  });
}

function updateSelection() {
  const buttons = $("products").querySelectorAll("button.product");

  buttons.forEach((button, index) => {
    const selected = index === selectedIndex;

    button.style.outline = selected
      ? "3px solid #22c55e"
      : "";

    button.style.outlineOffset = selected
      ? "-3px"
      : "";

    button.style.backgroundColor = selected
      ? "rgba(34, 197, 94, 0.20)"
      : "";

    button.setAttribute(
      "aria-selected",
      String(selected)
    );
  });

  buttons[selectedIndex]?.scrollIntoView({
    block: "nearest",
    inline: "nearest"
  });
}

function renderProducts() {
  const container = $("products");
  if (!container) return;

  container.replaceChildren();

  visibleProducts = findProducts(
    $("product-search")?.value || ""
  );

  if (selectedIndex >= visibleProducts.length) {
    selectedIndex = 0;
  }

  visibleProducts.forEach(product => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "product";

    const name = document.createElement("span");
    name.className = "product-name";
    name.textContent =
      `${productCode(product)} - ${productName(product)}`;

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = `Rs. ${money(product.price)}`;

    button.append(name, price);

    button.onclick = () => {
      if (addProduct(product)) {
        focusSearch(true);
      }
    };

    container.appendChild(button);
  });

  if (!visibleProducts.length) {
    const message = document.createElement("p");
    message.textContent = "No matching products found.";
    container.appendChild(message);
  }

  updateSelection();
}

function renderCart() {
  $("cart").replaceChildren();

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const label = document.createElement("span");

    label.textContent =
      `${productCode(item)} ${productName(item)} x${item.qty}` +
      ` - Rs. ${money(item.price * item.qty)}`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary";
    remove.textContent = "−";

    remove.setAttribute(
      "aria-label",
      `Remove one ${productName(item)}`
    );

    remove.onclick = () => {
      changeQuantity(item.id, -1);
    };

    row.append(label, remove);
    $("cart").appendChild(row);
  });

  $("total").textContent = money(totalCents());
  updateChange();
}

function changeQuantity(id, change) {
  if (saving || !id) return;

  const item = cart.get(id);
  if (!item) return;

  const quantity = item.qty + change;

  if (quantity <= 0) {
    cart.delete(id);

    if (lastProductId === id) {
      lastProductId = [...cart.keys()].at(-1) || null;
    }
  } else if (quantity <= 999) {
    cart.set(id, { ...item, qty: quantity });
  }

  renderCart();
}

function updateChange() {
  const cashText = $("cash").value.trim();
  const cents = Math.round(Number(cashText) * 100);

  $("change").textContent =
    cashText &&
    Number.isSafeInteger(cents) &&
    cents >= totalCents()
      ? money(cents - totalCents())
      : "0.00";
}

async function refreshPending() {
  $("pending").textContent =
    (await getAll("outbox")).length;
}

function updateStatus() {
  $("status").textContent = navigator.onLine
    ? "Network available - cloud sync checking"
    : "Offline - local billing";
}

function processProductEntry() {
  const input = $("product-search");
  const raw = input.value.trim();

  if (!raw) {
    showMessage(
      "Type a category code (e.g. 2-) or product name."
    );
    return;
  }

  const parsed = parseSearch(raw);

  if (parsed.quantity < 1 || parsed.quantity > 999) {
    showMessage("Enter a quantity from 1 to 999.");
    return;
  }

  let product = visibleProducts[selectedIndex];

  if (parsed.code) {
    product = products.find(
      p => p.code === parsed.code
    );
  }

  if (!product) {
    showMessage(
      "No matching product. Check the code or name."
    );
    return;
  }

  if (addProduct(product, parsed.quantity)) {
    focusSearch(true);
  }
}

async function checkout() {
  if (saving || !cart.size) return;

  const cashText = $("cash").value.trim();
  const received = Math.round(Number(cashText) * 100);
  const total = totalCents();

  if (
    cashText === "" ||
    !Number.isSafeInteger(received) ||
    received < total ||
    received < 0
  ) {
    showMessage("Enter sufficient cash received.");
    $("cash").focus();
    return;
  }

  saving = true;
  $("checkout").disabled = true;

  const sale = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currency: "LKR",
    items: [...cart.values()].map(item => ({ ...item })),
    totalCents: total,
    receivedCents: received,
    changeCents: received - total,
    paymentMethod: "cash"
  };

  try {
    await saveSale(sale);

    cart.clear();
    lastProductId = null;
    $("cash").value = "";

    renderCart();

    showMessage(
      `Sale ${sale.id.slice(0, 8)} saved locally.`
    );

    await refreshPending();
    focusSearch(true);
  } catch (err) {
    showMessage("Sale not saved: " + err.message);
  } finally {
    saving = false;
    $("checkout").disabled = false;
  }
}

async function exportBackup() {
  const sales = await getAll("sales");

  const blob = new Blob(
    [
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          sales
        },
        null,
        2
      )
    ],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `veg-pos-backup-${Date.now()}.json`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Live category / name search.
$("product-search").addEventListener("input", () => {
  if (activeCategory !== "All") {
    activeCategory = "All";
    renderCategories();
  }

  selectedIndex = 0;
  renderProducts();
});

$("product-search").addEventListener("keydown", event => {
  if (
    event.key === "ArrowDown" ||
    event.key === "ArrowUp"
  ) {
    event.preventDefault();

    if (visibleProducts.length) {
      selectedIndex = (
        selectedIndex +
        (event.key === "ArrowDown" ? 1 : -1) +
        visibleProducts.length
      ) % visibleProducts.length;

      updateSelection();
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    processProductEntry();
  }
});

// Cash entry.
$("cash").addEventListener("input", updateChange);

$("cash").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    checkout();
  }
});

// Global keyboard shortcuts.
document.addEventListener("keydown", event => {
  const key = event.key;
  const target = event.target;

  if (
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.isComposing ||
    event.repeat
  ) {
    return;
  }

  if (key === "F2") {
    event.preventDefault();
    focusSearch();
    return;
  }

  if (key === "F4") {
    event.preventDefault();
    $("cash").focus();
    $("cash").select();
    return;
  }

  if (key === "F8") {
    event.preventDefault();
    checkout();
    return;
  }

  if (key === "Escape") {
    event.preventDefault();
    focusSearch(true);
    return;
  }

  const typing =
    target instanceof HTMLElement &&
    (
      target.matches("input, textarea, select") ||
      target.isContentEditable
    );

  if (typing) return;

  if (key === "+" || key === "=") {
    if (lastProductId && cart.has(lastProductId)) {
      event.preventDefault();
      changeQuantity(lastProductId, 1);
    }
    return;
  }

  if (key === "-") {
    if (lastProductId && cart.has(lastProductId)) {
      event.preventDefault();
      changeQuantity(lastProductId, -1);
    }
    return;
  }

  if (
    key.length === 1 &&
    /^[a-zA-Z0-9]$/.test(key) &&
    !event.shiftKey
  ) {
    event.preventDefault();

    const input = $("product-search");
    input.focus();
    input.value += key;

    input.dispatchEvent(new Event("input"));
  }
});

// Existing buttons and status updates.
$("checkout").addEventListener("click", checkout);
$("export").addEventListener("click", exportBackup);

window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);

// Start POS.
renderCategories();
renderProducts();
renderCart();
updateStatus();

refreshPending().catch(err => {
  showMessage("Database error: " + err.message);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .catch(console.error);
}

focusSearch();
