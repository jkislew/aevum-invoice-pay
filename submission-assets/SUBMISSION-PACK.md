# Submission pack — Aevum Builder Challenge #1 (DoraHacks BUIDL)

Ready-to-paste text for every field of the DoraHacks submission form.
Submit at: https://dorahacks.io/hackathon/qday/detail — **deadline Dec 11, 2026 08:00 UTC**.
All links are filled in: the repository is public on GitHub and the dApp is
served from the repo's `gh-pages` branch (GitHub Pages must still be enabled
in the repo settings — a browser step — before the live URL resolves).

---

## Project name

```
Aevum Invoice Pay
```

## Track

```
Invoice Payments
```

## One-liner (tagline)

```
Invoice payments in tUSD8 on QDay Aevum Testnet with on-chain confirmation of payee — the customer verifies exactly who they are paying, how much, and what for, before any funds move.
```

## Description

```
Aevum Invoice Pay is a non-custodial invoice payment flow for tUSD8, the QDay
stablecoin, built for the Aevum Builder Challenge #1 (tracks: Invoice Payments
and Confirmation of Payee).

The problem: paying a stablecoin invoice today usually means trusting an
address pasted into a chat. One wrong character — or one swapped address —
and the money is gone, with no built-in way for the payer to check who they
are actually paying.

How it works:
1. The merchant creates an on-chain invoice with the InvoicePay contract:
   payee address, a human-readable payee label, an exact tUSD8 amount, a memo,
   and an expiry.
2. The dApp turns the invoice into a payment-request link (and QR code) the
   merchant can send anywhere.
3. The customer opens the link and sees a confirmation-of-payee card read
   directly from the chain: payee name + full address, exact amount, memo,
   expiry, and status.
4. The customer approves exactly the invoice amount and calls payInvoice.
   Funds move straight from payer to payee via transferFrom — the contract
   never takes custody — and the invoice flips to Paid with an InvoicePaid
   event anyone can verify on the explorer.

Safety properties: exact-amount only (no partial or over-payment), expiry
enforced on-chain, issuer-only cancellation, effects-before-interaction in
payInvoice, no admin keys, no upgradeability, least-privilege approvals.

Live proof (QDay Aevum Testnet, chain 44005): the full flow has already run
on-chain. Invoice #1 (1.00 tUSD8, "Demo invoice — Aevum Builder Challenge")
was created and PAID; every step is linked under "Transaction evidence"
below and reproducible with scripts/demo-flow.mjs. An offline end-to-end
test of the same bytecode also ships in the repo (npm test).

Tech: Solidity (InvoicePay), a dependency-light static dApp (ethers.js),
Node.js scripts for compile / deploy / demo flow / QR generation, and a
Dockerfile that serves the dApp on port 8080.
```

## Links

| Field | Value |
|---|---|
| GitHub repository | https://github.com/jkislew/aevum-invoice-pay |
| Live demo | https://jkislew.github.io/aevum-invoice-pay/ |
| Live demo — straight to the paid demo invoice | https://jkislew.github.io/aevum-invoice-pay/?invoice=1 |
| Documentation | README.md in the repository (setup, architecture, addresses, reproduction steps) |
| License | MIT |

If the form prefers a Docker image over a hosted URL, the repo root has a
`Dockerfile` that serves the dApp: `docker build -t aevum-invoice-pay . && docker run -p 8080:8080 aevum-invoice-pay`.

## Contract address (QDay Aevum Testnet, chain ID 44005)

```
InvoicePay: 0x3022A50872AbeD36EfF6e6A4af991FD4Cb7998BB
Explorer:   https://explorer-test.qday.info/address/0x3022A50872AbeD36EfF6e6A4af991FD4Cb7998BB
Deploy tx:  0x1f265dcec6b420db55567f1db6d5b1de98afbf53a4f6e1390b94ffbf5ca5a039
tUSD8 (official QDay test stablecoin, 6 decimals): 0x456569838f1d43009A91ebA4263147Afd7233483
```

## Transaction evidence (all confirmed `success` on the explorer; full set also in `demo-proof.json`)

| Step | Tx |
|---|---|
| Deploy InvoicePay | https://explorer-test.qday.info/tx/0x1f265dcec6b420db55567f1db6d5b1de98afbf53a4f6e1390b94ffbf5ca5a039 |
| Top up payer — gas (0.05 tQDAY) | https://explorer-test.qday.info/tx/0x5f0f3c5a6a7086f3eb9bde09ba394b9a668ae9c6e892382f916a4726b8aff8b3 |
| Top up payer — tUSD8 (2.00) | https://explorer-test.qday.info/tx/0x3d299c58d441ea35559daa209d90b5de69ab8b74fbdcf4c5e80549490af41fd6 |
| Plain tUSD8 transfer (0.25, payer → merchant) | https://explorer-test.qday.info/tx/0xa72e5ff67ff41cbf844083aba41b4910449fa837bbcbb73b936cb68d52b4f6d8 |
| Create invoice #1 (1.00 tUSD8) | https://explorer-test.qday.info/tx/0xe6b18f482b6c4aa86fac20785395b0a6cb4aa281e1d6e70ca2d2ddfe51811744 |
| Approve tUSD8 (payer → InvoicePay) | https://explorer-test.qday.info/tx/0xdc941e1c6bb65531d9b74500295fa8b7ebddd59e0dcfae6584b452d49a635b5f |
| **Pay invoice #1** | https://explorer-test.qday.info/tx/0xd7801c76dcd2ce7a898b979345595dbbe5ecf393e5be09804fcea797fb9e2816 |

Final balances reconcile exactly: merchant 4.25 tUSD8 (5.00 faucet − 2.00 top-up
+ 0.25 plain transfer + 1.00 invoice), payer 0.75 tUSD8 (2.00 − 0.25 − 1.00).

## Screenshots (in this folder)

| File | What it shows |
|---|---|
| `01-dapp-home-no-wallet.png` | The dApp as it renders with no wallet connected: header, wallet card ("Not connected") already displaying the live InvoicePay contract address from `app/config.js`, the merchant create-invoice form, and the customer section. |
| `02-dapp-merchant-create-invoice.png` | Close-up of the merchant view: the create-invoice form (payee address, payee name for confirmation, amount in tUSD8, memo, expiry in days, Create invoice button). |
| `03-dapp-pay-view-invoice1-paid.png` | The customer view for invoice #1 in its real PAID state, rendered by the dApp from live chain data: confirmation-of-payee card ("Demo Merchant (Aevum Invoice Pay)", payee `0x6D6c…D3dc`), amount 1.00 tUSD8, status pill **Paid**, expiry 11/26/2026, memo, Approve/Pay buttons disabled, "This invoice is no longer open." The connected (read-only) wallet is the demo payer `0x11cb…F83`, showing its real post-payment balances: 0.0498 tQDAY / 0.75 tUSD8. |
| `04-explorer-contract-address.png` | Blockscout contract page for InvoicePay: creator `0x6D…D3dc` at deploy txn `0x1f…a039`, 0 QDAY balance (non-custodial), transaction/internal-txn/log counts. |
| `05-explorer-pay-invoice-tx.png` | Blockscout transaction page for the pay-invoice tx: **Success**, method `payInvoice`, block 3613527, Nov 19 2026 22:51:36 UTC, from payer `0x11cb…F83` to the InvoicePay contract, with the 1 tUSD8 transfer to the merchant shown in "Tokens transferred". |

## Demo-invoice QR code

Generated 2026-11-20 with:

```
node scripts/make-qr.mjs 1 https://jkislew.github.io/aevum-invoice-pay
# writes payment-request-1.png (repo root), encoding https://jkislew.github.io/aevum-invoice-pay/?invoice=1
```

`payment-request-1.png` is kept locally (binary files cannot go through the
GitHub connector snapshot push); it will be uploaded via the browser together
with the screenshots. Attach it to the submission next to the screenshots above.

## Internal notes (do not paste into the form)

- Screenshots were captured 2026-11-19 ~22:58–23:00 UTC from the dApp served
  locally from this repo's `app/` (the same files that will be hosted).
- For `03-…png`, the browser had no real wallet extension. A read-only
  EIP-1193 provider shim was injected that forwards every read
  (`eth_call`, `eth_getBalance`, …) to the real Aevum RPC and answers
  `eth_requestAccounts` with the demo payer address. No private key was
  present, so nothing could be signed or sent from that page; every value in
  the screenshot was read live from the chain and matches `demo-proof.json`
  and a direct `getInvoice(1)` RPC read (status = Paid).
- The explorer screenshots are the real Blockscout UI pages — no API fallback
  was needed.
