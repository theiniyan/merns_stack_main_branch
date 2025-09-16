// Simple frontend logic: load menu, filter categories, cart using localStorage

const menuUrl = 'data/menu.json';
let menu = [];
let cart = JSON.parse(localStorage.getItem('cart') || '{}');

const cartCountEl = document.getElementById('cartCount');
const menuGrid = document.getElementById('menuGrid');
const categoryList = document.getElementById('categoryList');
const searchInput = document.getElementById('searchInput');

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const totalItems = Object.values(cart).reduce((s, item) => s + item.qty, 0);
  cartCountEl.textContent = totalItems;
  const totalPrice = Object.values(cart).reduce((s, item) => s + item.qty * item.price, 0);
  document.getElementById('cartTotal').textContent = totalPrice.toFixed(2);
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cartItemsContainer');
  container.innerHTML = '';
  if (Object.keys(cart).length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }
  Object.values(cart).forEach(it => {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center border-bottom py-2';
    row.innerHTML = `
      <div class="flex-grow-1">
        <strong>${it.name}</strong><div>₹${it.price.toFixed(2)}</div>
      </div>
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-secondary me-2" data-id="${it.id}" data-action="dec">-</button>
        <span class="me-2">${it.qty}</span>
        <button class="btn btn-sm btn-outline-secondary me-3" data-id="${it.id}" data-action="inc">+</button>
        <button class="btn btn-sm btn-danger" data-id="${it.id}" data-action="remove">Remove</button>
      </div>
    `;
    container.appendChild(row);
  });

  // attach events
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'inc') cart[id].qty++;
      else if (action === 'dec') { cart[id].qty = Math.max(1, cart[id].qty - 1); }
      else if (action === 'remove') delete cart[id];
      saveCart();
    });
  });
}

function addToCart(item) {
  if (cart[item.id]) cart[item.id].qty++;
  else cart[item.id] = {...item, qty: 1};
  saveCart();
}

function renderMenu(items) {
  menuGrid.innerHTML = '';
  items.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-lg-4';
    col.innerHTML = `
      <div class="card product-card p-2">
        <img src="${p.image}" class="card-img-top" alt="${p.name}">
        <div class="card-body">
          <h6 class="card-title">${p.name}</h6>
          <p class="card-text small mb-1">${p.category}</p>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <strong>₹${p.price}</strong>
            <button class="btn btn-sm btn-primary addBtn" data-id="${p.id}">Add</button>
          </div>
        </div>
      </div>`;
    menuGrid.appendChild(col);
  });

  menuGrid.querySelectorAll('.addBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = menu.find(m => String(m.id) === id);
      addToCart(item);
    });
  });
}

function renderCategories() {
  const cats = Array.from(new Set(menu.map(m => m.category)));
  categoryList.innerHTML = `<button class="list-group-item list-group-item-action active" data-cat="all">All</button>`;
  cats.forEach(c => {
    const el = document.createElement('button');
    el.className = 'list-group-item list-group-item-action';
    el.setAttribute('data-cat', c);
    el.textContent = c;
    categoryList.appendChild(el);
  });
  categoryList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      categoryList.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      applyFilters(cat, searchInput.value.trim());
    });
  });
}

function applyFilters(category = 'all', search = '') {
  let filtered = menu.slice();
  if (category !== 'all') filtered = filtered.filter(m => m.category === category);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(s) || m.category.toLowerCase().includes(s));
  }
  renderMenu(filtered);
}

// load menu via fetch (AJAX)
fetch(menuUrl).then(resp => resp.json()).then(data => {
  menu = data;
  renderCategories();
  renderMenu(menu);
}).catch(err => {
  console.error('Failed to load menu', err);
  menuGrid.innerHTML = '<p class="text-danger">Failed to load menu. Check data/menu.json</p>';
});

// search hook
searchInput.addEventListener('input', () => {
  const active = categoryList.querySelector('.active');
  const cat = active ? active.getAttribute('data-cat') : 'all';
  applyFilters(cat, searchInput.value.trim());
});

// cart modal and auth modal hooks
const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
const authModal = new bootstrap.Modal(document.getElementById('authModal'));

document.getElementById('cartBtn').addEventListener('click', () => cartModal.show());
document.getElementById('loginBtn').addEventListener('click', () => authModal.show());

// simple auth form (client-side demo)
const toggleRegister = document.getElementById('toggleRegister');
toggleRegister.addEventListener('change', () => {
  document.getElementById('nameGroup').style.display = toggleRegister.checked ? 'block' : 'none';
  document.getElementById('authTitle').textContent = toggleRegister.checked ? 'Register' : 'Login';
});

document.getElementById('authForm').addEventListener('submit', e => {
  e.preventDefault();
  const isRegister = toggleRegister.checked;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const fullName = document.getElementById('fullName').value.trim();
  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (isRegister) {
    if (!fullName) return showAuthMsg('Please enter full name', 'danger');
    if (users[email]) return showAuthMsg('User already exists', 'danger');
    users[email] = {fullName, password};
    localStorage.setItem('users', JSON.stringify(users));
    showAuthMsg('Registered successfully. You can login now.', 'success');
    toggleRegister.checked = false;
    document.getElementById('nameGroup').style.display = 'none';
    document.getElementById('authTitle').textContent = 'Login';
  } else {
    if (!users[email] || users[email].password !== password) return showAuthMsg('Invalid credentials', 'danger');
    showAuthMsg('Login successful', 'success');
    authModal.hide();
  }
});

function showAuthMsg(msg, type='info') {
  const el = document.getElementById('authMsg');
  el.innerHTML = `<div class="alert alert-${type} py-1">${msg}</div>`;
  setTimeout(()=> el.innerHTML='', 3000);
}

// checkout stub
document.getElementById('checkoutBtn').addEventListener('click', () => {
  // For demo, simulate successful payment and clear cart
  if (Object.keys(cart).length === 0) { alert('Cart is empty'); return; }
  // Real integration: redirect to Stripe Checkout or open payment modal
  alert('Payment simulated. Order placed.');
  cart = {};
  saveCart();
  cartModal.hide();
});

// initialize cart ui
updateCartUI();
