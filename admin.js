const SENHA = "KING123"; // MUDE AQUI

const $ = (id) => document.getElementById(id);

let config = null;

async function loadConfig() {
  const res = await fetch("./config.json?ts=" + Date.now());
  config = await res.json();

  // preencher campos
  $("pixKey").value = config.pix?.key || "";
  $("pixName").value = config.pix?.name || "";
  $("pixCity").value = config.pix?.city || "";
  $("pixDesc").value = config.pix?.desc || "";

  renderDiscounts();
  renderCoupons();
}

function renderDiscounts() {
  const box = $("discList");
  box.innerHTML = "";
  (config.discount_rules || []).sort((a,b)=>a.min_qty-b.min_qty).forEach((r, idx) => {
    const div = document.createElement("div");
    div.style.marginTop = "8px";
    div.innerHTML = `• ${r.min_qty}+ = <b>${r.percent}%</b> <button data-i="${idx}">Remover</button>`;
    div.querySelector("button").onclick = (e) => {
      config.discount_rules.splice(Number(e.target.dataset.i), 1);
      renderDiscounts();
    };
    box.appendChild(div);
  });
}

function renderCoupons() {
  const box = $("cupList");
  box.innerHTML = "";
  const cps = config.coupons || {};
  Object.keys(cps).sort().forEach(code => {
    const c = cps[code];
    const div = document.createElement("div");
    div.style.marginTop = "8px";
    div.innerHTML = `• <b>${code}</b> = ${c.percent}% (ativo: ${c.active ? "sim" : "não"})
      <button data-code="${code}">Remover</button>`;
    div.querySelector("button").onclick = (e) => {
      delete config.coupons[e.target.dataset.code];
      renderCoupons();
    };
    box.appendChild(div);
  });
}

function syncPix() {
  config.pix = {
    key: $("pixKey").value.trim(),
    name: $("pixName").value.trim(),
    city: $("pixCity").value.trim(),
    desc: $("pixDesc").value.trim()
  };
}

$("btnEntrar").onclick = async () => {
  if ($("senha").value !== SENHA) {
    $("msgLogin").textContent = "Senha errada";
    return;
  }
  $("msgLogin").textContent = "";
  $("painel").style.display = "block";
  await loadConfig();
};

$("btnAddDisc").onclick = () => {
  const q = Number($("discQty").value);
  const p = Number($("discPct").value);
  if (!q || q < 1000) return alert("Quantidade mínima inválida");
  if (p < 0) return alert("Percentual inválido");
  config.discount_rules = config.discount_rules || [];
  config.discount_rules.push({ min_qty: q, percent: p });
  $("discQty").value = "";
  $("discPct").value = "";
  renderDiscounts();
};

$("btnAddCup").onclick = () => {
  const code = $("cupCode").value.trim().toUpperCase();
  const pct = Number($("cupPct").value);
  if (!code) return alert("Código vazio");
  if (pct <= 0) return alert("% inválido");
  config.coupons = config.coupons || {};
  config.coupons[code] = { percent: pct, active: true };
  $("cupCode").value = "";
  $("cupPct").value = "";
  renderCoupons();
};

$("btnSetPrice").onclick = () => {
  const plat = $("pPlat").value.trim();
  const serv = $("pServ").value.trim();
  const qty = String(Number($("pQty").value));
  const val = Number($("pVal").value);

  if (!plat || !serv) return alert("Preencha plataforma e serviço");
  if (!qty || !["1000","2000","3000","5000","10000"].includes(qty)) return alert("Quantidade deve ser 1000,2000,3000,5000,10000");
  if (!val || val <= 0) return alert("Preço inválido");

  config.prices = config.prices || {};
  config.prices[plat] = config.prices[plat] || {};
  config.prices[plat][serv] = config.prices[plat][serv] || {};
  config.prices[plat][serv][qty] = val;

  $("msg").textContent = `✅ Salvo: ${plat} / ${serv} / ${qty} = R$ ${val}`;
};

$("btnExport").onclick = () => {
  syncPix();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "config.json";
  a.click();
};
