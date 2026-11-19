/* Aevum Invoice Pay — front-end logic (ethers v6, MetaMask / any EIP-1193 wallet) */
const CFG = window.AEVUM_CONFIG;
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

let provider, signer, account, token, invoices, currentInvoice = null;

const $ = (id) => document.getElementById(id);
const setStatus = (id, msg, cls = "") => { const el = $(id); el.textContent = msg; el.className = "status " + cls; };

function explorerTx(hash) { return `${CFG.explorer}/tx/${hash}`; }

async function ensureChain() {
  const net = await provider.getNetwork();
  if (Number(net.chainId) === CFG.chainId) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CFG.chainIdHex }] });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{ chainId: CFG.chainIdHex, chainName: CFG.chainName, rpcUrls: [CFG.rpc], blockExplorerUrls: [CFG.explorer], nativeCurrency: { name: "tQDAY", symbol: "tQDAY", decimals: 18 } }],
      });
    } else throw e;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
}

async function refreshBalances() {
  if (!account) return;
  const [gas, usd] = await Promise.all([provider.getBalance(account), token.balanceOf(account)]);
  $("balGas").textContent = Number(ethers.formatEther(gas)).toFixed(4) + " tQDAY";
  $("balUsd").textContent = Number(ethers.formatUnits(usd, 6)).toFixed(2) + " tUSD8";
}

async function connect() {
  if (!window.ethereum) { setStatus("netStatus", "No wallet found. Install MetaMask (or any EIP-1193 wallet) and reload.", "err"); return; }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  await ensureChain();
  signer = await provider.getSigner();
  account = await signer.getAddress();
  token = new ethers.Contract(CFG.tusd8, ERC20_ABI, signer);
  invoices = new ethers.Contract(CFG.invoicePay, CFG.invoicePayAbi, signer);
  $("walletAddr").textContent = account;
  $("contractAddr").textContent = CFG.invoicePay;
  setStatus("netStatus", "Connected on QDay Aevum Testnet.", "ok");
  if (!$("fPayee").value) $("fPayee").value = account;
  await refreshBalances();
  const q = new URLSearchParams(location.search);
  if (q.get("invoice")) { $("fInvoiceId").value = q.get("invoice"); await loadInvoice(); }
}

async function createInvoice() {
  try {
    if (!signer) await connect();
    const payee = $("fPayee").value.trim();
    const label = $("fLabel").value.trim();
    const amount = ethers.parseUnits($("fAmount").value || "0", 6);
    const memo = $("fMemo").value.trim();
    const days = Math.max(1, Number($("fDays").value || 7));
    if (!ethers.isAddress(payee)) throw new Error("Payee is not a valid address.");
    if (amount <= 0n) throw new Error("Amount must be greater than zero.");
    if (!label) throw new Error("Payee name is required (confirmation of payee).");
    const expiresAt = Math.floor(Date.now() / 1000) + days * 86400;
    setStatus("createStatus", "Sending createInvoice transaction…");
    const tx = await invoices.createInvoice(payee, label, amount, memo, expiresAt);
    const rc = await tx.wait();
    const log = rc.logs.map((l) => { try { return invoices.interface.parseLog(l); } catch { return null; } }).find((x) => x && x.name === "InvoiceCreated");
    const id = log.args.id.toString();
    const link = `${location.origin}${location.pathname}?invoice=${id}`;
    $("payLink").innerHTML = `<a href="${link}">${link}</a> &nbsp;·&nbsp; <a href="${explorerTx(tx.hash)}" target="_blank" rel="noopener">creation tx</a>`;
    $("qr").innerHTML = "";
    new QRCode($("qr"), { text: link, width: 160, height: 160 });
    $("payLinkBox").style.display = "block";
    setStatus("createStatus", `Invoice #${id} created. Share the payment link with your customer.`, "ok");
    await refreshBalances();
  } catch (e) { setStatus("createStatus", "Error: " + (e.shortMessage || e.message), "err"); }
}

async function loadInvoice() {
  try {
    if (!signer) await connect();
    const id = $("fInvoiceId").value.trim();
    const inv = await invoices.getInvoice(id);
    currentInvoice = { id, ...inv };
    $("vLabel").textContent = inv.payeeLabel;
    $("vPayee").textContent = inv.payee;
    $("vAmount").textContent = Number(ethers.formatUnits(inv.amount, 6)).toFixed(2) + " tUSD8";
    $("vStatus").textContent = ["Open", "Paid", "Cancelled"][Number(inv.status)];
    $("vExpiry").textContent = new Date(Number(inv.expiresAt) * 1000).toLocaleString();
    $("vMemo").textContent = inv.memo || "—";
    $("invoiceBox").style.display = "block";
    const paid = Number(inv.status) !== 0;
    $("btnApprove").disabled = paid; $("btnPay").disabled = paid;
    setStatus("payStatus", paid ? "This invoice is no longer open." : "Review the payee above, then approve and pay.", paid ? "warn" : "mut");
  } catch (e) { setStatus("payStatus", "Error: " + (e.shortMessage || e.message), "err"); }
}

async function approve() {
  try {
    const inv = await invoices.getInvoice(currentInvoice.id);
    const existing = await token.allowance(account, CFG.invoicePay);
    if (existing >= inv.amount) { setStatus("payStatus", "Allowance already covers the amount — you can pay now.", "ok"); return; }
    setStatus("payStatus", "Sending approve transaction…");
    const tx = await token.approve(CFG.invoicePay, inv.amount);
    await tx.wait();
    setStatus("payStatus", `Approved. Tx: ${explorerTx(tx.hash)}`, "ok");
  } catch (e) { setStatus("payStatus", "Error: " + (e.shortMessage || e.message), "err"); }
}

async function pay() {
  try {
    setStatus("payStatus", "Sending payment transaction…");
    const tx = await invoices.payInvoice(currentInvoice.id);
    const rc = await tx.wait();
    setStatus("payStatus", `Paid! Confirmation: ${explorerTx(rc.hash)}`, "ok");
    await loadInvoice(); await refreshBalances();
  } catch (e) { setStatus("payStatus", "Error: " + (e.shortMessage || e.message), "err"); }
}

$("btnConnect").onclick = () => connect().catch((e) => setStatus("netStatus", "Error: " + (e.shortMessage || e.message), "err"));
$("btnCreate").onclick = createInvoice;
$("btnLoad").onclick = loadInvoice;
$("btnApprove").onclick = approve;
$("btnPay").onclick = pay;
$("contractAddr").textContent = CFG.invoicePay || "(set after deploy — see README)";

// deep link: ?invoice=<id> prefills the payer view once a wallet connects
const q = new URLSearchParams(location.search);
if (q.get("invoice")) $("fInvoiceId").value = q.get("invoice");
