/**
 * Dream Cart BD - Smart Admin Control Suite
 * Product & Order Management Portal
 * Password: Dcbd@2026
 * Logo: https://pictures-bangladesh.jijistatic.com/2033199_MjAwLTIwMC03Nzk0Y2Y2Yzkx.jpg
 */

const DEFAULT_ADMIN_PASSCODE = 'Dcbd@2026';
const SHOP_LOGO_URL = 'https://pictures-bangladesh.jijistatic.com/2033199_MjAwLTIwMC03Nzk0Y2Y2Yzkx.jpg';

let currentAdminOrderFilter = 'all';
let currentAdminProductFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  setupAdminListeners();
});

function checkAdminAuth() {
  const isAuth = sessionStorage.getItem('dcb_admin_auth');
  const loginGate = document.getElementById('adminLoginGate');
  const dashboardContent = document.getElementById('adminDashboardContent');

  if (isAuth === 'true') {
    if (loginGate) {
      loginGate.classList.add('d-none');
      loginGate.classList.remove('d-flex');
    }
    if (dashboardContent) {
      dashboardContent.classList.remove('d-none');
      dashboardContent.style.display = 'block';
    }
    loadAdminDashboard();
  } else {
    if (loginGate) {
      loginGate.classList.remove('d-none');
      loginGate.classList.add('d-flex');
    }
    if (dashboardContent) {
      dashboardContent.classList.add('d-none');
      dashboardContent.style.display = 'none';
    }
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const inputPin = document.getElementById('adminPinInput').value.trim();
  const storedPin = localStorage.getItem('dcb_admin_pin') || DEFAULT_ADMIN_PASSCODE;

  if (inputPin === storedPin) {
    sessionStorage.setItem('dcb_admin_auth', 'true');
    checkAdminAuth();
    showAdminToast('এডমিন ড্যাশবোর্ডে স্বাগতম!', 'success');
  } else {
    document.getElementById('adminLoginError').innerText = 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড প্রদান করুন (Dcbd@2026)';
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('dcb_admin_auth');
  checkAdminAuth();
}

function loadAdminDashboard() {
  updateDashboardStats();
  renderAdminOrders();
  renderAdminProducts();
  renderAdminBrands();
}

function setupAdminListeners() {
  const searchOrderInput = document.getElementById('adminOrderSearch');
  if (searchOrderInput) {
    searchOrderInput.addEventListener('input', () => {
      renderAdminOrders();
    });
  }

  const orderFilterSelect = document.getElementById('adminOrderStatusFilter');
  if (orderFilterSelect) {
    orderFilterSelect.addEventListener('change', (e) => {
      filterOrdersByStatus(e.target.value);
    });
  }

  const searchProductInput = document.getElementById('adminProductSearch');
  if (searchProductInput) {
    searchProductInput.addEventListener('input', () => {
      renderAdminProducts();
    });
  }
}

// -------------------- STATS & ONCLICK METRIC COUNTER FILTERS --------------------

function updateDashboardStats() {
  const orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  const visitors = parseInt(localStorage.getItem('dcb_visitors_base') || '1480');

  // Orders counts
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed').length;
  const processingOrders = orders.filter(o => o.status === 'Processing').length;
  const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Products counts
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status !== 'inactive').length;
  const inactiveProducts = products.filter(p => p.status === 'inactive').length;
  const lowStockProducts = products.filter(p => (p.stock || 0) <= 10).length;

  // Update DOM Order counters
  setElText('statTotalOrders', totalOrders);
  setElText('statPendingOrders', pendingOrders);
  setElText('statConfirmedOrders', confirmedOrders);
  setElText('statProcessingOrders', processingOrders);
  setElText('statShippedOrders', shippedOrders);
  setElText('statDeliveredOrders', deliveredOrders);
  setElText('statCancelledOrders', cancelledOrders);
  setElText('statTotalRevenue', `৳${totalRevenue.toLocaleString()}`);

  // Update DOM Product counters
  setElText('statProdTotal', totalProducts);
  setElText('statProdActive', activeProducts);
  setElText('statProdInactive', inactiveProducts);
  setElText('statProdLowStock', lowStockProducts);

  setElText('statTotalVisitors', visitors.toLocaleString());
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

// Filter Orders by Clicking Status Cards
function filterOrdersByStatus(status) {
  currentAdminOrderFilter = status;
  const select = document.getElementById('adminOrderStatusFilter');
  if (select) select.value = status;

  // Switch to Orders Tab if not active
  const ordersTab = document.getElementById('orders-tab');
  if (ordersTab) {
    const tab = bootstrap.Tab.getOrCreateInstance(ordersTab);
    tab.show();
  }

  // Visual card highlight
  document.querySelectorAll('.order-stat-card').forEach(c => c.classList.remove('active-filter'));
  const targetCard = document.getElementById(`orderCard_${status}`);
  if (targetCard) targetCard.classList.add('active-filter');

  renderAdminOrders();
  showAdminToast(`অর্ডার ফিল্টার: ${getStatusNameInBengali(status)}`, 'info');
}

// Filter Products by Clicking Metric Cards (Active, Inactive, Low Stock)
function filterProductsByMetric(metric) {
  currentAdminProductFilter = metric;

  // Switch to Products Tab if not active
  const productsTab = document.getElementById('products-tab');
  if (productsTab) {
    const tab = bootstrap.Tab.getOrCreateInstance(productsTab);
    tab.show();
  }

  // Visual card highlight
  document.querySelectorAll('.product-stat-card').forEach(c => c.classList.remove('active-filter'));
  const targetCard = document.getElementById(`prodCard_${metric}`);
  if (targetCard) targetCard.classList.add('active-filter');

  renderAdminProducts();
  showAdminToast(`পণ্য ফিল্টার: ${getMetricNameInBengali(metric)}`, 'info');
}

function getMetricNameInBengali(m) {
  switch (m) {
    case 'all': return 'সব পণ্য';
    case 'active': return 'সক্রিয় পণ্য';
    case 'inactive': return 'নিষ্ক্রিয় পণ্য';
    case 'low_stock': return 'লো স্টক পণ্য (≤ ১০)';
    default: return m;
  }
}

// -------------------- ORDER MANAGEMENT --------------------

function renderAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  let orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const searchTerm = (document.getElementById('adminOrderSearch')?.value || '').toLowerCase().trim();
  const statusFilter = currentAdminOrderFilter;

  if (statusFilter !== 'all') {
    orders = orders.filter(o => o.status === statusFilter);
  }

  if (searchTerm) {
    orders = orders.filter(o => 
      o.orderId.toLowerCase().includes(searchTerm) ||
      o.customer.name.toLowerCase().includes(searchTerm) ||
      o.customer.phone.includes(searchTerm) ||
      (o.customer.address && o.customer.address.toLowerCase().includes(searchTerm)) ||
      (o.paymentDetails?.trxId && o.paymentDetails.trxId.toLowerCase().includes(searchTerm))
    );
  }

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="fa-solid fa-clipboard-list fa-2x mb-2 text-secondary"></i>
          <div>কোনো অর্ডার পাওয়া যায়নি (${statusFilter === 'all' ? 'তালিকা খালি' : getStatusNameInBengali(statusFilter)})</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map((o) => {
    return `
      <tr>
        <td>
          <strong>#${o.orderId}</strong>
          ${o.isFreeDelivery ? '<br><span class="badge bg-success-subtle text-success border small">ফ্রি ডেলিভারি</span>' : ''}
        </td>
        <td><small>${o.formattedDate || new Date(o.timestamp).toLocaleDateString('bn-BD')}</small></td>
        <td>
          <div class="fw-semibold">${o.customer.name}</div>
          <small class="text-muted"><i class="fa-solid fa-phone"></i> ${o.customer.phone}</small>
          <div class="small text-truncate" style="max-width: 170px;" title="${o.customer.address}">${o.customer.address}</div>
        </td>
        <td>
          <small class="badge bg-light text-dark border">${o.deliveryAreaLabel || o.deliveryArea}</small>
        </td>
        <td>
          <div>${getPaymentMethodName(o.paymentMethod)}</div>
          ${o.paymentDetails?.trxId ? `<small class="text-success fw-bold">TrxID: ${o.paymentDetails.trxId}</small>` : ''}
        </td>
        <td class="fw-bold fs-6 text-primary">৳${o.grandTotal}</td>
        <td>
          <select class="form-select form-select-sm" onchange="updateOrderStatus('${o.orderId}', this.value)" style="min-width: 130px;">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>অপেক্ষমান (Pending)</option>
            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>কনফার্মড (Confirmed)</option>
            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>প্রসেসিং (Processing)</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>ডেলিভারির পথে (Shipped)</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>ডেলিভার্ড (Delivered)</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>বাতিল (Cancelled)</option>
          </select>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-warning fw-bold text-dark" title="পার্সেল ভাউচার প্রিন্ট করুন" onclick="printOrderVoucher('${o.orderId}')">
              <i class="fa-solid fa-receipt me-1"></i> ভাউচার
            </button>
            <button class="btn btn-outline-primary" title="অর্ডার এডিট করুন" onclick="openEditOrderModal('${o.orderId}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-outline-info" title="অর্ডার বিস্তারিত" onclick="viewOrderDetails('${o.orderId}')">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-outline-danger" title="অর্ডার ডিলিট" onclick="deleteOrder('${o.orderId}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getStatusNameInBengali(status) {
  switch (status) {
    case 'Pending': return 'অপেক্ষমান';
    case 'Confirmed': return 'কনফার্মড';
    case 'Processing': return 'প্রসেসিং';
    case 'Shipped': return 'ডেলিভারির পথে';
    case 'Delivered': return 'ডেলিভার্ড';
    case 'Cancelled': return 'বাতিল';
    case 'all': return 'সবগুলো';
    default: return status;
  }
}

function getPaymentMethodName(m) {
  switch (m) {
    case 'cod': return 'ক্যাশ অন ডেলিভারি';
    case 'bkash': return 'বিকাশ (bKash)';
    case 'nagad': return 'নগদ (Nagad)';
    case 'rocket': return 'রকেট (Rocket)';
    case 'bank': return 'ইসলামী ব্যাংক';
    default: return m;
  }
}

function updateOrderStatus(orderId, newStatus) {
  let orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const orderIndex = orders.findIndex(o => o.orderId === orderId);

  if (orderIndex > -1) {
    orders[orderIndex].status = newStatus;
    localStorage.setItem('dcb_orders', JSON.stringify(orders));
    updateDashboardStats();
    showAdminToast(`অর্ডার #${orderId}-এর স্ট্যাটাস আপডেট হয়েছে: ${getStatusNameInBengali(newStatus)}`, 'success');
  }
}

// Edit Order Modal
function openEditOrderModal(orderId) {
  const orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;

  document.getElementById('editOrderId').value = order.orderId;
  document.getElementById('editOrderCustomerName').value = order.customer.name;
  document.getElementById('editOrderCustomerPhone').value = order.customer.phone;
  document.getElementById('editOrderCustomerAddress').value = order.customer.address;
  document.getElementById('editOrderStatus').value = order.status;
  document.getElementById('editOrderNotes').value = order.notes || '';

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('adminOrderEditModal'));
  modal.show();
}

function handleOrderEditSubmit(e) {
  e.preventDefault();
  const orderId = document.getElementById('editOrderId').value;
  const name = document.getElementById('editOrderCustomerName').value.trim();
  const phone = document.getElementById('editOrderCustomerPhone').value.trim();
  const address = document.getElementById('editOrderCustomerAddress').value.trim();
  const status = document.getElementById('editOrderStatus').value;
  const notes = document.getElementById('editOrderNotes').value.trim();

  let orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx > -1) {
    orders[idx].customer.name = name;
    orders[idx].customer.phone = phone;
    orders[idx].customer.address = address;
    orders[idx].status = status;
    orders[idx].notes = notes;

    localStorage.setItem('dcb_orders', JSON.stringify(orders));
    updateDashboardStats();
    renderAdminOrders();
    showAdminToast(`অর্ডার #${orderId} সফলভাবে আপডেট করা হয়েছে!`, 'success');

    const modalEl = document.getElementById('adminOrderEditModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
}

// Professional Parcel Delivery Voucher / Memo Print with Logo & Dual Contact
function printOrderVoucher(orderId) {
  const orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;

  const isCOD = order.paymentMethod === 'cod';
  const cashToCollect = isCOD ? order.grandTotal : 0;

  const voucherWindow = window.open('', '_blank', 'width=850,height=900');
  voucherWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>Delivery Voucher #${order.orderId} - Dream Cart BD</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; }
        .voucher-box { max-width: 780px; margin: auto; border: 2px dashed #0284c7; padding: 25px; border-radius: 12px; background: #fff; }
        .brand-header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
        .cut-line { border-top: 1.5px dashed #94a3b8; margin: 25px 0; position: relative; }
        .cut-line::after { content: '✂ কুরিয়ার পার্সেল স্লিপ ও চালান'; position: absolute; top: -11px; left: 35%; background: #fff; padding: 0 10px; font-size: 12px; color: #64748b; font-weight: 600; }
        .voucher-logo { width: 65px; height: 65px; border-radius: 12px; object-fit: cover; border: 1.5px solid #0284c7; }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
          .voucher-box { border: 1.5px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="voucher-box">
        <!-- Sender Header with Shop Logo -->
        <div class="brand-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <img src="${SHOP_LOGO_URL}" alt="Dream Cart BD Logo" class="voucher-logo">
            <div>
              <h2 class="fw-bold text-primary mb-0">Dream Cart BD</h2>
              <div class="fw-semibold text-secondary" style="font-size: 13px;">স্মার্ট অফিসের পূর্ণাঙ্গ সমাধান, আভিজাত্যে আপনার পাশে</div>
              <div class="small">চৌধুরী প্লাজা (নিচতলা, রুম ৩), পদুয়ার বাজার বিশ্বরোড, কুমিল্লা</div>
              <div class="small"><strong>হেল্পলাইন:</strong> ০১৫৮১ ৭০৩ ৮২২ (01581703822), ০১৮১ ৮২৭ ৩৮৩৮</div>
            </div>
          </div>
          <div class="text-end">
            <div class="badge bg-primary fs-6 mb-1">পার্সেল ডেলিভারি চালান</div>
            <div class="fw-bold fs-5">#${order.orderId}</div>
            <div class="small text-muted">তারিখ: ${order.formattedDate || new Date().toLocaleDateString('bn-BD')}</div>
          </div>
        </div>

        <!-- Address & Recipient Grid -->
        <div class="row g-3 mb-3">
          <div class="col-7">
            <div class="p-2 border rounded bg-light">
              <h6 class="fw-bold text-dark border-bottom pb-1 mb-2">📦 প্রাপকের তথ্য (To):</h6>
              <div class="fs-6 fw-bold">${order.customer.name}</div>
              <div class="fw-bold text-primary fs-6"><i class="fa-solid fa-phone"></i> মোবাইল: ${order.customer.phone}</div>
              <div class="small mt-1"><strong>পূর্ণ ঠিকানা:</strong> ${order.customer.address}</div>
              <div class="small mt-1"><strong>ডেলিভারি এরিয়া:</strong> ${order.deliveryAreaLabel}</div>
              ${order.notes ? `<div class="small text-danger mt-1"><strong>বিশেষ নোট:</strong> ${order.notes}</div>` : ''}
            </div>
          </div>

          <div class="col-5">
            <div class="p-2 border rounded bg-light h-100">
              <h6 class="fw-bold text-dark border-bottom pb-1 mb-2">💳 পেমেন্ট ও ক্যাশ কালেকশন:</h6>
              <div>মেথড: <strong>${getPaymentMethodName(order.paymentMethod)}</strong></div>
              ${order.paymentDetails?.trxId ? `<div>TrxID: <strong class="text-success">${order.paymentDetails.trxId}</strong></div>` : ''}
              ${order.paymentDetails?.senderNumber ? `<div>প্রেরক: <strong>${order.paymentDetails.senderNumber}</strong></div>` : ''}
              
              <div class="mt-2 pt-2 border-top">
                <div class="small text-muted">কুরিয়ার কর্তৃক গ্রাহক থেকে আদায়যোগ্য:</div>
                <div class="fs-4 fw-bold ${isCOD ? 'text-danger' : 'text-success'}">
                  ${isCOD ? `৳${cashToCollect} (COD)` : '৳০ (পেইড)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Checklist for Packing -->
        <h6 class="fw-bold mb-2">পণ্য প্যাকিং ও ডেলিভারি তালিকা:</h6>
        <table class="table table-bordered table-sm mb-3">
          <thead class="table-light">
            <tr>
              <th style="width: 40px;" class="text-center">চেক</th>
              <th>পণ্যের বিবরণ</th>
              <th>কালার / সাইজ</th>
              <th class="text-center">পরিমাণ</th>
              <th class="text-end">দর</th>
              <th class="text-end">মোট</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td class="text-center font-monospace"> [ &nbsp; ] </td>
                <td class="fw-semibold">${item.name}</td>
                <td>${item.color || '-'} / ${item.size || '-'}</td>
                <td class="text-center fw-bold">${item.qty} পিস</td>
                <td class="text-end">৳${item.price}</td>
                <td class="text-end fw-bold">৳${item.price * item.qty}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="text-end">সাবটোটাল:</td>
              <td class="text-end fw-bold">৳${order.subtotal}</td>
            </tr>
            ${order.discountAmount > 0 ? `
              <tr class="text-success">
                <td colspan="5" class="text-end">অনলাইন পেমেন্ট ৪% ছাড়:</td>
                <td class="text-end fw-bold">-৳${order.discountAmount}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="5" class="text-end">ডেলিভারি চার্জ:</td>
              <td class="text-end fw-bold">${order.isFreeDelivery ? 'ফ্রি (৳০)' : `৳${order.deliveryFee}`}</td>
            </tr>
            <tr class="table-primary fw-bold">
              <td colspan="5" class="text-end fs-6">সর্বমোট বিল:</td>
              <td class="text-end fs-6">৳${order.grandTotal}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Signatures and footer -->
        <div class="row pt-4 mt-3 text-center small">
          <div class="col-4">
            <div class="border-top pt-1">প্যাকিং প্রস্তুতকারী</div>
          </div>
          <div class="col-4">
            <div class="border-top pt-1">ডেলিভারি প্রতিনিধি / কুরিয়ার</div>
          </div>
          <div class="col-4">
            <div class="border-top pt-1">গ্রাহকের স্বাক্ষর</div>
          </div>
        </div>

        <div class="cut-line"></div>

        <div class="d-flex justify-content-between align-items-center small text-muted">
          <span>Dream Cart BD | পদুয়ার বাজার বিশ্বরোড, কুমিল্লা</span>
          <span>হেল্পলাইন: ০১৫৮১ ৭০৩ ৮২২, ০১৮১ ৮২৭ ৩৮৩৮ (01818273838)</span>
        </div>

        <div class="text-center mt-4 no-print">
          <button class="btn btn-primary px-4 py-2 fw-bold" onclick="window.print()">
            <i class="fa-solid fa-print me-1"></i> ভাউচার প্রিন্ট করুন
          </button>
        </div>
      </div>
    </body>
    </html>
  `);
  voucherWindow.document.close();
}

function viewOrderDetails(orderId) {
  const orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;

  const modalBody = document.getElementById('adminOrderDetailsBody');
  modalBody.innerHTML = `
    <div class="row g-3 mb-3">
      <div class="col-md-6">
        <h6 class="border-bottom pb-2">গ্রাহকের বিবরণ:</h6>
        <div><strong>নাম:</strong> ${order.customer.name}</div>
        <div><strong>ফোন:</strong> ${order.customer.phone}</div>
        <div><strong>ইমেইল:</strong> ${order.customer.email || 'N/A'}</div>
        <div><strong>ঠিকানা:</strong> ${order.customer.address}</div>
        <div><strong>ডেলিভারি এলাকা:</strong> ${order.deliveryAreaLabel || order.deliveryArea} (${order.isFreeDelivery ? 'ফ্রি ডেলিভারি' : `চার্জ: ৳${order.deliveryFee}`})</div>
      </div>
      <div class="col-md-6">
        <h6 class="border-bottom pb-2">পেমেন্ট বিবরণ:</h6>
        <div><strong>পেমেন্ট মেথড:</strong> ${getPaymentMethodName(order.paymentMethod)}</div>
        ${order.paymentDetails?.senderNumber ? `<div><strong>প্রেরক নম্বর:</strong> ${order.paymentDetails.senderNumber}</div>` : ''}
        ${order.paymentDetails?.trxId ? `<div><strong>ট্রানজেকশন আইডি (TrxID):</strong> <span class="badge bg-success-subtle text-success">${order.paymentDetails.trxId}</span></div>` : ''}
        <div><strong>স্ট্যাটাস:</strong> <span class="badge bg-primary">${getStatusNameInBengali(order.status)}</span></div>
        <div><strong>অর্ডারের সময়:</strong> ${order.formattedDate || order.timestamp}</div>
      </div>
    </div>

    <h6 class="border-bottom pb-2">অর্ডারকৃত আইটেম:</h6>
    <div class="table-responsive">
      <table class="table table-sm table-bordered">
        <thead class="table-light">
          <tr>
            <th>পণ্য</th>
            <th>ভেরিয়েন্ট</th>
            <th class="text-center">পরিমাণ</th>
            <th class="text-end">মূল্য</th>
            <th class="text-end">মোট</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <img src="${item.image}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 4px;">
                  <span>${item.name}</span>
                </div>
              </td>
              <td>${item.color ? `রং: ${item.color}` : ''} ${item.size ? `| সাইজ: ${item.size}` : ''}</td>
              <td class="text-center">${item.qty}</td>
              <td class="text-end">৳${item.price}</td>
              <td class="text-end fw-bold">৳${item.price * item.qty}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-end">সাবটোটাল:</td>
            <td class="text-end fw-bold">৳${order.subtotal}</td>
          </tr>
          ${order.discountAmount > 0 ? `
            <tr class="text-success">
              <td colspan="4" class="text-end">অনলাইন পেমেন্ট ৪% ছাড়:</td>
              <td class="text-end fw-bold">-৳${order.discountAmount}</td>
            </tr>
          ` : ''}
          <tr>
            <td colspan="4" class="text-end">ডেলিভারি চার্জ:</td>
            <td class="text-end fw-bold">${order.isFreeDelivery ? 'ফ্রি (৳০)' : `৳${order.deliveryFee}`}</td>
          </tr>
          <tr class="table-active">
            <td colspan="4" class="text-end fw-bold">সর্বমোট প্রদেয় বিল:</td>
            <td class="text-end fw-bold text-primary fs-6">৳${order.grandTotal}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${order.notes ? `
      <div class="alert alert-secondary py-2 mt-2">
        <strong>কাস্টমার নোট:</strong> ${order.notes}
      </div>
    ` : ''}
  `;

  document.getElementById('adminInvoicePrintBtn').onclick = () => printOrderVoucher(order.orderId);

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('adminOrderDetailsModal'));
  modal.show();
}

function deleteOrder(orderId) {
  if (!confirm(`আপনি কি নিশ্চিতভাবে অর্ডার #${orderId} মুছে ফেলতে চান?`)) return;

  let orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  orders = orders.filter(o => o.orderId !== orderId);
  localStorage.setItem('dcb_orders', JSON.stringify(orders));

  updateDashboardStats();
  renderAdminOrders();
  showAdminToast(`অর্ডার #${orderId} ডিলিট করা হয়েছে!`, 'warning');
}

function exportOrdersCSV() {
  const orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  if (orders.length === 0) {
    showAdminToast('এক্সপোর্ট করার মতো কোনো অর্ডার নেই!', 'warning');
    return;
  }

  let csv = 'Order ID,Date,Customer Name,Phone,Address,Delivery Area,Payment Method,TrxID,Items Count,Subtotal,Discount,Delivery Fee,Grand Total,Status\n';

  orders.forEach(o => {
    const row = [
      o.orderId,
      `"${o.formattedDate || o.timestamp}"`,
      `"${o.customer.name}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.address.replace(/"/g, '""')}"`,
      `"${o.deliveryAreaLabel}"`,
      `"${getPaymentMethodName(o.paymentMethod)}"`,
      `"${o.paymentDetails?.trxId || ''}"`,
      o.items.length,
      o.subtotal,
      o.discountAmount,
      o.deliveryFee,
      o.grandTotal,
      o.status
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `dream_cart_bd_orders_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showAdminToast('অর্ডার ডাটা CSV ফরম্যাটে ডাউনলোড হয়েছে!', 'success');
}

// -------------------- PRODUCT MANAGEMENT (Active/Deactive, Low Stock, CRUD) --------------------

function renderAdminProducts() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  let products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  const searchTerm = (document.getElementById('adminProductSearch')?.value || '').toLowerCase().trim();
  const metricFilter = currentAdminProductFilter;

  // Filter based on selected metric counter card
  if (metricFilter === 'active') {
    products = products.filter(p => p.status !== 'inactive');
  } else if (metricFilter === 'inactive') {
    products = products.filter(p => p.status === 'inactive');
  } else if (metricFilter === 'low_stock') {
    products = products.filter(p => (p.stock || 0) <= 10);
  }

  if (searchTerm) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      (p.category && p.category.toLowerCase().includes(searchTerm)) ||
      (p.english_name && p.english_name.toLowerCase().includes(searchTerm))
    );
  }

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">কোনো পণ্য পাওয়া যায়নি (${getMetricNameInBengali(metricFilter)})</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : '';
    const imgCount = p.images ? p.images.length : 0;
    const isActive = p.status !== 'inactive';
    const isLowStock = (p.stock || 0) <= 10;

    return `
      <tr class="${!isActive ? 'table-secondary opacity-75' : ''}">
        <td>
          <img src="${mainImg}" alt="${p.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px;">
        </td>
        <td>
          <div class="fw-bold">${p.name}</div>
          <small class="text-muted">${p.english_name || ''}</small>
          ${isLowStock ? '<span class="badge bg-danger ms-1 small">লো স্টক!</span>' : ''}
        </td>
        <td><span class="badge bg-light text-dark border">${p.category || 'অফিস'}</span></td>
        <td>
          <span class="fw-bold text-primary">৳${p.price}</span>
          ${p.original_price ? `<br><small class="text-muted text-decoration-line-through">৳${p.original_price}</small>` : ''}
        </td>
        <td>
          <span class="badge ${p.stock > 10 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} border">
            ${p.stock} পিস
          </span>
        </td>
        <td>
          <!-- Active / Deactive Toggle Button -->
          <button class="btn btn-sm ${isActive ? 'btn-success' : 'btn-outline-secondary'}" onclick="toggleProductActiveStatus(${p.id})">
            ${isActive ? '<i class="fa-solid fa-circle-check me-1"></i> সক্রিয় (Active)' : '<i class="fa-solid fa-circle-xmark me-1"></i> নিষ্ক্রিয় (Inactive)'}
          </button>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" title="সম্পাদনা করুন" onclick="openEditProductModal(${p.id})">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-outline-danger" title="মুছে ফেলুন" onclick="deleteProduct(${p.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 1-Click Active / Deactive Toggle
function toggleProductActiveStatus(productId) {
  let products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  const idx = products.findIndex(p => p.id === productId);
  if (idx > -1) {
    const current = products[idx].status !== 'inactive';
    products[idx].status = current ? 'inactive' : 'active';
    localStorage.setItem('dcb_products', JSON.stringify(products));
    updateDashboardStats();
    renderAdminProducts();
    showAdminToast(`পণ্যটি ${products[idx].status === 'active' ? 'সক্রিয়' : 'ডি-একটিভ'} করা হয়েছে!`, 'info');
  }
}

function openAddProductModal() {
  document.getElementById('productFormModalTitle').innerText = 'নতুন পণ্য যুক্ত করুন';
  document.getElementById('adminProductForm').reset();
  document.getElementById('editProductId').value = '';
  document.getElementById('prodStatus').value = 'active';
  populateBrandDropdown('');

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('adminProductFormModal'));
  modal.show();
}

function openEditProductModal(productId) {
  const products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  const product = products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('productFormModalTitle').innerText = 'পণ্য সম্পাদনা করুন';
  document.getElementById('editProductId').value = product.id;
  document.getElementById('prodName').value = product.name;
  document.getElementById('prodEnglishName').value = product.english_name || '';
  document.getElementById('prodCategory').value = product.category || 'ফাইল ও ফোল্ডার';
  document.getElementById('prodSellingPrice').value = product.price || 0;
  document.getElementById('prodOriginalPrice').value = product.original_price || '';
  document.getElementById('prodStock').value = product.stock || 50;
  document.getElementById('prodColors').value = (product.colors || []).join(', ');
  document.getElementById('prodSizes').value = (product.sizes || []).join(', ');
  document.getElementById('prodBadge').value = product.badge || '';
  document.getElementById('prodStatus').value = product.status || 'active';
  populateBrandDropdown(product.brand || '');
  document.getElementById('prodDescription').value = product.description || '';
  document.getElementById('prodImages').value = (product.images || []).join('\n');

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('adminProductFormModal'));
  modal.show();
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const idVal = document.getElementById('editProductId').value;
  const name = document.getElementById('prodName').value.trim();
  const englishName = document.getElementById('prodEnglishName').value.trim();
  const category = document.getElementById('prodCategory').value.trim();
  const brand = (document.getElementById('prodBrand')?.value || '').trim();
  const sellingPrice = parseFloat(document.getElementById('prodSellingPrice').value) || 0;
  const originalPrice = parseFloat(document.getElementById('prodOriginalPrice').value) || '';
  const stock = parseInt(document.getElementById('prodStock').value) || 0;
  const badge = document.getElementById('prodBadge').value.trim();
  const status = document.getElementById('prodStatus').value || 'active';
  const description = document.getElementById('prodDescription').value.trim();

  const colorsRaw = document.getElementById('prodColors').value;
  const colors = colorsRaw ? colorsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  const sizesRaw = document.getElementById('prodSizes').value;
  const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  const imagesRaw = document.getElementById('prodImages').value;
  let images = imagesRaw ? imagesRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=700&auto=format&fit=crop&q=80'];
  }

  let products = JSON.parse(localStorage.getItem('dcb_products') || '[]');

  if (idVal) {
    const id = parseInt(idVal);
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) {
      products[idx] = {
        ...products[idx],
        name,
        english_name: englishName,
        category,
        price: sellingPrice,
        original_price: originalPrice,
        stock,
        colors,
        sizes,
        badge,
        status,
        description,
        images
      };
      showAdminToast('পণ্যটি সফলভাবে আপডেট করা হয়েছে!', 'success');
    }
  } else {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
      id: newId,
      name,
      english_name: englishName,
      category,
      price: sellingPrice,
      original_price: originalPrice,
      stock,
      rating: 5.0,
      reviews_count: 1,
      colors,
      sizes,
      badge: badge || 'নতুন আগমন',
      status: status,
      description,
      images
    };
    products.unshift(newProduct);
    showAdminToast('নতুন পণ্য স্টোরে যুক্ত করা হয়েছে!', 'success');
  }

  localStorage.setItem('dcb_products', JSON.stringify(products));
  updateDashboardStats();
  renderAdminProducts();

  const modalEl = document.getElementById('adminProductFormModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

function deleteProduct(productId) {
  if (!confirm('আপনি কি এই পণ্যটি মুছে ফেলতে চান?')) return;

  let products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  products = products.filter(p => p.id !== productId);
  localStorage.setItem('dcb_products', JSON.stringify(products));

  updateDashboardStats();
  renderAdminProducts();
  showAdminToast('পণ্যটি মুছে ফেলা হয়েছে!', 'warning');
}

function resetDefaultProducts() {
  if (!confirm('আপনি কি নিশ্চিত যে সমস্ত পণ্য ডিফল্ট মূল পণ্যে রিসেট করবেন?')) return;
  if (typeof DEFAULT_PRODUCTS !== 'undefined') {
    localStorage.setItem('dcb_products', JSON.stringify(DEFAULT_PRODUCTS));
    updateDashboardStats();
    renderAdminProducts();
    showAdminToast('ডিফল্ট পণ্য সফলভাবে রিস্টোর হয়েছে!', 'success');
  }
}

function showAdminToast(message, type = 'primary') {
  const toastEl = document.getElementById('adminToast');
  const toastBody = document.getElementById('adminToastBody');
  if (!toastEl || !toastBody) return;

  toastBody.innerText = message;
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
}


// ==================== BRAND MANAGEMENT LOGIC ====================
let currentBrandSearch = '';

function getBrands() {
  let brands = JSON.parse(localStorage.getItem('dcb_brands') || 'null');
  if (!brands || brands.length === 0) {
    if (typeof DEFAULT_BRANDS !== 'undefined' && Array.isArray(DEFAULT_BRANDS)) {
      brands = JSON.parse(JSON.stringify(DEFAULT_BRANDS));
    } else {
      brands = [
        { id: 1, name: "Deli", bangla_name: "ডেলি", logo: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=200&auto=format&fit=crop&q=80", description: "আন্তর্জাতিক মানের অফিস ও স্টেশনারি ব্র্যান্ড" },
        { id: 2, name: "Casio", bangla_name: "ক্যাসিও", logo: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=200&auto=format&fit=crop&q=80", description: "অরিজিনাল ক্যালকুলেটর ও টেকনোলজি ব্র্যান্ড" },
        { id: 3, name: "Double A", bangla_name: "ডাবল এ", logo: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&auto=format&fit=crop&q=80", description: "প্রিমিয়াম পেপার ও ডকুমেন্ট সমাধান" },
        { id: 4, name: "Kangaro", bangla_name: "ক্যাঙ্গারু", logo: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80", description: "স্ট্যাপলার, পাঞ্চ মেশিন ও হেভি ডিউটি বাইন্ডিং টুলস" },
        { id: 5, name: "Brother", bangla_name: "ব্রাদার", logo: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=200&auto=format&fit=crop&q=80", description: "লেবেল প্রিন্টার ও অফিস টেকনোলজি" },
        { id: 6, name: "Dream Cart BD", bangla_name: "ড্রিম কার্ট সিগনেচার", logo: "https://pictures-bangladesh.jijistatic.com/2033199_MjAwLTIwMC03Nzk0Y2Y2Yzkx.jpg", description: "ড্রিম কার্ট নিজস্ব এক্সক্লুসিভ কালেকশন" }
      ];
    }
    localStorage.setItem('dcb_brands', JSON.stringify(brands));
  }
  return brands;
}

function saveBrands(brands) {
  localStorage.setItem('dcb_brands', JSON.stringify(brands));
}

function handleBrandSearch(val) {
  currentBrandSearch = (val || '').toLowerCase().trim();
  renderAdminBrands();
}

function renderAdminBrands() {
  const brands = getBrands();
  const products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  const tbody = document.getElementById('adminBrandsTableBody');
  if (!tbody) return;

  const filtered = brands.filter(b => {
    if (!currentBrandSearch) return true;
    return (b.name && b.name.toLowerCase().includes(currentBrandSearch)) ||
           (b.bangla_name && b.bangla_name.toLowerCase().includes(currentBrandSearch)) ||
           (b.description && b.description.toLowerCase().includes(currentBrandSearch));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fa-solid fa-tags fa-2x mb-2 text-secondary"></i><br>কোনো ব্র্যান্ড পাওয়া যায়নি।</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const prodCount = products.filter(p => p.brand === b.name || p.brand === b.bangla_name).length;
    const logoImg = b.logo ? `<img src="${b.logo}" alt="${b.name}" style="width: 44px; height: 44px; object-fit: contain; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0; padding: 2px;">` : `<div style="width: 44px; height: 44px; border-radius: 8px; background: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px dashed #cbd5e1;"><i class="fa-solid fa-tag text-warning"></i></div>`;

    return `
      <tr>
        <td>${logoImg}</td>
        <td><strong class="text-dark">${b.name}</strong></td>
        <td><span class="badge bg-light text-dark border">${b.bangla_name || '-'}</span></td>
        <td><small class="text-muted">${b.description || 'কোনো বিবরণ নেই'}</small></td>
        <td><span class="badge bg-warning-subtle text-dark border border-warning px-2 py-1"><i class="fa-solid fa-boxes-stacked me-1"></i>${prodCount} টি পণ্য</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary rounded-pill me-1" onclick="openEditBrandModal(${b.id})" title="সম্পাদনা">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteBrand(${b.id})" title="মুছে ফেলুন">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateBrandDropdown(selectedBrand = '') {
  const select = document.getElementById('prodBrand');
  if (!select) return;
  const brands = getBrands();
  let html = `<option value="">-- কোনো ব্র্যান্ড নেই --</option>`;
  brands.forEach(b => {
    const isSel = (selectedBrand && (selectedBrand === b.name || selectedBrand === b.bangla_name)) ? 'selected' : '';
    html += `<option value="${b.name}" ${isSel}>${b.name} (${b.bangla_name || b.name})</option>`;
  });
  select.innerHTML = html;
}

function openAddBrandModal() {
  document.getElementById('brandModalTitle').innerText = 'নতুন ব্র্যান্ড যোগ করুন';
  document.getElementById('adminBrandForm').reset();
  document.getElementById('editBrandId').value = '';
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('adminBrandModal'));
  modal.show();
}

function openEditBrandModal(id) {
  const brands = getBrands();
  const b = brands.find(item => item.id == id);
  if (!b) return;

  document.getElementById('brandModalTitle').innerText = 'ব্র্যান্ড সম্পাদনা করুন';
  document.getElementById('editBrandId').value = b.id;
  document.getElementById('brandName').value = b.name || '';
  document.getElementById('brandBanglaName').value = b.bangla_name || '';
  document.getElementById('brandLogo').value = b.logo || '';
  document.getElementById('brandDescription').value = b.description || '';

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('adminBrandModal'));
  modal.show();
}

function handleBrandFormSubmit(e) {
  e.preventDefault();
  const idVal = document.getElementById('editBrandId').value;
  const name = document.getElementById('brandName').value.trim();
  const bangla_name = document.getElementById('brandBanglaName').value.trim();
  const logo = document.getElementById('brandLogo').value.trim();
  const description = document.getElementById('brandDescription').value.trim();

  if (!name) {
    showAdminToast('ব্র্যান্ডের নাম প্রদান করুন!', 'danger');
    return;
  }

  let brands = getBrands();
  if (idVal) {
    const idx = brands.findIndex(b => b.id == idVal);
    if (idx !== -1) {
      brands[idx].name = name;
      brands[idx].bangla_name = bangla_name;
      brands[idx].logo = logo;
      brands[idx].description = description;
      showAdminToast('ব্র্যান্ড তথ্য আপডেট করা হয়েছে!', 'success');
    }
  } else {
    const newId = brands.length > 0 ? Math.max(...brands.map(b => b.id || 0)) + 1 : 1;
    brands.push({
      id: newId,
      name,
      bangla_name,
      logo,
      description
    });
    showAdminToast('নতুন ব্র্যান্ড যুক্ত হয়েছে!', 'success');
  }

  saveBrands(brands);
  renderAdminBrands();
  populateBrandDropdown();
  updateDashboardStats();

  const modal = bootstrap.Modal.getInstance(document.getElementById('adminBrandModal'));
  if (modal) modal.hide();
}

function deleteBrand(id) {
  if (!confirm('আপনি কি নিশ্চিত যে এই ব্র্যান্ডটি মুছে ফেলতে চান?')) return;
  let brands = getBrands();
  brands = brands.filter(b => b.id != id);
  saveBrands(brands);
  renderAdminBrands();
  populateBrandDropdown();
  updateDashboardStats();
  showAdminToast('ব্র্যান্ড মুছে ফেলা হয়েছে!', 'info');
}
