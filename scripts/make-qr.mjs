// Generate a QR PNG for a payment-request link.
// Usage: node scripts/make-qr.mjs <invoiceId> [baseUrl]
import QRCode from "qrcode";
import { loadDeployment } from "./lib.mjs";

const id = process.argv[2];
if (!id) { console.error("usage: node scripts/make-qr.mjs <invoiceId> [baseUrl]"); process.exit(1); }
const dep = loadDeployment();
const base = process.argv[3] || "http://localhost:8080";
const link = `${base}/?invoice=${id}`;
const out = new URL(`../payment-request-${id}.png`, import.meta.url);
await QRCode.toFile(out.pathname, link, { width: 480, margin: 2 });
console.log("payment link:", link);
console.log("contract:", dep ? dep.invoicePay : "(not deployed)");
console.log("QR written to", out.pathname);
