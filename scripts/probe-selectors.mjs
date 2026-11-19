import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc-test.qday.info");

function extractSelectors(code) {
  // find PUSH4 (0x63) operands — dispatcher comparisons
  const sels = new Set();
  const bytes = ethers.getBytes(code);
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x63) {
      const sel = ethers.hexlify(bytes.slice(i + 1, i + 5));
      sels.add(sel);
    }
  }
  return [...sels];
}

for (const [name, addr] of [
  ["QDayFaucet", "0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5"],
  ["tUSD8", "0x456569838f1d43009A91ebA4263147Afd7233483"],
]) {
  const code = await provider.getCode(addr);
  console.log(`\n== ${name} ${addr} code ${(code.length - 2) / 2} bytes`);
  console.log("selectors:", extractSelectors(code).join(" "));
}
