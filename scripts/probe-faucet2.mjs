import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc-test.qday.info");
const FAUCET = "0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5";
const ME = "0x6D6c6C20e34bC031A02C25f2116910be4857D3dc";

const abi = [
  "function dripAmount() view returns (uint256)",
  "function cooldown() view returns (uint256)",
  "function paused() view returns (bool)",
  "function eoaOnly() view returns (bool)",
  "function owner() view returns (address)",
  "function timeUntilNextClaim(address) view returns (uint256)",
  "function claim(address)",
];
const f = new ethers.Contract(FAUCET, abi, provider);
console.log("dripAmount:", ethers.formatEther(await f.dripAmount()));
console.log("cooldown (s):", (await f.cooldown()).toString());
console.log("paused:", await f.paused());
console.log("eoaOnly:", await f.eoaOnly());
console.log("owner:", await f.owner());
console.log("timeUntilNextClaim(me):", (await f.timeUntilNextClaim(ME)).toString());

// simulate claim from my address and decode the revert
try {
  await provider.call({ to: FAUCET, from: ME, data: f.interface.encodeFunctionData("claim", [ME]) });
  console.log("claim simulation: SUCCESS");
} catch (e) {
  const data = e.data || e.info?.error?.data;
  console.log("claim simulation reverted, data:", data);
  const known = {
    "0xc1336f85": "FaucetEmpty()",
    "0xc1ab61a1": "CooldownActive(uint256)",
    "0x30cd7471": "NotOwner()",
    "0xd92e233d": "ZeroAddress()",
    "0x6972b64d": "ZeroCooldown()",
    "0x558a1e03": "unknown 0x558a1e03",
    "0x13d0ff59": "unknown 0x13d0ff59",
    "0x5d04968b": "unknown 0x5d04968b",
    "0x12171d83": "unknown 0x12171d83",
    "0x0614e5c7": "unknown 0x0614e5c7",
  };
  if (data && known[data.slice(0, 10)]) console.log("decoded:", known[data.slice(0, 10)], data.length > 10 ? ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], "0x" + data.slice(10)).toString() : "");
}
