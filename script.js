// TokoKu - logika aplikasi kasir

// ===== Helper =====
const $ = (id) => document.getElementById(id);
const rp = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0).replace(/\s/g, "");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ===== Data & penyimpanan (localStorage) =====
const def = [{ id: 1, name: "Beras 1 kg", price: 14000 }, { id: 2, name: "Minyak Goreng 1 L", price: 18000 }, { id: 3, name: "Gula 1 kg", price: 17000 }, { id: 4, name: "Telur 1 kg", price: 28000 }, { id: 5, name: "Kopi Sachet", price: 2000 }, { id: 6, name: "Mie Instan", price: 3500 }];
function load(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}
function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
  }
}
let products = load("tk_products", def), sales = load("tk_sales", []), cart = {};
let calc = {};

// ===== Perhitungan total, diskon, PPN, kembalian =====
function calcTotals() {
  let sub = 0;
  for (const id in cart) {
    const p = products.find((x) => x.id == id);
    if (p) sub += p.price * cart[id];
  }
  const d = Math.min(100, Math.max(0, +$("disc").value || 0));
  const dv = Math.round(sub * d / 100), after = sub - dv, pv = $("ppn").checked ? Math.round(after * 0.11) : 0, tot = after + pv;
  calc = { sub, dv, pv, tot };
  $("sub").textContent = rp(sub);
  $("dv").textContent = "-" + rp(dv);
  $("pv").textContent = rp(pv);
  $("tot").textContent = rp(tot);
  const paid = +$("paid").value || 0;
  $("chg").textContent = rp(Math.max(0, paid - tot));
}

// ===== Tampilan (render) =====
function renderProds() {
  $("prods").innerHTML = products.length ? products.filter((p) => p.name.toLowerCase().includes(($("q") ? $("q").value : "").toLowerCase())).map((p) => `<button class="prod" data-id="${p.id}"><b>${esc(p.name)}</b><small>${rp(p.price)}</small></button>`).join("") : '<p class="muted">Belum ada produk. Tambahkan di tab Produk.</p>';
}
function renderCart() {
  const ids = Object.keys(cart);
  $("cart").innerHTML = ids.length ? ids.map((id) => {
    const p = products.find((x) => x.id == id);
    return `<div class="item"><span>${esc(p.name)}<br><small class="muted">${rp(p.price)}</small></span><span class="qty"><button data-m="${id}">−</button> ${cart[id]} <button data-p="${id}">+</button></span><b>${rp(p.price * cart[id])}</b></div>`;
  }).join("") : '<p class="muted">Keranjang kosong. Ketuk produk untuk menambah.</p>';
  calcTotals();
}
function renderHist() {
  $("hist").innerHTML = sales.length ? [...sales].reverse().map((s) => `<tr><td>${new Date(s.date).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</td><td>${esc(s.items.map((i) => i.name + " ×" + i.qty).join(", "))}</td><td>${rp(s.total)}</td><td>${rp(s.paid)}</td><td>${rp(s.change)}</td><td><button class="x" data-del="${s.id}" title="Hapus">✕</button></td></tr>`).join("") : '<tr><td colspan="6" class="muted">Belum ada transaksi.</td></tr>';
}
function renderReport() {
  const today = (/* @__PURE__ */ new Date()).toDateString(), sum = (a) => a.reduce((t, s) => t + s.total, 0);
  const td = sales.filter((s) => new Date(s.date).toDateString() === today);
  const all = sum(sales);
  $("stats").innerHTML = [["Omzet hari ini", rp(sum(td))], ["Transaksi hari ini", td.length], ["Total omzet", rp(all)], ["Rata-rata/transaksi", rp(sales.length ? Math.round(all / sales.length) : 0)]].map((a) => `<div class="card stat"><span class="muted">${a[0]}</span><b>${a[1]}</b></div>`).join("");
  const m = {};
  sales.forEach((s) => {
    const r = s.subtotal ? s.total / s.subtotal : 1;
    s.items.forEach((i) => {
      m[i.name] = m[i.name] || { q: 0, r: 0 };
      m[i.name].q += i.qty;
      m[i.name].r += i.qty * i.price * r;
    });
  });
  const rows = Object.entries(m).sort((a, b) => b[1].q - a[1].q).slice(0, 8);
  $("top").innerHTML = rows.length ? rows.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${v.q}</td><td>${rp(Math.round(v.r))}</td></tr>`).join("") : '<tr><td colspan="3" class="muted">Belum ada data.</td></tr>';
}
function renderPlist() {
  $("plist").innerHTML = products.map((p) => `<div class="item"><span>${esc(p.name)}</span><span>${rp(p.price)} <button class="x" data-rm="${p.id}">✕</button></span></div>`).join("") || '<p class="muted">Belum ada produk.</p>';
}
function refresh() {
  renderProds();
  renderCart();
  renderHist();
  renderReport();
  renderPlist();
}

// ===== Event handler =====
document.querySelectorAll(".tab").forEach((b) => b.onclick = () => {
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === b));
  ["kasir", "riwayat", "laporan", "produk"].forEach((t) => $("t-" + t).classList.toggle("hide", t !== b.dataset.t));
});
$("prods").onclick = (e) => {
  const b = e.target.closest(".prod");
  if (!b) return;
  cart[b.dataset.id] = (cart[b.dataset.id] || 0) + 1;
  renderCart();
};
$("cart").onclick = (e) => {
  const m = e.target.dataset.m, p = e.target.dataset.p;
  if (p) cart[p]++;
  if (m) {
    cart[m]--;
    if (cart[m] <= 0) delete cart[m];
  }
  renderCart();
};
["disc", "ppn", "paid"].forEach((i) => $(i).oninput = calcTotals);
$("q").oninput = renderProds;
$("quick").onclick = (e) => {
  const q = e.target.dataset.q;
  if (!q) return;
  $("paid").value = q === "pas" ? calc.tot : q;
  calcTotals();
};
$("pp").onkeydown = (e) => {
  if (e.key === "Enter") $("add").click();
};
$("clr").onclick = () => {
  cart = {};
  $("paid").value = "";
  $("msg").textContent = "";
  renderCart();
};
$("pay").onclick = () => {
  const ids = Object.keys(cart);
  if (!ids.length) {
    $("msg").textContent = "Keranjang masih kosong.";
    return;
  }
  const paid = +$("paid").value || 0;
  if (paid < calc.tot) {
    $("msg").textContent = "Jumlah bayar kurang dari total.";
    return;
  }
  sales.push({ id: Date.now(), date: (/* @__PURE__ */ new Date()).toISOString(), items: ids.map((id) => {
    const p = products.find((x) => x.id == id);
    return { name: p.name, price: p.price, qty: cart[id] };
  }), subtotal: calc.sub, total: calc.tot, paid, change: paid - calc.tot });
  save("tk_sales", sales);
  cart = {};
  $("paid").value = "";
  $("disc").value = 0;
  $("ppn").checked = false;
  $("msg").textContent = "Transaksi tersimpan ✓ Kembalian " + rp(paid - calc.tot);
  refresh();
};
$("hist").onclick = (e) => {
  const d = e.target.dataset.del;
  if (!d) return;
  sales = sales.filter((s) => s.id != d);
  save("tk_sales", sales);
  refresh();
};
let rc = false;
$("reset").onclick = () => {
  if (!rc) {
    rc = true;
    $("reset").textContent = "Klik lagi untuk konfirmasi hapus";
    setTimeout(() => {
      rc = false;
      $("reset").textContent = "Hapus semua data transaksi";
    }, 3500);
    return;
  }
  rc = false;
  $("reset").textContent = "Hapus semua data transaksi";
  sales = [];
  save("tk_sales", sales);
  refresh();
};
$("add").onclick = () => {
  const n = $("pn").value.trim(), p = +$("pp").value;
  if (!n || !(p >= 0) || $("pp").value === "") return;
  products.push({ id: Date.now(), name: n, price: p });
  save("tk_products", products);
  $("pn").value = "";
  $("pp").value = "";
  refresh();
};
$("plist").onclick = (e) => {
  const r = e.target.dataset.rm;
  if (!r) return;
  products = products.filter((p) => p.id != r);
  delete cart[r];
  save("tk_products", products);
  refresh();
};
refresh();
