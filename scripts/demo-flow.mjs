// End-to-end demo of the invoice payment flow on Aevum Testnet:
//   0. (if needed) merchant tops up the payer with gas + tUSD8 from its own balance
//   1. plain tUSD8 transfer merchant -> payer (baseline token movement proof)
//   2. merchant creates an invoice (payee = merchant, label = "Demo Merchant")
//   3. payer reviews the invoice on-chain (confirmation of payee), approves, pays
//   4. script verifies the invoice is Paid and prints explorer links for every tx
// Writes results to demo-proof.json. Requires funded wallets (README > Funding).
import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { ERC20_ABI, loadWallets, loadDeployment, txLink, fmtUSD8, fmtGas } from "./lib.mjs";

const { merchant, payer } = loadWallets();
const deployment = loadDeployment();
if (!deployment) { console.error("deployment.json missing — run scripts/deploy.mjs first"); process.exit(2); }

const p = merchant.provider;
const tokenM = new ethers.Contract(deployment.tusd8, ERC20_ABI, merchant);
const tokenP = new ethers.Contract(deployment.tusd8, ERC20_ABI, payer);
const artifact = JSON.parse(readFileSync(new URL("../artifacts/InvoicePay.json", import.meta.url), "utf8"));
const invoiceM = new ethers.Contract(deployment.invoicePay, artifact.abi, merchant);
const invoiceP = new ethers.Contract(deployment.invoicePay, artifact.abi, payer);

const proof = { network: deployment.network, chainId: deployment.chainId, contract: deployment.invoicePay, steps: [] };
const record = (step, hash, extra = {}) => { proof.steps.push({ step, tx: hash, explorer: txLink(hash), ...extra }); console.log(`${step}: ${txLink(hash)}`); };

async function balances(label) {
  const [mg, mu, pg, pu] = await Promise.all([
    p.getBalance(merchant.address), tokenM.balanceOf(merchant.address),
    p.getBalance(payer.address), tokenP.balanceOf(payer.address),
  ]);
  console.log(`${label} merchant [${fmtGas(mg)} | ${fmtUSD8(mu)}]  payer [${fmtGas(pg)} | ${fmtUSD8(pu)}]`);
  return { mg, mu, pg, pu };
}

let b = await balances("before:");

// --- funding gate -----------------------------------------------------------
if (b.mg === 0n || b.mu === 0n) {
  console.error("\nMerchant wallet is not funded. Fund this address first (README > Funding):");
  console.error("  " + merchant.address);
  console.error("  QDay Discord #faucet:  /faucet " + merchant.address + "   (1 tQDAY + 5 tUSD8)");
  process.exit(2);
}

// --- step 0: top up payer from merchant if payer is empty -------------------
if (b.pg === 0n || b.pu === 0n) {
  console.log("\nstep 0: topping up payer from merchant (gas + tUSD8)...");
  if (b.pg === 0n) { const tx = await merchant.sendTransaction({ to: payer.address, value: ethers.parseEther("0.05") }); await tx.wait(); record("topup-gas", tx.hash); }
  if (b.pu === 0n) { const tx = await tokenM.transfer(payer.address, ethers.parseUnits("2", 6)); await tx.wait(); record("topup-tusd8", tx.hash); }
  b = await balances("after topup:");
}

// --- step 1: plain tUSD8 transfer (baseline proof) ---------------------------
console.log("\nstep 1: plain tUSD8 transfer payer -> merchant, 0.25 tUSD8...");
{
  const tx = await tokenP.transfer(merchant.address, ethers.parseUnits("0.25", 6));
  await tx.wait();
  record("plain-transfer", tx.hash, { amount: "0.25 tUSD8", from: payer.address, to: merchant.address });
}

// --- step 2: merchant creates an invoice -------------------------------------
const amount = ethers.parseUnits("1.00", 6);
const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600);
console.log("\nstep 2: merchant creates invoice for 1.00 tUSD8...");
let invoiceId;
{
  const tx = await invoiceM.createInvoice(merchant.address, "Demo Merchant (Aevum Invoice Pay)", amount, "Demo invoice — Aevum Builder Challenge", expiresAt);
  const rc = await tx.wait();
  const log = rc.logs.map((l) => { try { return invoiceM.interface.parseLog(l); } catch { return null; } }).find((x) => x && x.name === "InvoiceCreated");
  invoiceId = log.args.id;
  record("create-invoice", tx.hash, { invoiceId: invoiceId.toString() });
  console.log("invoice id:", invoiceId.toString());
}

// --- step 3: payer reviews (confirmation of payee) then pays ------------------
console.log("\nstep 3: payer reads invoice on-chain before paying (confirmation of payee):");
const inv = await invoiceP.getInvoice(invoiceId);
console.log(`  payee:       ${inv.payee}`);
console.log(`  payee label: ${inv.payeeLabel}`);
console.log(`  amount:      ${fmtUSD8(inv.amount)}`);
console.log(`  memo:        ${inv.memo}`);
console.log(`  status:      ${["Open", "Paid", "Cancelled"][Number(inv.status)]}`);
{
  const approveTx = await tokenP.approve(deployment.invoicePay, amount);
  await approveTx.wait();
  record("approve", approveTx.hash);
  const payTx = await invoiceP.payInvoice(invoiceId);
  await payTx.wait();
  record("pay-invoice", payTx.hash, { invoiceId: invoiceId.toString() });
}

// --- step 4: verify ------------------------------------------------------------
const after = await invoiceP.getInvoice(invoiceId);
console.log("\nstep 4: invoice status after payment:", ["Open", "Paid", "Cancelled"][Number(after.status)], "| payer:", after.payer);
await balances("final:");
if (Number(after.status) !== 1) { console.error("FLOW FAILED: invoice not Paid"); process.exit(1); }
proof.invoiceId = invoiceId.toString();
proof.result = "PAID";
writeFileSync(new URL("../demo-proof.json", import.meta.url), JSON.stringify(proof, null, 2));
console.log("\nFLOW OK — proof written to demo-proof.json");
