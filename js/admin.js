/**
 * Dream Cart BD - Comprehensive Admin Control Suite
 * Product Management & Order Processing Portal
 */

const DEFAULT_ADMIN_PASSCODE = 'admin123';

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  setupAdminListeners();
});

function checkAdminAuth() {
  const isAuth = sessionStorage.getItem('dcb_admin_auth');
  const loginGate = document.getElementById('adminLoginGate');
  const dashboardContent = document.getElementById('adminDashboardContent');

  if (isAuth === 'true') {
    if (loginGate) loginGate.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'block';
    loadAdminDashboard();
  } else {
    if (loginGate) loginGate.style.display = 'flex';
    if (dashboardContent) dashboardContent.style.display = 'none';
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const inputPin = document.getElementById('adminPinInput').value.trim();
  const storedPin = localStorage.getItem('dcb_admin_pin') || DEFAULT_ADMIN_PASSCODE;

  if (inputPin === storedPin) {
    sessionStorage.setItem('dcb_admin_auth', 'true');
    checkAdminAuth();
    showAdminToast('এডমিন প্যানেলে স্বাগতম!', 'success');
  } else {
    document.getElementById('adminLoginError').innerText = 'ভুল পাসকোড! অনুগ্রহ করে সঠিক পাসকোড দিন (ডিফল্ট: admin123)';
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
    orderFilterSelect.addEventListener('change', () => {
      renderAdminOrders();
    });
  }

  const searchProductInput = document.getElementById('adminProductSearch');
  if (searchProductInput) {
    searchProductInput.addEventListener('input', () => {
      renderAdminProducts();
    });
  }
}

// Analytics and Metrics
function updateDashboardStats() {
  const orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  const visitors = parseInt(localStorage.getItem('dcb_visitors_base') || '1480');

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  document.getElementById('statTotalOrders').innerText = totalOrders;
  document.getElementById('statPendingOrders').innerText = pendingOrders;
  document.getElementById('statTotalRevenue').innerText = `৳${totalRevenue.toLocaleString()}`;
  document.getElementById('statTotalProducts').innerText = products.length;
  document.getElementById('statTotalVisitors').innerText = visitors.toLocaleString();
}

// Order Management Engine
function renderAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  let orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const searchTerm = (document.getElementById('adminOrderSearch')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('adminOrderStatusFilter')?.value || 'all';

  if (statusFilter !== 'all') {
    orders = orders.filter(o => o.status === statusFilter);
  }

  if (searchTerm) {
    orders = orders.filter(o => 
      o.orderId.toLowerCase().includes(searchTerm) ||
      o.customer.name.toLowerCase().includes(searchTerm) ||
      o.customer.phone.includes(searchTerm) ||
      (o.paymentDetails.trxId && o.paymentDetails.trxId.toLowerCase().includes(searchTerm))
    );
  }

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <i class="fa-solid fa-clipboard-list fa-2x mb-2 text-secondary"></i>
          <div>কোনো অর্ডার পাওয়া যায়নি</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map((o, idx) => {
    const statusBadges = {
      'Pending': 'bg-warning text-dark',
      'Confirmed': 'bg-info text-dark',
      'Processing': 'bg-primary text-white',
      'Shipped': 'bg-secondary text-white',
      'Delivered': 'bg-success text-white',
      'Cancelled': 'bg-danger text-white'
    };

    const statusBadge = `<span class="badge ${statusBadges[o.status] || 'bg-light text-dark'}">${getStatusNameInBengali(o.status)}</span>`;

    return `
      <tr>
        <td><strong>#${o.orderId}</strong></td>
        <td><small>${o.formattedDate || new Date(o.timestamp).toLocaleDateString('bn-BD')}</small></td>
        <td>
          <div class="fw-semibold">${o.customer.name}</div>
          <small class="text-muted"><i class="fa-solid fa-phone"></i> ${o.customer.phone}</small>
        </td>
        <td>
          <small>${o.deliveryAreaLabel || o.deliveryArea}</small>
        </td>
        <td>
          <div>${getPaymentMethodName(o.paymentMethod)}</div>
          ${o.paymentDetails?.trxId ? `<small class="text-success fw-bold">TrxID: ${o.paymentDetails.trxId}</small>` : ''}
        </td>
        <td class="fw-bold">৳${o.grandTotal}</td>
        <td>
          <select class="form-select form-select-sm" onchange="updateOrderStatus('${o.orderId}', this.value)" style="min-width: 120px;">
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
            <button class="btn btn-outline-info" title="অর্ডার বিস্তারিত" onclick="viewOrderDetails('${o.orderId}')">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-outline-primary" title="ইনভয়েস প্রিন্ট" onclick="printAdminInvoice('${o.orderId}')">
              <i class="fa-solid fa-print"></i>
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
    default: return status;
  }
}

function getPaymentMethodName(m) {
  switch (m) {
    case 'cod': return 'ক্যাশ অন ডেলিভারি';
    case 'bkash': return 'বিকাশ';
    case 'nagad': return 'নগদ';
    case 'rocket': return 'রকেট';
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
        <div><strong>ডেলিভারি এলাকা:</strong> ${order.deliveryAreaLabel || order.deliveryArea} (চার্জ: ৳${order.deliveryFee})</div>
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
              <td colspan="4" class="text-end">অনলাইন পেমেন্ট ৫% ছাড়:</td>
              <td class="text-end fw-bold">-৳${order.discountAmount}</td>
            </tr>
          ` : ''}
          <tr>
            <td colspan="4" class="text-end">ডেলিভারি চার্জ:</td>
            <td class="text-end fw-bold">৳${order.deliveryFee}</td>
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

  document.getElementById('adminInvoicePrintBtn').onclick = () => printAdminInvoice(order.orderId);

  const modal = new bootstrap.Modal(document.getElementById('adminOrderDetailsModal'));
  modal.show();
}

function printAdminInvoice(orderId) {
  const orders = JSON.parse(localStorage.getItem('dcb_orders') || '[]');
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;

  const invoiceWindow = window.open('', '_blank', 'width=800,height=900');
  invoiceWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${order.orderId} - Dream Cart BD</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; }
        .invoice-box { max-width: 750px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
        .header-title { font-size: 26px; font-weight: 800; color: #0284c7; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
          <div>
            <div class="header-title">Dream Cart BD</div>
            <div class="text-muted small">অফিস ইকুইপমেন্ট ও স্টেশনারি সরবরাহকারী</div>
            <div class="small">চৌধুরী প্লাজা (নিচতলা, রুম ৩), পদুয়ার বাজার বিশ্বরোড, কুমিল্লা</div>
            <div class="small">ফোন: ০১৫৮১ ৭০৩ ৮২২, ০১৮১ ৮২৭ ৩৮৩৮</div>
          </div>
          <div class="text-end">
            <h4 class="text-primary mb-1">অর্ডার ইনভয়েস</h4>
            <div><strong>আইডি:</strong> #${order.orderId}</div>
            <div class="small text-muted">তারিখ: ${order.formattedDate || new Date().toLocaleDateString('bn-BD')}</div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-6">
            <h6 class="fw-bold text-dark">গ্রাহকের ঠিকানা:</h6>
            <div><strong>${order.customer.name}</strong></div>
            <div>মোবাইল: ${order.customer.phone}</div>
            <div>${order.customer.address}</div>
            <div>এলাকা: ${order.deliveryAreaLabel}</div>
          </div>
          <div class="col-6 text-end">
            <h6 class="fw-bold text-dark">পেমেন্ট বিবরণ:</h6>
            <div>মেথড: <strong>${getPaymentMethodName(order.paymentMethod)}</strong></div>
            ${order.paymentDetails?.trxId ? `<div>TrxID: <strong>${order.paymentDetails.trxId}</strong></div>` : ''}
            <div>স্ট্যাটাস: <span class="badge bg-secondary">${getStatusNameInBengali(order.status)}</span></div>
          </div>
        </div>

        <table class="table table-bordered mb-4">
          <thead class="table-light">
            <tr>
              <th>বিবরণ</th>
              <th>কালার / সাইজ</th>
              <th class="text-center">পরিমাণ</th>
              <th class="text-end">দর</th>
              <th class="text-end">মোট</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(i => `
              <tr>
                <td>${i.name}</td>
                <td>${i.color || '-'} / ${i.size || '-'}</td>
                <td class="text-center">${i.qty}</td>
                <td class="text-end">৳${i.price}</td>
                <td class="text-end">৳${i.price * i.qty}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-end">সাবটোটাল:</td>
              <td class="text-end">৳${order.subtotal}</td>
            </tr>
            ${order.discountAmount > 0 ? `
              <tr>
                <td colspan="4" class="text-end text-success">অনলাইন ছাড় (৫%):</td>
                <td class="text-end text-success">-৳${order.discountAmount}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="4" class="text-end">ডেলিভারি চার্জ:</td>
              <td class="text-end">৳${order.deliveryFee}</td>
            </tr>
            <tr class="fw-bold table-light">
              <td colspan="4" class="text-end fs-6">মোট প্রদেয় বিল:</td>
              <td class="text-end fs-6 text-primary">৳${order.grandTotal}</td>
            </tr>
          </tfoot>
        </table>

        <div class="border-top pt-3 text-center small text-muted">
          Dream Cart BD থেকে কেনাকাটা করার জন্য ধন্যবাদ! <br>
          "you make."
        </div>

        <div class="text-center mt-4 no-print">
          <button class="btn btn-primary btn-sm px-4" onclick="window.print()">
            <i class="fa-solid fa-print"></i> প্রিন্ট করুন
          </button>
        </div>
      </div>
    </body>
    </html>
  `);
  invoiceWindow.document.close();
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

// Product Management Engine
function renderAdminProducts() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  let products = JSON.parse(localStorage.getItem('dcb_products') || '[]');
  const searchTerm = (document.getElementById('adminProductSearch')?.value || '').toLowerCase().trim();

  if (searchTerm) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      (p.category && p.category.toLowerCase().includes(searchTerm))
    );
  }

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">কোনো পণ্য পাওয়া যায়নি</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const mainImg = (p.images && p.images.length > 0) ? p.images[0] : '';
    const imgCount = p.images ? p.images.length : 0;

    return `
      <tr>
        <td>
          <img src="${mainImg}" alt="${p.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px;">
        </td>
        <td>
          <div class="fw-bold">${p.name}</div>
          <small class="text-muted">${p.english_name || ''}</small>
        </td>
        <td><span class="badge bg-light text-dark border">${p.category || 'অফিস'}</span></td>
        <td>
          <span class="fw-bold">৳${p.price}</span>
          <br><small class="text-muted">পরিসীমা: ৳${p.min_price} - ৳${p.max_price}</small>
        </td>
        <td>
          <span class="badge ${p.stock > 10 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}">
            ${p.stock} পিস
          </span>
        </td>
        <td>
          <span class="badge bg-info-subtle text-info border">
            <i class="fa-regular fa-images"></i> ${imgCount} ছবি
          </span>
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

function openAddProductModal() {
  document.getElementById('productFormModalTitle').innerText = 'নতুন পণ্য যুক্ত করুন';
  document.getElementById('adminProductForm').reset();
  document.getElementById('editProductId').value = '';
  document.getElementById('prodImagesHelp').innerText = 'প্রতি লাইনে একটি বা কমা দিয়ে ৫ থেকে ১০টি ছবি লিংক প্রদান করুন।';

  const modal = new bootstrap.Modal(document.getElementById('adminProductFormModal'));
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
  document.getElementById('prodMinPrice').value = product.min_price || 0;
  document.getElementById('prodMaxPrice').value = product.max_price || 0;
  document.getElementById('prodSellingPrice').value = product.price || 0;
  document.getElementById('prodOriginalPrice').value = product.original_price || '';
  document.getElementById('prodStock').value = product.stock || 50;
  document.getElementById('prodColors').value = (product.colors || []).join(', ');
  document.getElementById('prodSizes').value = (product.sizes || []).join(', ');
  document.getElementById('prodBadge').value = product.badge || '';
  document.getElementById('prodDescription').value = product.description || '';
  document.getElementById('prodImages').value = (product.images || []).join('\n');

  const modal = new bootstrap.Modal(document.getElementById('adminProductFormModal'));
  modal.show();
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const idVal = document.getElementById('editProductId').value;
  const name = document.getElementById('prodName').value.trim();
  const englishName = document.getElementById('prodEnglishName').value.trim();
  const category = document.getElementById('prodCategory').value.trim();
  const minPrice = parseFloat(document.getElementById('prodMinPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('prodMaxPrice').value) || 0;
  const sellingPrice = parseFloat(document.getElementById('prodSellingPrice').value) || minPrice;
  const originalPrice = parseFloat(document.getElementById('prodOriginalPrice').value) || maxPrice;
  const stock = parseInt(document.getElementById('prodStock').value) || 0;
  const badge = document.getElementById('prodBadge').value.trim();
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
    // Edit
    const id = parseInt(idVal);
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) {
      products[idx] = {
        ...products[idx],
        name,
        english_name: englishName,
        category,
        min_price: minPrice,
        max_price: maxPrice,
        price: sellingPrice,
        original_price: originalPrice,
        stock,
        colors,
        sizes,
        badge,
        description,
        images
      };
      showAdminToast('পণ্যটি সফলভাবে আপডেট করা হয়েছে!', 'success');
    }
  } else {
    // Add New
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
      id: newId,
      name,
      english_name: englishName,
      category,
      min_price: minPrice,
      max_price: maxPrice,
      price: sellingPrice,
      original_price: originalPrice,
      stock,
      rating: 5.0,
      reviews_count: 1,
      colors,
      sizes,
      badge: badge || 'নতুন আগমন',
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
  if (!confirm('আপনি কি নিশ্চিত যে সমস্ত পণ্য ডিফল্ট ২০টি মূল পণ্যে রিসেট করবেন?')) return;
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
