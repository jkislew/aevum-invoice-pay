// Deploy InvoicePay to Aevum Testnet using the throwaway merchant wallet.
// Requires the merchant wallet to hold tQDAY for gas (see README "Funding").
import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "node:fs";
import { CHAIN, TUSD8, loadWallets, txLink, addrLink, fmtGas } from "./lib.mjs";

const { merchant } = loadWallets();
const bal = await merchant.provider.getBalance(merchant.address);
console.log("merchant:", merchant.address);
console.log("gas balance:", fmtGas(bal));
if (bal === 0n) {
  console.error("\nMerchant wallet has no tQDAY. Fund it first (README > Funding):");
  console.error("  - QDay Discord #faucet:  /faucet " + merchant.address + "   (1 tQDAY + 5 tUSD8)");
  console.error("  - or https://faucet.qday.info (browser claim, captcha + mainnet-balance check)");
  process.exit(2);
}

const artifact = JSON.parse(readFileSync(new URL("../artifacts/InvoicePay.json", import.meta.url), "utf8"));
const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, merchant);
const contract = await factory.deploy(TUSD8);
console.log("deploy tx:", txLink(contract.deploymentTransaction().hash));
await contract.waitForDeployment();
const address = await contract.getAddress();
console.log("InvoicePay deployed:", addrLink(address));

const deployment = {
  network: CHAIN.name,
  chainId: CHAIN.chainId,
  rpc: CHAIN.rpc,
  explorer: CHAIN.explorer,
  tusd8: TUSD8,
  invoicePay: address,
  deployTx: contract.deploymentTransaction().hash,
  deployer: merchant.address,
  deployedAt: new Date().toISOString(),
};
writeFileSync(new URL("../deployment.json", import.meta.url), JSON.stringify(deployment, null, 2));
console.log("wrote deployment.json");
await import("./build-app-config.mjs");
