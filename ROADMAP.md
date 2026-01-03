# SME-Vault Project Roadmap

**Status**: Frontend Implementation Phase
**Current Design System**: "Industrial Frost" (Monochrome `#050708` / `#CBD5E0`)

## ✅ Phase 1: Smart Contracts (Completed)

_Verified in `programs/nexus-treasury`_

- [x] Vault Initialization Logic (`create_vault`)
- [x] Role Management (Owner, Staff, Approvers)
- [x] Withdrawal Request Flow
- [x] Approval Workflow (M-of-N threshold)
- [x] Time-lock enforcement
- [x] Integration Tests (TypeScript)

## 🚧 Phase 2: Frontend Foundation (Current)

_Location: `sme-vault/app`_

- [x] **Project Initialization**
  - [x] Next.js 14 + TailwindCSS
  - [x] Dependencies (`lucide`, `framer-motion`, `anchor`)
- [x] **Design System Implementation** ("Industrial Frost")
  - [x] Global CSS Variables (Monochrome Dark)
  - [x] Font Stack (Helvetica Now)
  - [x] Layout Wrapper
  - [x] `shadcn/ui` Setup & Override
- [ ] **Wallet Integration**
  - [ ] Wrap app in `SolanaWalletProvider`
  - [ ] Add Connect Button to Sidebar/Header
  - [ ] Authenticate user role (Owner vs Staff vs Public)
- [ ] **Smart Contract Connection**
  - [ ] Copy `idl.json` to frontend
  - [ ] Create `useProgram` hook (Anchor Provider setup)
  - [ ] Fetch Vault Data (Read-only test)

## 📅 Phase 3: Core UI Implementation

- [ ] **Dashboard (Read Mode)**
  - [x] Hero Card (Total Value)
  - [ ] Recent Transactions List (Wait for smart contract data)
  - [ ] Action Bar (Context-aware buttons)
- [ ] **Vault Management (Owner)**
  - [ ] Create Vault Wizard (Lottie animations)
  - [ ] Manage Team Modal (Add/Remove Staff/Approvers)
- [ ] **Operations (Staff/Approvers)**
  - [ ] "New Request" Slide-over Panel
  - [ ] "Approve" Biometric Button Interaction
  - [ ] Withdrawal Execution Trigger

## 🔮 Phase 4: Polish & Launch

- [ ] **Animations**
  - [ ] Page Transitions (Framer Motion)
  - [ ] Micro-interactions (Hover states, Success toasts)
- [ ] **Error Handling**
  - [ ] Toast Notifications (Success/Error)
  - [ ] Empty States
- [ ] **Deployment**
  - [ ] Vercel Deployment configuration

---

## 📂 Key File Locations

- **PRD**: `~/.gemini/antigravity/brain/.../frontend_prd.md`
- **Smart Contract API**: `~/.gemini/antigravity/brain/.../smart_contract_api.md`
- **Frontend App**: `sme-vault/app/`
- **Anchor Program**: `sme-vault/programs/nexus-treasury/`
- **Tests**: `sme-vault/tests/`

## 🧊 Phase 5: Backlog / Undone Features

_Smart Contract enhancements identified in `README.md` but not yet implemented._

### High Priority

- [ ] **Vault Freeze/Unfreeze**: Emergency stop mechanism (`vault.frozen` state exists, but instructions do not).
- [ ] **Daily Spending Limit**: State fields exist (`daily_limit`), but enforcement logic (`daily_spent`, `reset_at`) is missing.
- [ ] **Rejection Workflow**: Allow owners/approvers to explicitly reject requests (currently they just hang in 'Pending').

### Medium Priority

- [ ] **Multi-Token Support**: Currently hardcoded to USDC. Needs `token_mint` in Vault state.
- [ ] **Approval Comments**: Allow approvers to explain _why_ they are signing/rejecting.
- [ ] **Batch Withdrawals**: Executing multiple approved requests in one transaction for efficiency.

### Low Priority / Long Term

- [ ] **Recurring Payments**: Automated payroll streams.
- [ ] **On-Chain Governance**: Voting on changing vault parameters (thresholds, limits).
