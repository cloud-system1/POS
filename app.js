
/*
  VEG TAKEAWAY POS
  Keyboard-only product search with dropdown
  Offline billing and cloud sync compatible
*/

// ============================================
// 1. PRODUCT MENU - 76 ITEMS
// ============================================

const products = [
  // DOSA
  { id: "M001", category: "Dosa", name: "Plain Dosa", price: 16000 },
  { id: "M002", category: "Dosa", name: "Masala Dosa", price: 46000 },
  { id: "M003", category: "Dosa", name: "Paper Dosa", price: 33000 },
  { id: "M004", category: "Dosa", name: "Ghee Dosa", price: 39000 },
  { id: "M005", category: "Dosa", name: "Onion Dosa", price: 33000 },
  { id: "M006", category: "Dosa", name: "Cheese Dosa", price: 62000 },
  { id: "M007", category: "Dosa", name: "Ghee Masala Dosa", price: 55000 },

  // WADA
  { id: "M008", category: "Wada", name: "Ulundu Vadai", price: 16000 },
  { id: "M009", category: "Wada", name: "Ala Bonda", price: 16000 },
  { id: "M010", category: "Wada", name: "Keera Wada", price: 16000 },
  { id: "M011", category: "Wada", name: "Masala Vadai", price: 10000 },
  { id: "M012", category: "Wada", name: "Veg Roti", price: 13000 },
  { id: "M013", category: "Wada", name: "Veg Samosa", price: 13000 },
  { id: "M014", category: "Wada", name: "Bajji - Maalu Miris", price: 16000 },

  // PAROTA
  { id: "M015", category: "Parota", name: "Parota", price: 10000 },
  { id: "M016", category: "Parota", name: "Ala Parata", price: 20000 },
  { id: "M017", category: "Parota", name: "Cheese Parota", price: 33000 },
  { id: "M018", category: "Parota", name: "Ghee Parota", price: 16000 },

  // SPECIAL ITEMS
  { id: "M019", category: "Special Items", name: "Chilli Parata", price: 20000 },
  { id: "M020", category: "Special Items", name: "Macaroni", price: 33000 },
  { id: "M021", category: "Special Items", name: "Noodles", price: 33000 },
  { id: "M022", category: "Special Items", name: "Veg Kottu", price: 33000 },

  // RICE
  { id: "M023", category: "Rice", name: "Veg Biriyani", price: 46000 },
  { id: "M024", category: "Rice", name: "Rice and Curry", price: 49000 },

  // OTHER FOOD
  { id: "M025", category: "Chapathi", name: "Chapathi", price: 33000 },
  { id: "M026", category: "Poori", name: "Poori", price: 33000 },
  { id: "M027", category: "Idli", name: "Idli", price: 34000 },
  { id: "M028", category: "Rulan Pittu", name: "Rulan Pittu", price: 33000 },
  { id: "M029", category: "String Hopper", name: "String Hopper Red", price: 29000 },
  { id: "M030", category: "String Hopper", name: "String Hopper White", price: 26000 },

  // SWEETS
  { id: "M031", category: "Sweet", name: "Laddu", price: 17000 },
  { id: "M032", category: "Sweet", name: "Pani Walalu", price: 17000 },
  { id: "M033", category: "Sweet", name: "Son Papdi", price: 17000 },
  { id: "M034", category: "Sweet", name: "Mysore Pak", price: 17000 },
  { id: "M035", category: "Sweet", name: "Barfi", price: 17000 },
  { id: "M036", category: "Sweet", name: "Gulab Jamun", price: 26000 },

  // TEA
  { id: "M037", category: "Tea", name: "Tea (Milk Powder)", price: 16000 },
  { id: "M038", category: "Tea", name: "Tea (Fresh Milk)", price: 20000 },
  { id: "M039", category: "Tea", name: "Plain Tea", price: 7000 },
  { id: "M040", category: "Tea", name: "Kiri Kopi", price: 20000 },
  { id: "M041", category: "Tea", name: "Nestomalt", price: 17000 },
  { id: "M042", category: "Tea", name: "Masala Tea", price: 23000 },

  // EXTRA CURRY
  { id: "M043", category: "Extra Curry", name: "Kadala", price: 16000 },
  { id: "M044", category: "Extra Curry", name: "Potato", price: 16000 },
  { id: "M045", category: "Extra Curry", name: "Soya Meat", price: 13000 },
  { id: "M046", category: "Extra Curry", name: "Mushroom", price: 20000 },
  { id: "M047", category: "Extra Curry", name: "Paneer", price: 26000 },

  // JUICE
  { id: "M048", category: "Juice", name: "Avocado", price: 33000 },
  { id: "M049", category: "Juice", name: "Watermelon", price: 23000 },
  { id: "M050", category: "Juice", name: "Mango", price: 34000 },
  { id: "M051", category: "Juice", name: "Divul", price: 33000 },
  { id: "M052", category: "Juice", name: "Pineapple", price: 36000 },
  { id: "M053", category: "Juice", name: "Lime", price: 20000 },

  // SOFT DRINKS - 250ml
  { id: "M054", category: "Soft Drinks", name: "Pepsi", size: "250ml", price: 12000 },
  { id: "M055", category: "Soft Drinks", name: "Mirinda", size: "250ml", price: 12000 },
  { id: "M056", category: "Soft Drinks", name: "7Up", size: "250ml", price: 12000 },
  { id: "M057", category: "Soft Drinks", name: "Mountain Dew", size: "250ml", price: 12000 },
  { id: "M058", category: "Soft Drinks", name: "String", size: "250ml", price: 12000 },

  // SOFT DRINKS - 400ml
  { id: "M059", category: "Soft Drinks", name: "Pepsi", size: "400ml", price: 20000 },
  { id: "M060", category: "Soft Drinks", name: "Mirinda", size: "400ml", price: 20000 },
  { id: "M061", category: "Soft Drinks", name: "7Up", size: "400ml", price: 20000 },
  { id: "M062", category: "Soft Drinks", name: "Mountain Dew", size: "400ml", price: 20000 },
  { id: "M063", category: "Soft Drinks", name: "String", size: "400ml", price: 20000 },

  // SOFT DRINKS - 1Ltr
  { id: "M064", category: "Soft Drinks", name: "Pepsi", size: "1Ltr", price: 27000 },
  { id: "M065", category: "Soft Drinks", name: "Mirinda", size: "1Ltr", price: 27000 },
  { id: "M066", category: "Soft Drinks", name: "7Up", size: "1Ltr", price: 27000 },
  { id: "M067", category: "Soft Drinks", name: "Mountain Dew", size: "1Ltr", price: 27000 },
  { id: "M068", category: "Soft Drinks", name: "String", size: "1Ltr", price: 27000 },

  // SOFT DRINKS - 1.5Ltr
  { id: "M069", category: "Soft Drinks", name: "Pepsi", size: "1.5Ltr", price: 42000 },
  { id: "M070", category: "Soft Drinks", name: "Mirinda", size: "1.5Ltr", price: 42000 },
  { id: "M071", category: "Soft Drinks", name: "7Up", size: "1.5Ltr", price: 42000 },
  { id: "M072", category: "Soft Drinks", name: "Mountain Dew", size: "1.5Ltr", price: 42000 },
  { id: "M073", category: "Soft Drinks", name: "String", size: "1.5Ltr", price: 42000 },

  // WATER
  { id: "M074", category: "Water", name: "Water Bottle", size: "500ml", price: 8000 },
  { id: "M075", category: "Water", name: "Water Bottle", size: "1Ltr", price: 12000 },
  { id: "M076", category: "Water", name: "Water Bottle", size: "1.5Ltr", price: 15000 }
];

// ============================================
// 2. CATEGORY AND PRODUCT CODES
// ============================================

const categoryNames = [
  "Wada",
  "Dosa",
  "Parota",
  "Special Items",
  "Rice",
  "Chapathi",
  "Poori",
  "Idli",
  "Rulan Pittu",
  "String Hopper",
  "Sweet",
  "Tea",
  "Extra Curry",
  "Juice",
  "Soft Drinks",
  "Water"
];

const categoryCodes = new Map(
  categoryNames.map((name, index) => [
    name,
    index + 1
  ])
);

const categoryCounters = new Map();

products.forEach(product => {
  const next =
    (categoryCounters.get(product.category) || 0) + 1;

  categoryCounters.set(product.category, next);

  product.code =
    `${categoryCodes.get(product.category)}-${next}`;
});

const productsByCode = new Map(
  products.map(product => [product.code, product])
);

// ============================================
// 3. APPLICATION STATE
// ============================================

const $ = id => document.getElementById(id);

const money = cents =>
  (cents / 100).toFixed(2);

const cart = new Map();

let activeCategory = "All";
let selectedIndex = 0;
let visibleProducts = [];
let dropdownOpen = false;
let lastProductId = null;
let saving = false;

const categories = [
  "All",
  ...categoryNames
];

const searchInput = $("product-search");
const dropdown = $("product-dropdown");

// ============================================
// 4. BASIC HELPERS
// ============================================

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
    (total, item) =>
      total + item.price * item.qty,
    0
  );
}

function showMessage(text) {
  const message = $("message");

  if (message) {
    message.textContent = text;
  }
}

function focusSearch() {
  searchInput.focus();
}

function closeDropdown() {
  dropdownOpen = false;
  dropdown.hidden = true;
  dropdown.replaceChildren();

  searchInput.setAttribute(
    "aria-expanded",
    "false"
  );

  searchInput.removeAttribute(
    "aria-activedescendant"
  );
}

function clearSearch() {
  searchInput.value = "";
  selectedIndex = 0;
  visibleProducts = [];
  activeCategory = "All";

  closeDropdown();
  renderCategories();
  focusSearch();
}

// ============================================
// 5. SEARCH PARSING
// ============================================

function parseSearch(raw) {
  const text = raw.trim();

  // Examples:
  // 2-
  // 2-1
  // 2-2
  // 2-2*3
  // 2-2x3

  const match = text.match(
    /^(\d{1,2})\s*-\s*(\d{0,2})(?:\s*[*xX]\s*(\d{1,3}))?$/
  );

  if (!match) {
    return {
      text,
      category: null,
      item: null,
      code: null,
      quantity: 1
    };
  }

  const category = Number(match[1]);

  const item = match[2]
    ? Number(match[2])
    : null;

  const quantity = match[3]
    ? Number(match[3])
    : 1;

  return {
    text,
    category,
    item,
    code: item !== null
      ? `${category}-${item}`
      : null,
    quantity
  };
}

function findProducts(raw) {
  const parsed = parseSearch(raw);

  if (parsed.category !== null) {
    return products.filter(product => {
      const categoryNumber =
        categoryCodes.get(product.category);

      if (categoryNumber !== parsed.category) {
        return false;
      }

      if (parsed.item === null) {
        return true;
      }

      return Number(
        product.code.split("-")[1]
      ) === parsed.item;
    });
  }

  const term = parsed.text.toLowerCase();

  return products.filter(product => {
    const categoryMatches =
      activeCategory === "All" ||
      product.category === activeCategory;

    const searchable = [
      product.name,
      product.size || "",
      product.category,
      product.code,
      product.id
    ].join(" ").toLowerCase();

    return (
      categoryMatches &&
      (!term || searchable.includes(term))
    );
  });
}

// ============================================
// 6. DROPDOWN RENDERING
// ============================================

function renderDropdown() {
  dropdown.replaceChildren();

  if (!dropdownOpen) {
    closeDropdown();
    return;
  }

  dropdown.hidden = false;

  searchInput.setAttribute(
    "aria-expanded",
    "true"
  );

  if (!visibleProducts.length) {
    const empty = document.createElement("div");

    empty.className = "dropdown-empty";
    empty.textContent = "No matching products found.";

    dropdown.appendChild(empty);

    searchInput.removeAttribute(
      "aria-activedescendant"
    );

    return;
  }

  visibleProducts.forEach((product, index) => {
    const row = document.createElement("button");

    row.type = "button";
    row.className = "dropdown-item";
    row.id = `dropdown-option-${index}`;
    row.setAttribute("role", "option");

    const code = document.createElement("span");
    code.className = "dropdown-code";
    code.textContent = product.code;

    const name = document.createElement("span");
    name.className = "dropdown-name";
    name.textContent = productName(product);

    const price = document.createElement("span");
    price.className = "dropdown-price";
    price.textContent = `Rs. ${money(product.price)}`;

    row.append(code, name, price);

    row.addEventListener("mousedown", event => {
      // Keep focus on the search input.
      event.preventDefault();
    });

    row.addEventListener("click", () => {
      if (addProduct(product, 1)) {
        clearSearch();
      }
    });

    dropdown.appendChild(row);
  });

  updateDropdownSelection();
}

function updateDropdownSelection() {
  const rows = dropdown.querySelectorAll(
    ".dropdown-item"
  );

  rows.forEach((row, index) => {
    const selected = index === selectedIndex;

    row.classList.toggle(
      "selected",
      selected
    );

    row.setAttribute(
      "aria-selected",
      String(selected)
    );
  });

  const selectedRow = rows[selectedIndex];

  if (selectedRow) {
    searchInput.setAttribute(
      "aria-activedescendant",
      selectedRow.id
    );

    selectedRow.scrollIntoView({
      block: "nearest",
      inline: "nearest"
    });
  } else {
    searchInput.removeAttribute(
      "aria-activedescendant"
    );
  }
}

function openDropdown() {
  visibleProducts = findProducts(
    searchInput.value
  );

  selectedIndex = 0;
  dropdownOpen = true;

  renderDropdown();
}

function moveDropdownSelection(direction) {
  if (!dropdownOpen) {
    openDropdown();
    return;
  }

  if (!visibleProducts.length) {
    return;
  }

  selectedIndex = (
    selectedIndex +
    direction +
    visibleProducts.length
  ) % visibleProducts.length;

  updateDropdownSelection();
}

// ============================================
// 7. CATEGORY BUTTONS
// ============================================

function renderCategories() {
  const container = $("categories");

  if (!container) {
    return;
  }

  container.replaceChildren();

  categories.forEach(category => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "category";

    if (category === activeCategory) {
      button.classList.add("active");
    }

    const number = categoryCodes.get(category);

    button.textContent = number
      ? `${number} - ${category}`
      : "All";

    button.setAttribute(
      "aria-pressed",
      String(category === activeCategory)
    );

    button.addEventListener("click", () => {
      activeCategory = category;
      searchInput.value = "";

      renderCategories();
      openDropdown();
      focusSearch();
    });

    container.appendChild(button);
  });
}

// ============================================
// 8. ADD PRODUCTS TO CART
// ============================================

function addProduct(product, quantity = 1) {
  if (saving || !product) {
    return false;
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 999
  ) {
    showMessage(
      "Quantity must be between 1 and 999."
    );
    return false;
  }

  const existing = cart.get(product.id);

  const newQuantity =
    (existing?.qty || 0) + quantity;

  if (newQuantity > 999) {
    showMessage(
      "Maximum quantity is 999 per product."
    );
    return false;
  }

  cart.set(product.id, {
    ...product,
    qty: newQuantity
  });

  lastProductId = product.id;

  renderCart();

  showMessage(
    `Added ${productName(product)} x${quantity}`
  );

  return true;
}

// ============================================
// 9. CART AND QUANTITY
// ============================================

function changeQuantity(id, change) {
  if (saving) {
    return;
  }

  const item = cart.get(id);

  if (!item) {
    return;
  }

  const next = item.qty + change;

  if (next <= 0) {
    cart.delete(id);

    if (lastProductId === id) {
      lastProductId =
        [...cart.keys()].at(-1) || null;
    }
  } else if (next <= 999) {
    cart.set(id, {
      ...item,
      qty: next
    });
  }

  renderCart();
}

function renderCart() {
  const container = $("cart");

  container.replaceChildren();

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const label = document.createElement("span");

    label.textContent =
      `${productCode(item)} - ` +
      `${productName(item)} x${item.qty} ` +
      `= Rs. ${money(item.price * item.qty)}`;

    const removeButton =
      document.createElement("button");

    removeButton.type = "button";
    removeButton.className = "secondary";
    removeButton.textContent = "−";

    removeButton.setAttribute(
      "aria-label",
      `Remove one ${productName(item)}`
    );

    removeButton.addEventListener("click", () => {
      changeQuantity(item.id, -1);
    });

    row.append(label, removeButton);
    container.appendChild(row);
  });

  $("total").textContent = money(
    totalCents()
  );

  updateChange();
}

// ============================================
// 10. CASH AND CHANGE
// ============================================

function updateChange() {
  const cashText = $("cash").value.trim();

  const received = Math.round(
    Number(cashText) * 100
  );

  const total = totalCents();

  if (
    cashText !== "" &&
    Number.isSafeInteger(received) &&
    received >= total
  ) {
    $("change").textContent = money(
      received - total
    );
  } else {
    $("change").textContent = "0.00";
  }
}

// ============================================
// 11. PRODUCT SELECTION
// ============================================

function processProductEntry() {
  const raw = searchInput.value.trim();

  if (!raw && !dropdownOpen) {
    showMessage(
      "Type a product code or product name."
    );
    return;
  }

  const parsed = parseSearch(raw);

  if (
    !Number.isSafeInteger(parsed.quantity) ||
    parsed.quantity < 1 ||
    parsed.quantity > 999
  ) {
    showMessage(
      "Enter a quantity between 1 and 999."
    );
    return;
  }

  if (!dropdownOpen) {
    openDropdown();
  }

  let product = visibleProducts[selectedIndex];

  // Exact code entry takes priority.
  if (parsed.code !== null) {
    product = productsByCode.get(
      parsed.code
    );
  }

  if (!product) {
    showMessage(
      "No matching product. Check the code."
    );
    return;
  }

  if (addProduct(product, parsed.quantity)) {
    clearSearch();
  }
}

// ============================================
// 12. SAVE SALE - OFFLINE FIRST
// ============================================

async function checkout() {
  if (saving) {
    return;
  }

  if (!cart.size) {
    showMessage(
      "Add at least one product before checkout."
    );
    focusSearch();
    return;
  }

  const cashText = $("cash").value.trim();

  const received = Math.round(
    Number(cashText) * 100
  );

  const total = totalCents();

  if (
    cashText === "" ||
    !Number.isSafeInteger(received) ||
    received < 0 ||
    received < total
  ) {
    showMessage(
      "Enter sufficient cash received."
    );

    $("cash").focus();
    return;
  }

  saving = true;
  $("checkout").disabled = true;

  const sale = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currency: "LKR",
    items: [...cart.values()].map(item => ({
      ...item
    })),
    totalCents: total,
    receivedCents: received,
    changeCents: received - total,
    paymentMethod: "cash"
  };

  let saved = false;

  try {
    // Existing db.js handles local sales
    // and the cloud sync outbox.
    await saveSale(sale);
    saved = true;

    cart.clear();
    lastProductId = null;

    $("cash").value = "";

    renderCart();

    showMessage(
      `Sale ${sale.id.slice(0, 8)} ` +
      `saved locally. ` +
      `Change: Rs. ${money(sale.changeCents)}`
    );

    clearSearch();
  } catch (error) {
    showMessage(
      "Sale not saved: " + error.message
    );
  } finally {
    saving = false;
    $("checkout").disabled = false;
  }

  if (saved) {
    try {
      await refreshPending();
    } catch (error) {
      console.error(
        "Pending count error:",
        error
      );
    }
  }
}

// ============================================
// 13. PENDING CLOUD SYNC
// ============================================

async function refreshPending() {
  const outbox = await getAll("outbox");

  $("pending").textContent =
    outbox.length;
}

function updateStatus() {
  $("status").textContent =
    navigator.onLine
      ? "Network available - cloud sync checking"
      : "Offline - local billing";
}

// ============================================
// 14. EXPORT SALES BACKUP
// ============================================

async function exportBackup() {
  try {
    const sales = await getAll("sales");

    const backup = {
      exportedAt: new Date().toISOString(),
      sales
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      {
        type: "application/json"
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `veg-pos-backup-${Date.now()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    showMessage(
      "Local sales backup exported."
    );
  } catch (error) {
    showMessage(
      "Backup failed: " + error.message
    );
  }
}

// ============================================
// 15. SEARCH INPUT EVENTS
// ============================================

searchInput.addEventListener("input", () => {
  // Typing a new search removes
  // the category button filter.
  activeCategory = "All";

  renderCategories();

  if (searchInput.value.trim() === "") {
    closeDropdown();
    visibleProducts = [];
    selectedIndex = 0;
    return;
  }

  openDropdown();
});

searchInput.addEventListener("keydown", event => {
  if (event.key === "ArrowDown") {
    event.preventDefault();

    moveDropdownSelection(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();

    moveDropdownSelection(-1);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();

    processProductEntry();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();

    clearSearch();
  }
});

searchInput.addEventListener("focus", () => {
  if (
    searchInput.value.trim() !== "" &&
    !dropdownOpen
  ) {
    openDropdown();
  }
});

// ============================================
// 16. CASH INPUT EVENTS
// ============================================

$("cash").addEventListener(
  "input",
  updateChange
);

$("cash").addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkout();
    }
  }
);

// ============================================
// 17. GLOBAL KEYBOARD SHORTCUTS
// ============================================

document.addEventListener("keydown", event => {
  const key = event.key;

  if (
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.isComposing
  ) {
    return;
  }

  // F2 = Product search
  if (key === "F2") {
    event.preventDefault();
    focusSearch();
    return;
  }

  // F4 = Cash received
  if (key === "F4") {
    event.preventDefault();

    closeDropdown();

    $("cash").focus();
    $("cash").select();
    return;
  }

  // F8 = Complete sale
  if (key === "F8") {
    event.preventDefault();
    checkout();
    return;
  }

  // ESC = Clear search
  if (key === "Escape") {
    event.preventDefault();
    clearSearch();
    return;
  }

  const target = event.target;

  const typing =
    target instanceof HTMLElement &&
    (
      target.matches(
        "input, textarea, select"
      ) ||
      target.isContentEditable
    );

  if (typing) {
    return;
  }

  // + increases last selected product.
  if (key === "+" || key === "=") {
    if (
      lastProductId &&
      cart.has(lastProductId)
    ) {
      event.preventDefault();

      changeQuantity(
        lastProductId,
        1
      );
    }

    return;
  }

  // - decreases last selected product.
  if (key === "-") {
    if (
      lastProductId &&
      cart.has(lastProductId)
    ) {
      event.preventDefault();

      changeQuantity(
        lastProductId,
        -1
      );
    }

    return;
  }

  // Start typing from anywhere
  // except another input field.
  if (
    key.length === 1 &&
    /^[a-zA-Z0-9]$/.test(key)
  ) {
    event.preventDefault();

    searchInput.focus();
    searchInput.value += key;

    searchInput.dispatchEvent(
      new Event("input", {
        bubbles: true
      })
    );
  }
});

// ============================================
// 18. BUTTON EVENTS
// ============================================

$("checkout").addEventListener(
  "click",
  checkout
);

$("export").addEventListener(
  "click",
  exportBackup
);

// ============================================
// 19. CONNECTION EVENTS
// ============================================

window.addEventListener(
  "online",
  updateStatus
);

window.addEventListener(
  "offline",
  updateStatus
);

// Close dropdown when clicking elsewhere.
document.addEventListener("pointerdown", event => {
  if (
    !event.target.closest(
      ".search-wrapper"
    ) &&
    !event.target.closest(
      "#categories"
    )
  ) {
    closeDropdown();
  }
});

// ============================================
// 20. INITIALIZE POS
// ============================================

renderCategories();
renderCart();
updateStatus();
closeDropdown();

refreshPending().catch(error => {
  console.error(
    "Database error:",
    error
  );

  showMessage(
    "Database error: " + error.message
  );
});

// Register existing service worker.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .catch(console.error);
}

// Start with cursor in product search.
focusSearch();
