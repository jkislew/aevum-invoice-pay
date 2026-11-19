import { ethers } from "ethers";

const RPC = "https://rpc-test.qday.info";
const FAUCET = "0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5";
const TUSD8 = "0x456569838f1d43009A91ebA4263147Afd7233483";
const ME = "0x6D6c6C20e34bC031A02C25f2116910be4857D3dc";

const provider = new ethers.JsonRpcProvider(RPC);

const code = await provider.getCode(FAUCET);
console.log("faucet code bytes:", (code.length - 2) / 2);
console.log("faucet native tQDAY balance:", ethers.formatEther(await provider.getBalance(FAUCET)));

const erc20 = new ethers.Contract(TUSD8, ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)", "function symbol() view returns (string)"], provider);
console.log("tUSD8 symbol/decimals:", await erc20.symbol(), await erc20.decimals());
console.log("faucet tUSD8 balance:", ethers.formatUnits(await erc20.balanceOf(FAUCET), 6));
console.log("my tUSD8 balance:", ethers.formatUnits(await erc20.balanceOf(ME), 6));
console.log("my native balance:", ethers.formatEther(await provider.getBalance(ME)));

const addrArg = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ME]).slice(2);
const candidates = [
  "claim()", "faucet()", "drip()", "requestTokens()", "claimTokens()", "getTokens()",
  "claim(address)", "drip(address)", "requestTokens(address)", "faucet(address)",
  "claimTokens(address)", "getTokens(address)", "withdraw()", "request()", "mint()",
  "claimTUSD8()", "claimQDAY()", "claimAll()",
];
for (const sig of candidates) {
  const sel = ethers.id(sig).slice(0, 10);
  const data = sig.includes("(address)") ? sel + addrArg : sel;
  try {
    const res = await provider.call({ to: FAUCET, data });
    console.log("OK   ", sig, "->", res);
  } catch (e) {
    const msg = (e.info?.error?.message || e.shortMessage || e.message || "").slice(0, 90);
    console.log("REVERT", sig, "-", msg);
  }
}
