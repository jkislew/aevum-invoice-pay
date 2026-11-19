// Compile contracts/InvoicePay.sol with the npm `solc` package -> artifacts/InvoicePay.json
import solc from "solc";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const source = readFileSync(new URL("../contracts/InvoicePay.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "InvoicePay.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "shanghai", // conservative target: no Cancun-only opcodes (MCOPY etc.)
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors) {
  for (const e of output.errors) {
    if (e.severity === "error") { console.error(e.formattedMessage); process.exit(1); }
    console.warn(e.formattedMessage);
  }
}
const c = output.contracts["InvoicePay.sol"]["InvoicePay"];
mkdirSync(new URL("../artifacts", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../artifacts/InvoicePay.json", import.meta.url),
  JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2)
);
console.log("compiled OK, bytecode bytes:", c.evm.bytecode.object.length / 2);
