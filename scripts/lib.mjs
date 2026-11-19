import { ethers } from "ethers";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const CHAIN = {
  name: "QDay Aevum Testnet",
  chainId: 44005,
  rpc: "https://rpc-test.qday.info",
  explorer: "https://explorer-test.qday.info",
  nativeSymbol: "tQDAY",
};

export const TUSD8 = "0x456569838f1d43009A91ebA4263147Afd7233483";
export const FAUCET_CONTRACT = "0xE5074CBbd046AFb491EB8692abD6cF7ECCC6dEE5";

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export function provider() {
  return new ethers.JsonRpcProvider(CHAIN.rpc, CHAIN.chainId);
}

/// Load the local throwaway testnet wallets (kept OUTSIDE the git repo).
export function loadWallets() {
  const file =
    process.env.AEVUM_WALLETS_FILE ||
    path.join(homedir(), "workspace/aevum-builder/secrets/wallets.json");
  if (!existsSync(file)) throw new Error(`wallets file not found: ${file}`);
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const p = provider();
  return {
    merchant: new ethers.Wallet(raw.merchant.privateKey, p),
    payer: new ethers.Wallet(raw.payer.privateKey, p),
  };
}

export function loadDeployment() {
  const file = new URL("../deployment.json", import.meta.url);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

export const txLink = (hash) => `${CHAIN.explorer}/tx/${hash}`;
export const addrLink = (a) => `${CHAIN.explorer}/address/${a}`;
export const fmtUSD8 = (v) => ethers.formatUnits(v, 6) + " tUSD8";
export const fmtGas = (v) => ethers.formatEther(v) + " tQDAY";
