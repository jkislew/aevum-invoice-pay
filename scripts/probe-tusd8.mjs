import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc-test.qday.info");
const TUSD8 = "0x456569838f1d43009A91ebA4263147Afd7233483";
const ME = "0x6D6c6C20e34bC031A02C25f2116910be4857D3dc";

const t = new ethers.Contract(TUSD8, [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
], provider);
console.log("name:", await t.name());
console.log("totalSupply:", ethers.formatUnits(await t.totalSupply(), 6));
try { console.log("owner:", await t.owner()); } catch { console.log("owner: n/a"); }

const code = (await provider.getCode(TUSD8)).toLowerCase();
const probes = {
  "mint(address,uint256)": "40c10f19",
  "mint(uint256)": "a0712d68",
  "mint()": "1249c58b",
  "faucet()": "7a9e5e4b", // placeholder, computed below
  "claim()": "4e71d92d",
  "claim(address)": "1e83409a",
  "drip()": "9f85792b",
  "requestTokens()": "7283fb02",
};
probes["faucet()"] = ethers.id("faucet()").slice(2, 10);
probes["drip()"] = ethers.id("drip()").slice(2, 10);
probes["requestTokens()"] = ethers.id("requestTokens()").slice(2, 10);
probes["issue(address,uint256)"] = ethers.id("issue(address,uint256)").slice(2, 10);
for (const [sig, sel] of Object.entries(probes)) {
  console.log(code.includes(sel) ? "IN BYTECODE " : "absent      ", sig, "0x" + sel);
}

// recent Transfer events: find mint sources (from == 0x0) and big senders
const latest = await provider.getBlockNumber();
const topic = ethers.id("Transfer(address,address,uint256)");
const logs = await provider.getLogs({ address: TUSD8, topics: [topic], fromBlock: latest - 9000, toBlock: latest });
console.log("\nrecent transfers:", logs.length);
const froms = {};
for (const l of logs) {
  const from = ethers.getAddress("0x" + l.topics[1].slice(26));
  froms[from] = (froms[from] || 0) + 1;
}
console.log("senders:", froms);
