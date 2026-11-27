
/*
  VEG TAKEAWAY POS
  Complete app.js

  Features:
  - 76 products
  - Category and sub-item codes
  - Keyboard dropdown
  - Product photo cards
  - Offline billing
  - Cloud sync compatibility
*/

"use strict";

// ============================================
// 1. PRODUCT MENU
// Prices are stored in cents.
// Rs. 160 = 16000
// ============================================

const products = [
  // DOSA
  { id:"M001", category:"Dosa", name:"Plain Dosa", price:12000 },
  { id:"M002", category:"Dosa", name:"Masala Dosa", price:35000 },
  { id:"M003", category:"Dosa", name:"Paper Dosa", price:25000 },
  { id:"M004", category:"Dosa", name:"Ghee Dosa", price:30000 },
  { id:"M005", category:"Dosa", name:"Onion Dosa", price:25000 },
  { id:"M006", category:"Dosa", name:"Cheese Dosa", price:48000 },
  { id:"M007", category:"Dosa", name:"Ghee Masala Dosa", price:42000 },

  // WADA
  { id:"M008", category:"Wada", name:"Ulundu Vadai", price:12000 },
  { id:"M009", category:"Wada", name:"Ala Bonda", price:12000 },
  { id:"M010", category:"Wada", name:"Keera Wada", price:12000 },
  { id:"M011", category:"Wada", name:"Masala Vadai", price:8000 },
  { id:"M012", category:"Wada", name:"Veg Roti", price:10000 },
  { id:"M013", category:"Wada", name:"Veg Samosa", price:10000 },
  { id:"M014", category:"Wada", name:"Bajji - Maalu Miris", price:12000 },

  // PAROTA
  { id:"M015", category:"Parota", name:"Parota", price:8000 },
  { id:"M016", category:"Parota", name:"Ala Parata", price:15000 },
  { id:"M017", category:"Parota", name:"Cheese Parota", price:25000 },
  { id:"M018", category:"Parota", name:"Ghee Parota", price:12000 },

  // OTHER ITEMS
  { id:"M019", category:"Other Items", name:"Chilli Parata", price:15000 },
  { id:"M020", category:"Other Items", name:"Macaroni", price:25000 },
  { id:"M021", category:"Other Items", name:"Noodles", price:25000 },
  { id:"M022", category:"Other Items", name:"Veg Kottu", price:25000 },

  // RICE
  { id:"M023", category:"Rice", name:"Veg Biriyani", price:35000 },
  { id:"M024", category:"Rice", name:"Rice and Curry", price:38000 },

  // SPECIAL ITEMS
  { id:"M025", category:"Special Items", name:"Chapathi", price:25000 },
  { id:"M026", category:"Special Items", name:"Poori", price:25000 },
  { id:"M027", category:"Special Items", name:"Idli", price:26000 },
  { id:"M028", category:"Special Items", name:"Rulan Pittu", price:25000 },
  { id:"M029", category:"Special Items", name:"Strink Hopper Red", price:22000 },
  { id:"M030", category:"Special Items", name:"Strink Hopper White", price:20000 },

  // SWEET
  { id:"M031", category:"Sweet", name:"Laddu", price:13000 },
  { id:"M032", category:"Sweet", name:"Pani Walalu", price:13000 },
  { id:"M033", category:"Sweet", name:"Son Papdi", price:13000 },
  { id:"M034", category:"Sweet", name:"Mysore Pak", price:13000 },
  { id:"M035", category:"Sweet", name:"Barfi", price:13000 },
  { id:"M036", category:"Sweet", name:"Gulab Jamun", price:20000 },

  // TEA
  { id:"M037", category:"Tea", name:"Tea (Milk Powder)", price:12000 },
  { id:"M038", category:"Tea", name:"Tea (Fresh Milk)", price:15000 },
  { id:"M039", category:"Tea", name:"Plain Tea", price:5000 },
  { id:"M040", category:"Tea", name:"Kiri Kopi", price:15000 },
  { id:"M041", category:"Tea", name:"Nestomalt", price:13000 },
  { id:"M042", category:"Tea", name:"Masala Tea", price:18000 },

  // EXTRA CURRY
  { id:"M043", category:"Extra Curry", name:"Kadala Curry", price:12000 },
  { id:"M044", category:"Extra Curry", name:"Potato Curry", price:12000 },
  { id:"M045", category:"Extra Curry", name:"SoyaMeat Curry", price:10000 },
  { id:"M046", category:"Extra Curry", name:"Mushroom Curry", price:15000 },
  { id:"M047", category:"Extra Curry", name:"Paneer Curry", price:20000 },

  // JUICE
  { id:"M048", category:"Juice", name:"Avocado Juice", price:25000 },
  { id:"M049", category:"Juice", name:"Watermelon Juice", price:18000 },
  { id:"M050", category:"Juice", name:"Mango Juice", price:26000 },
  { id:"M051", category:"Juice", name:"Divul Juice", price:25000 },
  { id:"M052", category:"Juice", name:"Pineapple Juice", price:28000 },
  { id:"M053", category:"Juice", name:"Lime Juice", price:15000 },

  // SOFT DRINKS - 250ml
  { id:"M054", category:"Soft Drinks", name:"Pepsi", size:"250ml", price:12000 },
  { id:"M055", category:"Soft Drinks", name:"Mirinda", size:"250ml", price:12000 },
  { id:"M056", category:"Soft Drinks", name:"7Up", size:"250ml", price:12000 },
  { id:"M057", category:"Soft Drinks", name:"Mountain Dew", size:"250ml", price:12000 },
  { id:"M058", category:"Soft Drinks", name:"String", size:"250ml", price:12000 },

  // SOFT DRINKS - 400ml
  { id:"M059", category:"Soft Drinks", name:"Pepsi", size:"400ml", price:20000 },
  { id:"M060", category:"Soft Drinks", name:"Mirinda", size:"400ml", price:20000 },
  { id:"M061", category:"Soft Drinks", name:"7Up", size:"400ml", price:20000 },
  { id:"M062", category:"Soft Drinks", name:"Mountain Dew", size:"400ml", price:20000 },
  { id:"M063", category:"Soft Drinks", name:"String", size:"400ml", price:20000 },

  // SOFT DRINKS - 1Ltr
  { id:"M064", category:"Soft Drinks", name:"Pepsi", size:"1Ltr", price:27000 },
  { id:"M065", category:"Soft Drinks", name:"Mirinda", size:"1Ltr", price:27000 },
  { id:"M066", category:"Soft Drinks", name:"7Up", size:"1Ltr", price:27000 },
  { id:"M067", category:"Soft Drinks", name:"Mountain Dew", size:"1Ltr", price:27000 },
  { id:"M068", category:"Soft Drinks", name:"String", size:"1Ltr", price:27000 },

  // SOFT DRINKS - 1.5Ltr
  { id:"M069", category:"Soft Drinks", name:"Pepsi", size:"1.5Ltr", price:42000 },
  { id:"M070", category:"Soft Drinks", name:"Mirinda", size:"1.5Ltr", price:42000 },
  { id:"M071", category:"Soft Drinks", name:"7Up", size:"1.5Ltr", price:42000 },
  { id:"M072", category:"Soft Drinks", name:"Mountain Dew", size:"1.5Ltr", price:42000 },
  { id:"M073", category:"Soft Drinks", name:"String", size:"1.5Ltr", price:42000 },

  // WATER
  { id:"M074", category:"Water", name:"Water Bottle", size:"500ml", price:8000 },
  { id:"M075", category:"Water", name:"Water Bottle", size:"1Ltr", price:12000 },
  { id:"M076", category:"Water", name:"Water Bottle", size:"1.5Ltr", price:15000 }
];

  
// ============================================
// 2. CATEGORY CODES
// ============================================

const categoryNames = [
  "Wada",
  "Dosa",
  "Parota",
  "Other Items",
  "Rice",
  "Special Items",
  "Sweet",
  "Tea",
  "Extra Curry",
  "Juice",
  "Soft Drinks",
  "Water"
];

const categoryCodes = new Map(
  categoryNames.map((name, index) => [name, index + 1])
);

const categoryCounters = new Map();

products.forEach(product => {
  const count =
    (categoryCounters.get(product.category) || 0) + 1;

  categoryCounters.set(product.category, count);

  product.code =
    `${categoryCodes.get(product.category)}-${count}`;
});

const productsByCode = new Map(
  products.map(product => [product.code, product])
);

const originalProducts = new Map(products.map(p => [p.id,{...p}]));
const originalCategories = [...categoryNames];
let catalogueReady = false;
let catalogueRunning = false;
let catalogueFingerprint = null;
function catalogueStatus(message) {
  let el = document.getElementById("catalogue-status");
  if (!el) { el=document.createElement("p"); el.id="catalogue-status"; $("device-status").after(el); }
  el.textContent=message;
}
function applyCatalogue(data) {
  if (!Array.isArray(data.categories) || !Array.isArray(data.products) || !data.categories.length || !data.products.length) throw Error("Empty or invalid central catalogue");
  const cats=new Map(data.categories.map(c=>[c.category_id,c.name]));
  const codes=new Map();
  for(const c of data.categories) {
    const match=/^CAT-(0[1-9]|1[0-2])$/.exec(c.category_id);
    if(match) codes.set(c.category_id,Number(match[1]));
  }
  let next=12;
  for(const c of data.categories) if(!codes.has(c.category_id)) codes.set(c.category_id,++next);
  const counters=new Map([...codes.values()].map(n=>[n,0]));
  for(const p of originalProducts.values()) { const [n,k]=p.code.split("-").map(Number); counters.set(n,Math.max(counters.get(n)||0,k)); }
  const updated=[];
  for(const r of data.products) {
    if(!cats.has(r.category_id)||!Number.isSafeInteger(r.price_cents)||r.price_cents<0||typeof r.name!=="string") throw Error("Invalid central product");
    const n=codes.get(r.category_id), old=originalProducts.get(r.product_id);
    let code;
    if(old && Number(old.code.split("-")[0])===n) code=old.code;
    else {const k=(counters.get(n)||0)+1; counters.set(n,k);code=`${n}-${k}`;}
    if(r.is_active===1) updated.push({id:r.product_id,name:r.name,category:cats.get(r.category_id),price:r.price_cents,code});
  }
  const fingerprint=JSON.stringify([data.outletId,data.categories,data.products]);
  if(fingerprint!==catalogueFingerprint) {
    products.splice(0,products.length,...updated);
    categoryNames.splice(0,categoryNames.length,...[...data.categories].sort((a,b)=>codes.get(a.category_id)-codes.get(b.category_id)).map(c=>c.name));
    categoryCodes.clear(); for(const [id,n] of codes) categoryCodes.set(cats.get(id),n);
    productsByCode.clear(); for(const p of products) productsByCode.set(p.code,p);
    if(!categoryNames.includes(activeCategory)) activeCategory="All";
    closeDropdown(); visibleProducts=[]; renderCategories(); renderProducts();
    catalogueFingerprint=fingerprint;
  }
  catalogueReady=true;
}
async function refreshCatalogue() {
  if(catalogueRunning || saving || cart.size) return;
  catalogueRunning=true;
  try {
    const device=await getSetting("device");
    if(!device?.token) {catalogueReady=false; catalogueStatus("Catalogue: register terminal first");return;}
    const key="centralCatalogue:"+device.deviceId;
    const shift=await getSetting("activeShift");
    const cached=await getSetting(key);
    if(cart.size || saving) return;
    if(!catalogueReady && cached?.deviceId===device.deviceId && (!shift?.outletId || cached.outletId===shift.outletId)) applyCatalogue(cached);
    if(!navigator.onLine) {catalogueStatus(catalogueReady?"Catalogue: offline saved copy":"Catalogue: initial online synchronization required");return;}
    const response=await fetch("/api/cashier/catalogue",{headers:{Authorization:"Bearer "+device.token},cache:"no-store",signal:AbortSignal.timeout(10000)});
    if(response.status===401||response.status===403) {catalogueReady=false; await setSetting(key,null); catalogueStatus("Catalogue: terminal authorization required");return;}
    if(!response.ok) throw Error("Catalogue request failed");
    const data=await response.json();
    if(!data.success||data.deviceId!==device.deviceId) throw Error("Invalid catalogue response");
    if(cart.size||saving) return;
    applyCatalogue(data);
    await setSetting(key,data);
    catalogueStatus("Catalogue synchronized: "+new Date().toLocaleTimeString());
  } catch(error) {console.error(error);catalogueStatus(catalogueReady?"Catalogue: using last synchronized copy":"Catalogue: synchronization required");}
  finally {catalogueRunning=false;}
}

// ============================================
// 3. FOOD PHOTOGRAPHS
// ============================================

// Illustrative online photographs.
// Some categories share a photograph.
// Images need internet access initially.

const foodPhotos = {
  "Wada":
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=360&q=75",

  "Dosa":
    "https://images.unsplash.com/photo-1630383249896-424e482df921?w=360&q=75",

  "Parota":
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=360&q=75",

  "Special Items":
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=360&q=75",

  "Rice":
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=360&q=75",

  "Chapathi":
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=360&q=75",

  "Poori":
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=360&q=75",

  "Idli":
    "https://images.unsplash.com/photo-1630383249896-424e482df921?w=360&q=75",

  "Rulan Pittu":
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=360&q=75",

  "String Hopper":
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=360&q=75",

  "Sweet":
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=360&q=75",

  "Tea":
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=360&q=75",

  "Extra Curry":
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=360&q=75",

  "Juice":
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=360&q=75",

  "Soft Drinks":
    "https://images.unsplash.com/photo-1532634896-26909d0d4b0a?w=360&q=75",

  "Water":
    "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=360&q=75"
};

const foodEmoji = {
  "Wada":"🥟",
  "Dosa":"🥞",
  "Parota":"🫓",
  "Special Items":"🍜",
  "Rice":"🍚",
  "Chapathi":"🫓",
  "Poori":"🫓",
  "Idli":"🍽️",
  "Rulan Pittu":"🍚",
  "String Hopper":"🍜",
  "Sweet":"🍬",
  "Tea":"☕",
  "Extra Curry":"🍛",
  "Juice":"🥤",
  "Soft Drinks":"🥤",
  "Water":"💧"
};

// ============================================
// 4. APPLICATION STATE
// ============================================

const $ = id => document.getElementById(id);

const money = cents => (cents / 100).toFixed(2);

const cart = new Map();

let activeCategory = "All";
let selectedIndex = 0;
let visibleProducts = [];
let dropdownOpen = false;
let lastProductId = null;
let saving = false;

const searchInput = $("product-search");
const dropdown = $("product-dropdown");

// ============================================
// 5. HELPERS
// ============================================

function productName(product) {
  return product.size
    ? `${product.name} ${product.size}`
    : product.name;
}

function productCode(product) {
  return product.code;
}

function totalCents() {
  return [...cart.values()].reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
}

function showMessage(text) {
  $("message").textContent = text;
}

function focusSearch() {
  searchInput.focus();
}

function closeDropdown() {
  dropdownOpen = false;
  dropdown.hidden = true;
  dropdown.replaceChildren();

  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
}

function clearSearch() {
  searchInput.value = "";
  selectedIndex = 0;
  visibleProducts = [];
  activeCategory = "All";

  closeDropdown();
  renderCategories();
  renderProducts();
  focusSearch();
}

// ============================================
// 6. PRODUCT SEARCH
// ============================================

function parseSearch(raw) {
  const text = raw.trim();

  const match = text.match(
    /^(\d{1,2})\s*-\s*(\d{0,2})(?:\s*[*xX]\s*(\d{1,3}))?$/
  );

  if (!match) {
    return {
      text,
      category:null,
      item:null,
      code:null,
      quantity:1
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
      if (
        categoryCodes.get(product.category) !==
        parsed.category
      ) {
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
    const matchesCategory =
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
      matchesCategory &&
      (!term || searchable.includes(term))
    );
  });
}

// ============================================
// 7. SEARCH DROPDOWN
// ============================================

function renderDropdown() {
  dropdown.replaceChildren();

  if (!dropdownOpen) {
    closeDropdown();
    return;
  }

  dropdown.hidden = false;

  searchInput.setAttribute("aria-expanded", "true");

  if (!visibleProducts.length) {
    const empty = document.createElement("div");

    empty.className = "dropdown-empty";
    empty.textContent = "No matching products found.";

    dropdown.appendChild(empty);

    searchInput.removeAttribute("aria-activedescendant");
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

    row.classList.toggle("selected", selected);

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
      block:"nearest",
      inline:"nearest"
    });
  } else {
    searchInput.removeAttribute(
      "aria-activedescendant"
    );
  }
}

function openDropdown() {
  visibleProducts = findProducts(searchInput.value);
  selectedIndex = 0;
  dropdownOpen = true;

  renderDropdown();
}

function moveDropdownSelection(direction) {
  if (!dropdownOpen) {
    openDropdown();
    return;
  }

  if (!visibleProducts.length) return;

  selectedIndex = (
    selectedIndex +
    direction +
    visibleProducts.length
  ) % visibleProducts.length;

  updateDropdownSelection();
}

function processProductEntry() {
  const raw = searchInput.value.trim();

  if (!raw) {
    showMessage("Type a product code or name.");
    return;
  }

  const parsed = parseSearch(raw);

  if (
    !Number.isSafeInteger(parsed.quantity) ||
    parsed.quantity < 1 ||
    parsed.quantity > 999
  ) {
    showMessage("Quantity must be between 1 and 999.");
    return;
  }

  if (!dropdownOpen) {
    openDropdown();
  }

  let product = visibleProducts[selectedIndex];

  if (parsed.code !== null) {
    product = productsByCode.get(parsed.code);
  }

  if (!product) {
    showMessage("No matching product found.");
    return;
  }

  if (addProduct(product, parsed.quantity)) {
    clearSearch();
  }
}

// ============================================
// 8. CATEGORY BUTTONS
// ============================================

function renderCategories() {
  const container = $("categories");

  container.replaceChildren();

  ["All", ...categoryNames].forEach(category => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "category";

    if (activeCategory === category) {
      button.classList.add("active");
    }

    button.textContent =
      category === "All"
        ? "All"
        : `${categoryCodes.get(category)} - ${category}`;

    button.addEventListener("click", () => {
      activeCategory = category;
      searchInput.value = "";

      closeDropdown();
      renderCategories();
      renderProducts();
    });

    container.appendChild(button);
  });
}

// ============================================
// 9. PRODUCT PHOTO CARDS
// ============================================

function renderProducts() {
  const container = $("products");

  if (!container) return;

  container.replaceChildren();

  const filtered = products.filter(product =>
    activeCategory === "All" ||
    product.category === activeCategory
  );

  filtered.forEach(product => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "product";

    const photo = document.createElement("img");

    photo.src = foodPhotos[product.category];
    photo.alt = productName(product);
    photo.loading = "lazy";
    photo.decoding = "async";

    photo.onerror = () => {
      photo.onerror = null;
      photo.remove();

      const fallback = document.createElement("div");

      fallback.textContent =
        foodEmoji[product.category] || "🍽️";

      fallback.style.cssText = [
        "height:115px",
        "display:grid",
        "place-items:center",
        "font-size:46px",
        "background:#fff7ed",
        "border-radius:8px",
        "margin-bottom:10px"
      ].join(";");

      card.prepend(fallback);
    };

    const name = document.createElement("span");

    name.className = "product-name";
    name.textContent = productName(product);

    const code = document.createElement("small");

    code.textContent = product.code;

    code.style.cssText = [
      "display:block",
      "color:#64748b",
      "margin:6px 0"
    ].join(";");

    const price = document.createElement("span");

    price.className = "product-price";
    price.textContent = `Rs. ${money(product.price)}`;

    card.append(photo, name, code, price);

    card.addEventListener("click", () => {
      if (addProduct(product, 1)) {
        clearSearch();
      }
    });

    container.appendChild(card);
  });
}

// ============================================
// 10. ADD PRODUCT TO CART
// ============================================

function addProduct(product, quantity = 1) {
  if (saving || !product) return false;
  if (!catalogueReady) { showMessage("Synchronize the central catalogue before billing."); return false; }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 999
  ) {
    showMessage("Invalid quantity.");
    return false;
  }

  const existing = cart.get(product.id);

  const newQuantity =
    (existing?.qty || 0) + quantity;

  if (newQuantity > 999) {
    showMessage("Maximum quantity is 999.");
    return false;
  }

  cart.set(product.id, {
    ...product,
    qty:newQuantity
  });

  lastProductId = product.id;

  renderCart();

  showMessage(
    `Added ${productName(product)} x${quantity}`
  );

  return true;
}

// ============================================
// 11. CART MANAGEMENT
// ============================================

function changeQuantity(id, change) {
  if (saving) return;

  const item = cart.get(id);

  if (!item) return;

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
      qty:next
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

    label.textContent = `${productName(item)} — Rs. ${money(item.price * item.qty)}`;
    const qty = document.createElement("input");
    qty.type = "text";
    qty.inputMode = "numeric";
    qty.className = "cart-qty";
    qty.value = String(item.qty);
    qty.dataset.productId = item.id;
    qty.setAttribute("aria-label", `Quantity for ${productName(item)}`);
    qty.addEventListener("focus", () => { lastProductId = item.id; qty.select(); });
    function commitQuantity() {
      const value = Number(qty.value);
      if (saving || !/^\d+$/.test(qty.value) || !Number.isSafeInteger(value) || value < 1 || value > 999) {
        qty.value = String(cart.get(item.id)?.qty || item.qty);
        showMessage("Quantity must be between 1 and 999.");
        return;
      }
      const current = cart.get(item.id);
      if (!current) return;
      cart.set(item.id, {...current, qty:value});
      label.textContent = `${productName(current)} — Rs. ${money(current.price * value)}`;
      $("total").textContent = money(totalCents());
      updateChange();
    }
    qty.addEventListener("change", commitQuantity);
    qty.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault(); event.stopPropagation();
        if (event.key === "Escape") qty.value = String(cart.get(item.id).qty);
        else commitQuantity();
        focusSearch();
      }
    });
    function control(text, title, action) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "secondary";
      button.textContent = text; button.setAttribute("aria-label", title);
      button.addEventListener("click", action); return button;
    }
    const minus = control("−", "Decrease quantity", () => changeQuantity(item.id, -1));
    const plus = control("+", "Increase quantity", () => changeQuantity(item.id, 1));
    const remove = control("×", "Remove item", () => {
      if (saving) return;
      cart.delete(item.id);
      if (lastProductId === item.id) lastProductId = [...cart.keys()].at(-1) || null;
      renderCart();
    });
    row.append(label, minus, qty, plus, remove);
    container.appendChild(row);
  });

  $("total").textContent = money(totalCents());

  updateChange();
}

// ============================================
// 12. CASH AND CHANGE
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
// 13. CHECKOUT - OFFLINE FIRST
// ============================================

async function checkout() {
  if (saving) return;
  if (!catalogueReady) { showMessage("Synchronize the central catalogue before billing."); return; }

  if (!cart.size) {
    showMessage("Add at least one product.");
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
    showMessage("Enter sufficient cash received.");
    $("cash").focus();
    return;
  }

  // Fail closed: a cashier cannot create an unattributed sale.
  // Offline sales use the previously verified shift stored on this PC.
  saving = true;
  $("checkout").disabled = true;
  let activeShift, registeredDevice;
  try {
    activeShift = await getSetting("activeShift");
    registeredDevice = await getSetting("device");
  } catch (error) {
    saving = false;
    $("checkout").disabled = false;
    showMessage("Unable to verify shift: " + error.message);
    return;
  }
  if (!activeShift?.shiftId || !registeredDevice?.deviceId ||
      activeShift.deviceId !== registeredDevice.deviceId) {
    saving = false;
    $("checkout").disabled = false;
    showMessage("Open a cashier shift on this registered terminal before billing.");
    return;
  }

  if (!await window.posBillingAuthorized?.(activeShift, registeredDevice)) {
    saving = false; $("checkout").disabled = false;
    showMessage("Cashier authorization unavailable. Refresh shift status or reconnect."); return;
  }

  const sale = {
    id:crypto.randomUUID(),
    createdAt:new Date().toISOString(),
    currency:"LKR",
    shiftId:activeShift.shiftId,
    cashierId:activeShift.cashierId,

    items:[...cart.values()].map(item => ({
      ...item
    })),

    totalCents:total,
    receivedCents:received,
    changeCents:received - total,
    paymentMethod:"cash"
  };

  let saved = false;

  try {
    // Uses the existing db.js.
    await saveSale(sale);

    saved = true;

    cart.clear();
    lastProductId = null;
    $("cash").value = "";

    renderCart();

    showMessage(
      `Sale ${sale.id.slice(0, 8)} saved locally. ` +
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
      if (typeof window.printSavedPOSReceipt !== "function") {
        throw new Error("Receipt module unavailable");
      }
      await window.printSavedPOSReceipt(sale);
    } catch (error) {
      showMessage("Sale saved. Printing unavailable; reprint from Sales History. " + error.message);
    }
    try {
      await refreshPending();
    } catch (error) {
      console.error("Pending count error:", error);
    }
  }
}

// ============================================
// 14. CLOUD SYNC STATUS
// ============================================

async function refreshPending() {
  const outbox = await getAll("outbox");

  $("pending").textContent = outbox.length;
}

function updateStatus() {
  $("status").textContent = navigator.onLine
    ? "Network available - cloud sync checking"
    : "Offline - local billing";
}

// ============================================
// 15. EXPORT LOCAL BACKUP
// ============================================

async function exportBackup() {
  try {
    const sales = await getAll("sales");

    const backup = {
      exportedAt:new Date().toISOString(),
      sales
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type:"application/json" }
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

    showMessage("Local sales backup exported.");
  } catch (error) {
    showMessage(
      "Backup failed: " + error.message
    );
  }
}

// ============================================
// 16. SEARCH EVENTS
// ============================================

searchInput.addEventListener("input", () => {
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
// 17. CASH EVENTS
// ============================================

$("cash").addEventListener(
  "input",
  updateChange
);

$("cash").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    checkout();
  }
});

// ============================================
// 18. GLOBAL KEYBOARD SHORTCUTS
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

  if (document.querySelector("dialog[open]")) return;

  if (event.code === "ShiftRight" || key === "F2") {
    event.preventDefault();
    focusSearch();
    return;
  }

  if (key === "F4") {
    event.preventDefault();

    closeDropdown();

    $("cash").focus();
    $("cash").select();
    return;
  }

  if (key === "F8") {
    event.preventDefault();
    if (event.repeat || saving) return;
    if (document.activeElement !== $("cash")) {
      closeDropdown(); $("cash").focus(); $("cash").select();
    } else checkout();
    return;
  }
  if (key === "." && document.activeElement !== $("cash") &&
      (document.activeElement === searchInput ? !searchInput.value.trim() :
       !event.target.matches("input, textarea, select, [contenteditable=true]"))) {
    const field = [...document.querySelectorAll(".cart-qty")].find(el => el.dataset.productId === lastProductId);
    if (field) { event.preventDefault(); closeDropdown(); field.focus(); field.select(); }
    return;
  }

  if (key === "Escape") {
    event.preventDefault();
    clearSearch();
    return;
  }

  const target = event.target;

  const typing =
    target instanceof HTMLElement &&
    (
      target.matches("input, textarea, select") ||
      target.isContentEditable
    );

  if (typing) return;

  if (key === "+" || key === "=") {
    if (
      lastProductId &&
      cart.has(lastProductId)
    ) {
      event.preventDefault();
      changeQuantity(lastProductId, 1);
    }
    return;
  }

  if (key === "-") {
    if (
      lastProductId &&
      cart.has(lastProductId)
    ) {
      event.preventDefault();
      changeQuantity(lastProductId, -1);
    }
    return;
  }

  if (
    key.length === 1 &&
    /^[a-zA-Z0-9]$/.test(key)
  ) {
    event.preventDefault();

    searchInput.focus();
    searchInput.value += key;

    searchInput.dispatchEvent(
      new Event("input", { bubbles:true })
    );
  }
});

// ============================================
// 19. BUTTON EVENTS
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
// 20. CONNECTION EVENTS
// ============================================

window.addEventListener(
  "online",
  updateStatus
);

window.addEventListener(
  "offline",
  updateStatus
);

document.addEventListener("pointerdown", event => {
  if (
    !event.target.closest(".search-wrapper") &&
    !event.target.closest("#categories")
  ) {
    closeDropdown();
  }
});

// ============================================
// 21. INITIALIZE POS
// ============================================

renderCategories();
renderProducts();
renderCart();
updateStatus();
closeDropdown();

refreshPending().catch(error => {
  console.error("Database error:", error);

  showMessage(
    "Database error: " + error.message
  );
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .catch(console.error);
}

focusSearch();
refreshCatalogue();
setInterval(refreshCatalogue,30000);
window.addEventListener("online",refreshCatalogue);
window.addEventListener("offline",refreshCatalogue);
