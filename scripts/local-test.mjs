// Local end-to-end test of the REAL InvoicePay contract + flow logic against an
// in-process Ganache chain with a mock 6-decimal tUSD8. This validates everything
// except the live Aevum deployment, which runs via scripts/deploy.mjs +
// scripts/demo-flow.mjs once the throwaway wallets are funded (see README).
import { ethers } from "ethers";
import ganache from "ganache";
import solc from "solc";
import { readFileSync } from "node:fs";

function compile(file) {
  const source = readFileSync(new URL(`../contracts/${file}`, import.meta.url), "utf8");
  const out = JSON.parse(solc.compile(JSON.stringify({
    language: "Solidity",
    sources: { [file]: { content: source } },
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "shanghai", outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  })));
  const name = file.replace(".sol", "");
  const c = out.contracts[file][name];
  return { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
}

const gp = ganache.provider({ logging: { quiet: true } });
const provider = new ethers.BrowserProvider(gp);
const merchant = await provider.getSigner(0);
const payer = await provider.getSigner(1);
const mAddr = await merchant.getAddress();
const pAddr = await payer.getAddress();

const mock = compile("MockUSD8.sol");
const inv = compile("InvoicePay.sol");
const token = await new ethers.ContractFactory(mock.abi, mock.bytecode, merchant).deploy();
const tokenAddr = await token.getAddress();
const invoices = await new ethers.ContractFactory(inv.abi, inv.bytecode, merchant).deploy(tokenAddr);
const invAddr = await invoices.getAddress();
console.log("mock tUSD8:", tokenAddr, "| InvoicePay:", invAddr);

const tokenP = token.connect(payer);
const invP = invoices.connect(payer);
await (await token.mint(pAddr, ethers.parseUnits("10", 6))).wait();
console.log("minted 10 mock tUSD8 to payer; payer balance:", ethers.formatUnits(await token.balanceOf(pAddr), 6));

// plain transfer proof step
await (await tokenP.transfer(mAddr, ethers.parseUnits("0.25", 6))).wait();
console.log("plain transfer 0.25 payer->merchant OK");

// invoice flow
const amount = ethers.parseUnits("1.00", 6);
const exp = Math.floor(Date.now() / 1000) + 7 * 86400;
const rc = await (await invoices.createInvoice(mAddr, "Demo Merchant (Aevum Invoice Pay)", amount, "Local test invoice", exp)).wait();
const created = rc.logs.map((l) => { try { return invoices.interface.parseLog(l); } catch { return null; } }).find((x) => x && x.name === "InvoiceCreated");
const id = created.args.id;
console.log("invoice created, id:", id.toString());

const view = await invP.getInvoice(id);
console.log("payer sees payee label:", view.payeeLabel, "| amount:", ethers.formatUnits(view.amount, 6), "| status:", Number(view.status));
await (await tokenP.approve(invAddr, amount)).wait();
await (await invP.payInvoice(id)).wait();
const after = await invP.getInvoice(id);
console.log("status after pay:", ["Open", "Paid", "Cancelled"][Number(after.status)], "| payer recorded:", after.payer === pAddr);
console.log("merchant tUSD8 balance:", ethers.formatUnits(await token.balanceOf(mAddr), 6));
if (Number(after.status) !== 1) { console.error("LOCAL TEST FAILED"); process.exit(1); }
console.log("LOCAL E2E TEST PASSED");
