/* CinnamonShofis — Aplicación sin dependencias externas.
   Nota: localStorage guarda datos solo en este navegador/dispositivo. */
(() => {
  'use strict';

  const STORAGE_KEY = 'cinnamonshofis-data-v1';
  const MAX_MONEY_CENTS = 999_999_900;
  const CATEGORIES = ['Roles de canela', 'Postres', 'Bebidas', 'Otros'];
  const EMOJIS = ['🍥', '🥐', '🧁', '🍰', '🍪', '🍫', '☕', '🥤', '🍮', '🎂'];
  const PAGE_META = {
    dashboard: ['MI REPOSTERÍA / INICIO', '¡Hola, CinnamonShofis! <span class="heading-sparkle">✷</span>'],
    orders: ['VENTAS / NUEVO PEDIDO', 'Vamos por otro pedido <span class="heading-sparkle">✷</span>'],
    inventory: ['CATÁLOGO / INVENTARIO', 'Tus existencias <span class="heading-sparkle">✷</span>'],
    menu: ['CATÁLOGO / MENÚ', 'Un menú muy dulce <span class="heading-sparkle">✷</span>'],
    history: ['VENTAS / HISTORIAL', 'Registro de ventas <span class="heading-sparkle">✷</span>']
  };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const money = (cents) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
  const localDay = (dateValue = new Date()) => {
    const d = new Date(dateValue);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dateLabel = (dateValue) => new Date(dateValue).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const newId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const isNonNegativeInt = (n, limit = 9_999_999) => Number.isInteger(n) && n >= 0 && n <= limit;
  const validMoney = (n) => isNonNegativeInt(n, MAX_MONEY_CENTS);
  const parseCents = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > MAX_MONEY_CENTS / 100) return null;
    return Math.round(n * 100);
  };
  const parseWhole = (value) => {
    if (value === '') return null;
    const n = Number(value);
    return isNonNegativeInt(n) ? n : null;
  };
  const byName = (a, b) => a.name.localeCompare(b.name, 'es');
  const stockState = (product) => product.stock === 0 ? 'out' : product.stock <= product.minimum ? 'low' : 'ok';
  const stockText = (product) => product.stock === 0 ? 'Agotado' : product.stock <= product.minimum ? 'Stock bajo' : 'Disponible';
  const emptyState = (icon, title, message) => `<div class="empty-state"><span class="empty-icon" aria-hidden="true">${icon}</span><strong>${esc(title)}</strong>${esc(message)}</div>`;

  function demoData() {
    return {
      version: 1,
      nextOrderNumber: 1,
      products: [
        { id: 'demo-classic', name: 'Rol clásico glaseado', category: 'Roles de canela', emoji: '🍥', priceCents: 4500, costCents: 1800, stock: 18, minimum: 5, inMenu: true },
        { id: 'demo-choco', name: 'Rol de chocolate', category: 'Roles de canela', emoji: '🍫', priceCents: 5500, costCents: 2300, stock: 12, minimum: 4, inMenu: true },
        { id: 'demo-nuez', name: 'Rol de canela con nuez', category: 'Roles de canela', emoji: '🥐', priceCents: 6000, costCents: 2600, stock: 6, minimum: 4, inMenu: true },
        { id: 'demo-fresa', name: 'Rol de fresa', category: 'Roles de canela', emoji: '🍰', priceCents: 5500, costCents: 2200, stock: 3, minimum: 5, inMenu: true },
        { id: 'demo-galletas', name: 'Galleta de canela', category: 'Postres', emoji: '🍪', priceCents: 2200, costCents: 900, stock: 20, minimum: 5, inMenu: true }
      ],
      orders: []
    };
  }

  // Comprobación del respaldo antes de incorporarlo a la aplicación.
  function isValidProduct(p) {
    return p && typeof p.id === 'string' && p.id.length > 0 && p.id.length <= 100
      && typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 70
      && CATEGORIES.includes(p.category) && EMOJIS.includes(p.emoji)
      && validMoney(p.priceCents) && validMoney(p.costCents)
      && isNonNegativeInt(p.stock) && isNonNegativeInt(p.minimum) && typeof p.inMenu === 'boolean';
  }
  function isValidOrder(o) {
    return o && typeof o.id === 'string' && o.id.length <= 100 && o.id.length > 0
      && typeof o.createdAt === 'string' && !Number.isNaN(Date.parse(o.createdAt))
      && ['completed', 'cancelled'].includes(o.status)
      && typeof o.customer === 'string' && o.customer.length <= 80
      && typeof o.notes === 'string' && o.notes.length <= 300
      && ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'].includes(o.method)
      && validMoney(o.subtotalCents) && validMoney(o.discountCents) && validMoney(o.shippingCents) && validMoney(o.totalCents)
      && Array.isArray(o.lines) && o.lines.length > 0 && o.lines.length <= 1000
      && o.lines.every(line => line && typeof line.productId === 'string' && line.productId.length <= 100
        && typeof line.name === 'string' && line.name.length <= 70 && EMOJIS.includes(line.emoji)
        && validMoney(line.unitPriceCents) && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 9_999_999)
      && o.lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0) === o.subtotalCents
      && o.discountCents <= o.subtotalCents && o.subtotalCents - o.discountCents + o.shippingCents === o.totalCents;
  }
  function validateData(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.products) || !Array.isArray(data.orders)) return false;
    if (data.products.length > 10000 || data.orders.length > 50000 || !Number.isSafeInteger(data.nextOrderNumber) || data.nextOrderNumber < 1) return false;
    if (!data.products.every(isValidProduct) || !data.orders.every(isValidOrder)) return false;
    const productIds = data.products.map(product => product.id);
    const orderIds = data.orders.map(order => order.id);
    return new Set(productIds).size === productIds.length && new Set(orderIds).size === orderIds.length;
  }
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return demoData();
      const parsed = JSON.parse(raw);
      return validateData(parsed) ? parsed : demoData();
    } catch (error) {
      console.error('No fue posible leer los datos guardados:', error);
      return demoData();
    }
  }

  let data = loadData();
  let cart = new Map();
  let editingId = null;
  let toastTimer;

  function notify(message, error = false) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3700);
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('No se pudo guardar en el navegador:', error);
      notify('No se pudo guardar. Libera espacio o descarga un respaldo.', true);
      return false;
    }
  }
  function saveAndRender() {
    if (!persist()) return false;
    normalizeCart();
    renderAll();
    return true;
  }
  function getProduct(id) { return data.products.find((p) => p.id === id); }
  function normalizeCart() {
    for (const [id, quantity] of cart) {
      const product = getProduct(id);
      if (!product || !product.inMenu || product.stock < 1) cart.delete(id);
      else if (quantity > product.stock) cart.set(id, product.stock);
    }
  }
  function showView(page) {
    if (!PAGE_META[page]) page = 'dashboard';
    $$('.page').forEach((section) => {
      const isActive = section.dataset.page === page;
      section.classList.toggle('active', isActive);
      section.hidden = !isActive;
    });
    $$('[data-nav]').forEach((button) => {
      const isActive = button.dataset.nav === page;
      button.classList.toggle('active', isActive);
      if (isActive) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $('#pageEyebrow').textContent = PAGE_META[page][0];
    $('#pageTitle').innerHTML = PAGE_META[page][1];
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function renderDashboard() {
    const todayOrders = data.orders.filter(order => order.status === 'completed' && localDay(order.createdAt) === localDay());
    const completed = [...data.orders].filter(order => order.status === 'completed').reverse();
    const low = data.products.filter(product => stockState(product) !== 'ok').sort((a, b) => a.stock - b.stock);
    $('#statSales').textContent = money(todayOrders.reduce((sum, order) => sum + order.totalCents, 0));
    $('#statOrders').textContent = String(todayOrders.length);
    $('#statStock').textContent = String(data.products.reduce((sum, product) => sum + product.stock, 0));
    $('#statLow').textContent = String(low.length);
    $('#recentOrders').innerHTML = completed.length ? `<div class="simple-list">${completed.slice(0, 4).map(order => `
      <div class="simple-list-row"><span class="mini-icon" aria-hidden="true">🧾</span><div><div class="main-line">${esc(order.id)}</div><div class="sub-line">${esc(order.customer || 'Cliente general')} · ${esc(dateLabel(order.createdAt))}</div></div><div class="list-right"><strong>${money(order.totalCents)}</strong><div><span class="badge-soft ok">Completado</span></div></div></div>`).join('')}</div>` : emptyState('🧾', 'Todavía no hay ventas', 'Tu primer pedido aparecerá aquí.');
    $('#lowStockItems').innerHTML = low.length ? `<div class="simple-list">${low.slice(0, 4).map(product => `
      <div class="simple-list-row"><span class="mini-icon" aria-hidden="true">${product.emoji}</span><div><div class="main-line">${esc(product.name)}</div><div class="sub-line">Quedan ${product.stock} unidades · Mínimo ${product.minimum}</div></div><div class="list-right"><span class="badge-soft ${stockState(product)}">${stockText(product)}</span></div></div>`).join('')}</div>` : emptyState('✨', '¡Todo en orden!', 'Tienes existencias suficientes.');
  }

  function filteredOrderProducts() {
    const query = $('#orderSearch').value.trim().toLocaleLowerCase('es');
    return data.products.filter(p => p.inMenu && p.name.toLocaleLowerCase('es').includes(query)).sort(byName);
  }
  function renderPicker() {
    const products = filteredOrderProducts();
    $('#availableProductsCount').textContent = `${data.products.filter(product => product.inMenu && product.stock > 0).length} productos disponibles`;
    $('#productPicker').innerHTML = products.length ? products.map(product => `
      <button type="button" class="picker-card" data-add-cart="${esc(product.id)}" ${product.stock === 0 ? 'disabled' : ''} aria-label="Agregar ${esc(product.name)} al pedido">
        <span class="product-art" aria-hidden="true">${product.emoji}</span><span class="picker-info"><strong>${esc(product.name)}</strong><small>${product.stock ? `${product.stock} disponibles` : 'Agotado'}</small><b>${money(product.priceCents)}</b></span><span class="add-indicator" aria-hidden="true">+</span>
      </button>`).join('') : emptyState('🍥', 'No hay productos que mostrar', 'Agrega uno al menú o cambia la búsqueda.');
  }
  function cartSubtotal() {
    let subtotal = 0;
    for (const [id, quantity] of cart) {
      const p = getProduct(id);
      if (p) subtotal += p.priceCents * quantity;
    }
    return subtotal;
  }
  function totals() {
    const subtotalCents = cartSubtotal();
    const discountCents = parseCents($('#discountInput').value);
    const shippingCents = parseCents($('#shippingInput').value);
    const totalCents = discountCents === null || shippingCents === null ? null : subtotalCents - discountCents + shippingCents;
    return { subtotalCents, discountCents, shippingCents, totalCents };
  }
  function renderCart() {
    const items = [...cart.entries()];
    const count = items.reduce((sum, [, quantity]) => sum + quantity, 0);
    $('#cartItemsBadge').textContent = String(count);
    $('#cartNavCount').textContent = String(count);
    $('#cartNavCount').hidden = count === 0;
    $('#cartItems').innerHTML = items.length ? items.map(([id, quantity]) => {
      const product = getProduct(id);
      if (!product) return '';
      return `<div class="cart-line"><div><div class="cart-line-name">${esc(product.name)}</div><div class="cart-line-meta">${money(product.priceCents)} c/u</div><div class="qty-controls"><button class="qty-button" type="button" data-cart-less="${esc(id)}" aria-label="Quitar una unidad de ${esc(product.name)}">−</button><span class="qty-number">${quantity}</span><button class="qty-button" type="button" data-cart-more="${esc(id)}" aria-label="Agregar una unidad de ${esc(product.name)}" ${quantity >= product.stock ? 'disabled' : ''}>+</button></div></div><div class="cart-line-right"><div class="cart-line-price">${money(quantity * product.priceCents)}</div><button class="text-link" style="margin-top:12px" type="button" data-cart-remove="${esc(id)}">Quitar</button></div></div>`;
    }).join('') : emptyState('🛍️', 'Tu pedido está vacío', 'Selecciona un rol para comenzar.');
    renderTotals();
  }
  function renderTotals() {
    const value = totals();
    $('#subtotalValue').textContent = money(value.subtotalCents);
    $('#discountValue').textContent = `-${value.discountCents === null ? '—' : money(value.discountCents)}`;
    $('#shippingValue').textContent = value.shippingCents === null ? '—' : money(value.shippingCents);
    $('#totalValue').textContent = value.totalCents === null || value.totalCents < 0 ? '—' : money(value.totalCents);
    const isCash = $('#paymentMethod').value === 'Efectivo';
    $('#cashReceivedField').hidden = !isCash;
    const received = parseCents($('#cashReceived').value);
    $('#changeRow').hidden = !isCash || received === null || value.totalCents === null || value.totalCents < 0;
    if (!$('#changeRow').hidden) {
      const remaining = received - value.totalCents;
      $('#changeLabel').textContent = remaining >= 0 ? 'Cambio a entregar' : 'Falta por pagar';
      $('#changeValue').textContent = money(Math.abs(remaining));
    }
    $('#completeOrderBtn').disabled = cart.size === 0;
  }
  function changeCart(id, change) {
    const product = getProduct(id);
    if (!product || !product.inMenu) return;
    const current = cart.get(id) || 0;
    const next = current + change;
    if (next > product.stock) { notify(`Solo quedan ${product.stock} unidades de ${product.name}.`, true); return; }
    if (next <= 0) cart.delete(id);
    else cart.set(id, next);
    renderCart();
  }
  function clearOrderForm() {
    cart.clear();
    $('#customerName').value = '';
    $('#discountInput').value = '0';
    $('#shippingInput').value = '0';
    $('#paymentMethod').value = 'Efectivo';
    $('#cashReceived').value = '';
    $('#orderNotes').value = '';
  }
  function completeOrder() {
    normalizeCart();
    if (!cart.size) { notify('Agrega al menos un producto al pedido.', true); renderCart(); return; }
    const { subtotalCents, discountCents, shippingCents, totalCents } = totals();
    if (discountCents === null || shippingCents === null) { notify('El descuento y el envío deben ser cantidades válidas.', true); return; }
    if (discountCents > subtotalCents) { notify('El descuento no puede ser mayor que el subtotal.', true); return; }
    if (!validMoney(subtotalCents) || !validMoney(totalCents)) {
      notify('El importe del pedido supera el límite permitido.', true); return;
    }
    const receivedValue = $('#cashReceived').value;
    if ($('#paymentMethod').value === 'Efectivo' && receivedValue !== '') {
      const received = parseCents(receivedValue);
      if (received === null || received < totalCents) { notify('El efectivo recibido debe cubrir el total.', true); return; }
    }
    const lines = [];
    for (const [id, quantity] of cart) {
      const product = getProduct(id);
      if (!product || product.stock < quantity || !product.inMenu) { notify('Revisa las existencias antes de guardar.', true); renderAll(); return; }
      lines.push({ productId: id, name: product.name, emoji: product.emoji, unitPriceCents: product.priceCents, quantity });
    }
    const previousData = JSON.stringify(data);
    for (const line of lines) getProduct(line.productId).stock -= line.quantity;
    const order = {
      id: `CS-${String(data.nextOrderNumber).padStart(4, '0')}`,
      createdAt: new Date().toISOString(), status: 'completed',
      customer: $('#customerName').value.trim(), notes: $('#orderNotes').value.trim(),
      method: $('#paymentMethod').value, lines, subtotalCents, discountCents, shippingCents, totalCents
    };
    data.orders.push(order);
    data.nextOrderNumber += 1;
    if (!persist()) { data = JSON.parse(previousData); return; }
    clearOrderForm();
    renderAll();
    showView('history');
    notify(`¡Pedido ${order.id} registrado! Inventario actualizado.`);
  }

  function filterInventory() {
    const query = $('#inventorySearch').value.trim().toLocaleLowerCase('es');
    const filter = $('#inventoryFilter').value;
    return data.products.filter(product => {
      if (!product.name.toLocaleLowerCase('es').includes(query)) return false;
      if (filter === 'low') return stockState(product) !== 'ok';
      if (filter === 'out') return product.stock === 0;
      if (filter === 'inMenu') return product.inMenu;
      if (filter === 'hidden') return !product.inMenu;
      return true;
    }).sort(byName);
  }
  function renderInventory() {
    const products = filterInventory();
    $('#inventorySummary').textContent = `${products.length} de ${data.products.length} productos · Los valores del inventario se guardan en este navegador.`;
    $('#inventoryTableBody').innerHTML = products.length ? products.map(p => `<tr>
      <td><div class="product-cell"><span class="mini-icon" aria-hidden="true">${p.emoji}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.category)}</small></div></div></td>
      <td><strong>${money(p.priceCents)}</strong></td><td><span class="stock-count">${p.stock}</span> <small>/ mín. ${p.minimum}</small></td>
      <td><span class="badge-soft ${stockState(p)}">${stockText(p)}</span></td>
      <td><input class="menu-switch" type="checkbox" data-toggle-menu="${esc(p.id)}" ${p.inMenu ? 'checked' : ''} aria-label="Mostrar ${esc(p.name)} en el menú" /></td>
      <td class="row-actions"><button class="small-button" data-edit="${esc(p.id)}" type="button">Editar</button> <button class="small-button danger" data-delete="${esc(p.id)}" type="button">Eliminar</button></td>
    </tr>`).join('') : `<tr><td colspan="6">${emptyState('📦', 'Sin coincidencias', 'Prueba con otro filtro o agrega un producto.')}</td></tr>`;
    $('#inventoryMobile').innerHTML = products.length ? products.map(p => `<div class="inventory-card"><span class="mini-icon" aria-hidden="true">${p.emoji}</span><div class="inventory-card-body"><div class="inventory-card-head"><div><strong>${esc(p.name)}</strong><small>${esc(p.category)}</small></div><span class="inventory-card-price">${money(p.priceCents)}</span></div><div class="inventory-card-line"><span class="badge-soft ${stockState(p)}">${stockText(p)}</span><small>${p.stock} unidades · Mín. ${p.minimum}</small></div><div class="inventory-card-actions"><label><input class="menu-switch" type="checkbox" data-toggle-menu="${esc(p.id)}" ${p.inMenu ? 'checked' : ''} aria-label="Mostrar ${esc(p.name)} en el menú" /> En menú</label><div><button class="small-button" data-edit="${esc(p.id)}" type="button">Editar</button> <button class="small-button danger" data-delete="${esc(p.id)}" type="button">Eliminar</button></div></div></div></div>`).join('') : emptyState('📦', 'Sin coincidencias', 'Prueba con otro filtro o agrega un producto.');
  }
  function renderMenu() {
    const menu = data.products.filter(product => product.inMenu).sort(byName);
    $('#menuGrid').innerHTML = menu.length ? menu.map(p => `<article class="menu-card"><div class="menu-card-art" aria-hidden="true">${p.emoji}</div><div class="menu-card-body"><span class="menu-card-category">${esc(p.category)}</span><h3>${esc(p.name)}</h3><div class="menu-card-footer"><span class="menu-card-price">${money(p.priceCents)}</span><span class="badge-soft ${p.stock === 0 ? 'out' : 'ok'}">${p.stock === 0 ? 'Agotado' : 'Disponible'}</span></div></div></article>`).join('') : emptyState('🍰', 'Tu menú está vacío', 'Activa la opción «Mostrar en el menú» en Inventario.');
  }
  function renderHistory() {
    const orders = [...data.orders].reverse();
    const completed = orders.filter(order => order.status === 'completed');
    $('#allTimeSales').textContent = money(completed.reduce((sum, order) => sum + order.totalCents, 0));
    $('#allTimeOrders').textContent = String(completed.length);
    $('#historyCount').textContent = `${orders.length} pedidos`;
    $('#historyList').innerHTML = orders.length ? orders.map(order => `<details class="history-item ${order.status === 'cancelled' ? 'cancelled-item' : ''}"><summary><span class="mini-icon" aria-hidden="true">${order.status === 'cancelled' ? '↩' : '🧾'}</span><span><span class="history-id">${esc(order.id)}</span><span class="history-sub">${esc(order.customer || 'Cliente general')} · ${esc(dateLabel(order.createdAt))}</span></span><span class="history-price"><strong>${money(order.totalCents)}</strong><small>${order.status === 'cancelled' ? 'Cancelado' : esc(order.method)}</small></span><span class="chevron" aria-hidden="true">›</span></summary><div class="history-content"><table><tbody>${order.lines.map(line => `<tr><td>${esc(line.name)} <span class="muted-small">× ${line.quantity}</span></td><td>${money(line.unitPriceCents * line.quantity)}</td></tr>`).join('')}<tr><td>Subtotal</td><td>${money(order.subtotalCents)}</td></tr><tr><td>Descuento / Envío</td><td>−${money(order.discountCents)} / +${money(order.shippingCents)}</td></tr><tr><td><strong>Total</strong></td><td><strong>${money(order.totalCents)}</strong></td></tr></tbody></table>${order.notes ? `<p class="history-notes"><strong>Notas:</strong> ${esc(order.notes)}</p>` : ''}${order.status === 'completed' ? `<div class="history-actions"><button type="button" class="small-button danger" data-cancel-order="${esc(order.id)}">Cancelar y devolver al inventario</button></div>` : '<p class="history-notes">Este pedido fue cancelado y no suma a las ventas.</p>'}</div></details>`).join('') : emptyState('🧾', 'Todavía no hay pedidos', 'Confirma tu primera venta para verla aquí.');
  }
  function renderAll() { renderDashboard(); renderPicker(); renderCart(); renderInventory(); renderMenu(); renderHistory(); }

  function openProductDialog(id = null) {
    editingId = id;
    const product = id ? getProduct(id) : null;
    $('#productForm').reset();
    $('#productError').hidden = true;
    $('#productDialogTitle').textContent = product ? 'Editar producto' : 'Nuevo producto';
    $('#saveProductBtn').textContent = product ? 'Guardar cambios' : 'Agregar producto';
    $('#productName').value = product ? product.name : '';
    $('#productCategory').value = product ? product.category : 'Roles de canela';
    $('#productPrice').value = product ? String(product.priceCents / 100) : '';
    $('#productCost').value = product ? String(product.costCents / 100) : '';
    $('#productStock').value = product ? String(product.stock) : '0';
    $('#productMinimum').value = product ? String(product.minimum) : '5';
    $('#productEmoji').value = product ? product.emoji : '🍥';
    $('#productInMenu').checked = product ? product.inMenu : true;
    $('#productDialog').showModal();
    $('#productName').focus();
  }
  function closeProductDialog() { $('#productDialog').close(); }
  function productError(text) { $('#productError').textContent = text; $('#productError').hidden = false; }
  function saveProduct(event) {
    event.preventDefault();
    const name = $('#productName').value.trim();
    const category = $('#productCategory').value;
    const priceCents = parseCents($('#productPrice').value);
    const costCents = $('#productCost').value === '' ? 0 : parseCents($('#productCost').value);
    const stock = parseWhole($('#productStock').value);
    const minimum = parseWhole($('#productMinimum').value);
    const emoji = $('#productEmoji').value;
    if (!name || name.length > 70) return productError('Escribe un nombre válido (máximo 70 caracteres).');
    if (!CATEGORIES.includes(category) || !EMOJIS.includes(emoji)) return productError('Selecciona una categoría y un ícono válidos.');
    if (priceCents === null || costCents === null) return productError('El precio y el costo deben ser cantidades válidas, mayores o iguales a cero.');
    if (stock === null || minimum === null) return productError('Las existencias y el mínimo deben ser números enteros positivos o cero.');
    const product = { id: editingId || newId(), name, category, emoji, priceCents, costCents, stock, minimum, inMenu: $('#productInMenu').checked };
    const previousData = JSON.stringify(data);
    if (editingId) {
      const idx = data.products.findIndex(p => p.id === editingId);
      if (idx < 0) return productError('El producto ya no existe.');
      data.products[idx] = product;
    } else data.products.push(product);
    if (!saveAndRender()) { data = JSON.parse(previousData); renderAll(); return; }
    closeProductDialog();
    notify(editingId ? 'Producto actualizado.' : '¡Producto agregado al inventario y catálogo!');
  }
  function toggleMenu(id, checked) {
    const product = getProduct(id);
    if (!product) return;
    const old = product.inMenu;
    product.inMenu = checked;
    if (!saveAndRender()) { product.inMenu = old; renderAll(); return; }
    notify(checked ? 'Producto visible en el menú.' : 'Producto oculto del menú.');
  }
  function deleteProduct(id) {
    const product = getProduct(id);
    if (!product) return;
    const inOpenOrder = data.orders.some(order => order.status === 'completed' && order.lines.some(line => line.productId === id));
    if (inOpenOrder) { notify('Este producto tiene ventas que podrían cancelarse. Puedes ocultarlo del menú.', true); return; }
    if (!window.confirm(`¿Eliminar definitivamente «${product.name}» del inventario? Esta acción no se puede deshacer.`)) return;
    const previousData = JSON.stringify(data);
    data.products = data.products.filter(p => p.id !== id);
    if (!saveAndRender()) { data = JSON.parse(previousData); renderAll(); return; }
    notify('Producto eliminado del inventario.');
  }
  function cancelOrder(id) {
    const order = data.orders.find(o => o.id === id);
    if (!order || order.status !== 'completed') return;
    if (!window.confirm(`¿Cancelar ${order.id}? Se devolverán sus unidades al inventario y se restará de las ventas.`)) return;
    const previousData = JSON.stringify(data);
    for (const line of order.lines) {
      const product = getProduct(line.productId);
      if (!product) { notify('No es posible reponer un producto que ya no existe.', true); return; }
      if (product.stock + line.quantity > 9_999_999) { notify('La reposición superaría el stock permitido.', true); return; }
    }
    for (const line of order.lines) getProduct(line.productId).stock += line.quantity;
    order.status = 'cancelled';
    if (!saveAndRender()) { data = JSON.parse(previousData); renderAll(); return; }
    notify(`Pedido ${id} cancelado. Existencias restauradas.`);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CinnamonShofis-respaldo-${localDay()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Respaldo descargado. Guárdalo en un lugar seguro.');
  }
  async function importBackup(file) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { notify('El respaldo supera los 15 MB.', true); return; }
    let parsed;
    try { parsed = JSON.parse(await file.text()); }
    catch { notify('No se pudo leer el archivo JSON.', true); return; }
    if (!validateData(parsed)) { notify('El archivo no tiene un respaldo válido de CinnamonShofis.', true); return; }
    if (!window.confirm('¿Restaurar este respaldo? Sustituirá TODOS los productos y pedidos de este navegador. Descarga primero un respaldo de tus datos actuales.')) return;
    const previousData = data;
    data = { version: 1, nextOrderNumber: parsed.nextOrderNumber, products: parsed.products, orders: parsed.orders };
    if (!persist()) { data = previousData; return; }
    clearOrderForm();
    renderAll();
    showView('dashboard');
    notify('Respaldo importado correctamente.');
  }

  // Eventos mediante delegación: funcionan para elementos que se vuelven a dibujar.
  document.addEventListener('click', (event) => {
    const navigation = event.target.closest('[data-nav]');
    const go = event.target.closest('[data-go]');
    const addProduct = event.target.closest('[data-action="add-product"]');
    const addCart = event.target.closest('[data-add-cart]');
    const less = event.target.closest('[data-cart-less]');
    const more = event.target.closest('[data-cart-more]');
    const remove = event.target.closest('[data-cart-remove]');
    const edit = event.target.closest('[data-edit]');
    const del = event.target.closest('[data-delete]');
    const cancel = event.target.closest('[data-cancel-order]');
    if (navigation) showView(navigation.dataset.nav);
    else if (go) showView(go.dataset.go);
    else if (addProduct) openProductDialog();
    else if (addCart) changeCart(addCart.dataset.addCart, 1);
    else if (less) changeCart(less.dataset.cartLess, -1);
    else if (more) changeCart(more.dataset.cartMore, 1);
    else if (remove) { cart.delete(remove.dataset.cartRemove); renderCart(); }
    else if (edit) openProductDialog(edit.dataset.edit);
    else if (del) deleteProduct(del.dataset.delete);
    else if (cancel) cancelOrder(cancel.dataset.cancelOrder);
  });
  document.addEventListener('change', (event) => {
    const toggle = event.target.closest('[data-toggle-menu]');
    if (toggle) toggleMenu(toggle.dataset.toggleMenu, toggle.checked);
  });
  $('#productForm').addEventListener('submit', saveProduct);
  $('#closeDialogBtn').addEventListener('click', closeProductDialog);
  $('#cancelDialogBtn').addEventListener('click', closeProductDialog);
  $('#productDialog').addEventListener('click', (event) => {
    if (event.target === $('#productDialog')) closeProductDialog();
  });
  $('#orderSearch').addEventListener('input', renderPicker);
  $('#inventorySearch').addEventListener('input', renderInventory);
  $('#inventoryFilter').addEventListener('change', renderInventory);
  ['#discountInput', '#shippingInput', '#cashReceived', '#paymentMethod'].forEach(selector => {
    $(selector).addEventListener('input', renderTotals);
    $(selector).addEventListener('change', renderTotals);
  });
  $('#completeOrderBtn').addEventListener('click', completeOrder);
  $('#printMenuBtn').addEventListener('click', () => window.print());
  $('#exportBtn').addEventListener('click', exportBackup);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async event => {
    await importBackup(event.target.files[0]);
    event.target.value = '';
  });

  const todayText = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  $('#todayDate').textContent = todayText.charAt(0).toUpperCase() + todayText.slice(1);
  $('#dashboardDate').textContent = $('#todayDate').textContent;
  $('#footerYear').textContent = String(new Date().getFullYear());
  persist();
  renderAll();
  showView('dashboard');
  // Disponible al publicar en GitHub Pages (HTTPS). Permite instalar y abrir
  // el panel sin conexión tras la primera visita.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(error => {
        console.warn('Modo sin conexión no disponible:', error);
      });
    });
  }
})();
