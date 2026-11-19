# Submission checklist — Aevum Builder Challenge #1

Deadline: **Dec 11, 2026 08:00 UTC (15:00 WIB)** — firm. Submit on DoraHacks:
https://dorahacks.io/hackathon/qday/detail (register + submit on the same page).
Demo Day (top 5 only): **Dec 15, 2026 06:00 UTC**, live video call, 3–5 minutes.

## ⛔ Steps only the user can do (personal accounts)

- [x] **Fund the demo merchant wallet** — DONE 2026-11-20 (WIB): Discord `/faucet`
      landed; merchant verified on-chain holding 1 tQDAY + 5.00 tUSD8.
      (For reference: the on-chain faucet contract is paused and the web faucet
      rejects fresh wallets, see README "Funding".)
- [ ] **DoraHacks account** — register for "Aevum Builder Challenge #1" on
      https://dorahacks.io/hackathon/qday/detail (registration opened Nov 16; the
      same page takes the project submission — no separate earlier cutoff).
- [ ] **GitHub** — push this repo to a **public** repository under the user's account
      (submission requires a public GitHub link; repo is MIT-licensed and ready).
- [ ] **Submit the BUIDL** on the DoraHacks page before Dec 11 08:00 UTC with:
      public GitHub link, live demo URL (or Docker image), project documentation
      (README covers it), track = Invoice Payments.
- [ ] **Demo Day** — if top 5: attend the live call Dec 15 06:00 UTC in person;
      a pre-recorded video is explicitly NOT accepted as a substitute.
- [ ] **Prize eligibility** — prizes are "subject to eligibility checks"; the specific
      checks (possible KYC) are not published. Be ready to complete them if we place.

## 🤖 Steps the agent runs (once the wallet is funded)

- [x] `node scripts/deploy.mjs` → InvoicePay live on Aevum Testnet, `deployment.json`
      — `0x3022A50872AbeD36EfF6e6A4af991FD4Cb7998BB`, deploy tx `0x1f265dce…a5a039`
- [x] `node scripts/demo-flow.mjs` → full flow on-chain, `demo-proof.json`
      — invoice #1 PAID; all 7 txs confirmed `success` on the explorer
- [x] Fill the README "Test evidence" table with the real tx hashes/explorer links
- [x] README addresses table updated with the deployed InvoicePay address
- [ ] Host the dApp (static `app/`, or the included Dockerfile) and note the live URL
- [ ] `node scripts/make-qr.mjs <invoiceId> <liveBaseUrl>` → QR for the demo invoice
- [x] Final pass: screenshots of the dApp + explorer pages for the DoraHacks form
      — DONE 2026-11-19: 5 screenshots in `submission-assets/` (dApp home,
      merchant create-invoice form, invoice #1 pay view in its real PAID state
      rendered from live chain data, explorer contract page, explorer
      pay-invoice tx page)
- [x] `submission-assets/SUBMISSION-PACK.md` — ready-to-paste text for every
      DoraHacks form field; only `[REPO_URL]` and `[LIVE_URL]` placeholders remain

## ✅ Already done (phase 1, 2026-11-19)

- [x] Challenge mechanics verified from qday.io + DoraHacks (deadline, prizes, tracks)
- [x] Chain facts verified on-chain: RPC, chain 44005, tUSD8 address/decimals, faucet state
- [x] `InvoicePay` contract written + compiled (solc, Shanghai target)
- [x] dApp: connect wallet, balances, create invoice → link + QR, confirmation-of-payee → pay
- [x] CLI: compile / deploy / demo-flow / QR scripts with funding gates
- [x] Local end-to-end test PASSED (`npm test`)
- [x] README + this checklist
