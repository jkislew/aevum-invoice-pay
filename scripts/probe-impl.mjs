import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc-test.qday.info");
const IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

function extractSelectors(code) {
  const sels = new Set();
  const bytes = ethers.getBytes(code);
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x63) sels.add(ethers.hexlify(bytes.slice(i + 1, i + 5)));
  }
  return [...sels];
}

for (const [name, addr] of [
  ["QDayFaucet", "0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5"],
  ["tUSD8", "0x456569838f1d43009A91ebA4263147Afd7233483"],
]) {
  const implRaw = await provider.getStorage(addr, IMPL_SLOT);
  const impl = ethers.getAddress("0x" + implRaw.slice(26));
  console.log(`\n== ${name}: impl slot = ${impl}`);
  if (impl !== ethers.ZeroAddress) {
    const code = await provider.getCode(impl);
    console.log(`impl code ${(code.length - 2) / 2} bytes, selectors:`, extractSelectors(code).join(" "));
    console.log("impl native balance:", ethers.formatEther(await provider.getBalance(impl)));
  }
}
