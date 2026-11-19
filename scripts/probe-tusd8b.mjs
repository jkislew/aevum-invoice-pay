import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc-test.qday.info");
const TUSD8 = "0x456569838f1d43009A91ebA4263147Afd7233483";
const OWNER = "0x94ef5dB164e7BBf4149e298c5588C035Ea8E9C05";

const t = new ethers.Contract(TUSD8, ["function balanceOf(address) view returns (uint256)"], provider);
console.log("owner tUSD8 balance:", ethers.formatUnits(await t.balanceOf(OWNER), 6));
console.log("owner is contract:", (await provider.getCode(OWNER)) !== "0x");

const latest = await provider.getBlockNumber();
const topic = ethers.id("Transfer(address,address,uint256)");
const froms = {};
let total = 0;
for (let end = latest; end > latest - 20000; end -= 1000) {
  const logs = await provider.getLogs({ address: TUSD8, topics: [topic], fromBlock: end - 999, toBlock: end });
  total += logs.length;
  for (const l of logs) {
    const from = ethers.getAddress("0x" + l.topics[1].slice(26));
    froms[from] = (froms[from] || 0) + 1;
  }
  if (total > 0 && end < latest - 5000) break;
}
console.log("scanned to block", latest - 20000, "transfers found:", total);
console.log("senders:", froms);
for (const a of Object.keys(froms)) {
  console.log(a, "isContract:", (await provider.getCode(a)) !== "0x", "tUSD8 bal:", ethers.formatUnits(await t.balanceOf(a), 6));
}
