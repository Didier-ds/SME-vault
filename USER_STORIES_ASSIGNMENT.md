# User Stories & On-Chain Requirements Document
## SME Vault: Non-Custodial Crypto Treasury Management for SMEs

---

## Part A: User Stories & On-Chain Requirements Document

### 0. Preliminary User Type List (Step 1 — Manual Brainstorm)

Based on the value proposition from Assignment 1 (*"SME Vault gives small businesses the treasury controls of a Fortune 500 company at a fraction of the cost, fully on-chain..."*), the following comprehensive list of potential user types was brainstormed:

**Direct Users (day-to-day use):**
- Business owner / CEO / founder (creates vault, manages team, freezes vault)
- Authorized staff / operations manager (requests and executes withdrawals)
- Approvers / CFO / board members (review and approve/reject withdrawal requests)
- Finance manager / department heads (may request or approve depending on role)
- Treasury manager (may be owner or staff)

**Indirect Users / Beneficiaries:**
- Vendors and contractors (receive payments from vault)
- Employees (if payroll is run through vault)
- Partners and suppliers (recipients of approved withdrawals)
- End customers (benefit from business having secure treasury operations)

**Administrators / Moderators:**
- Platform developer / maintainer (deploys and upgrades smart contracts)
- Support staff (helps users with UI and wallet issues; no on-chain role)
- Community moderator (if forum/Discord exists; no on-chain role)

**Stakeholders (vested interest, may not use product directly):**
- Investors / token holders (if token exists)
- Auditors (review smart contract security and compliance)
- Regulators (interested in audit trails and compliance)
- Partners (exchanges, accounting software) who integrate with the product
- Insurance providers (may require certain controls for coverage)

This list was used as input for AI-assisted prioritization (Step 2).

---

### 1. Core User Personas (Final Prioritized — Steps 2–3)

#### Persona 1: Business Owner (CEO/Founder)

**Name:** Adebayo Okafor  
**Role:** CEO, TechStart Nigeria Ltd.  
**Age:** 38  
**Location:** Lagos, Nigeria  
**Company:** 25 employees, $2M annual revenue, e-commerce platform

**Background:**
- Founded company 5 years ago
- Started accepting crypto payments 2 years ago
- Currently holds $150K USDC in company wallet
- Single point of failure: Only he has access to wallet keys
- Concerned about security after hearing about crypto thefts

**Goals:**
- Secure company crypto treasury with multi-approval controls
- Maintain control without trusting third-party custody
- Enable team to request payments while maintaining oversight
- Have emergency controls to freeze operations if needed

**Pain Points:**
- Currently holds all keys himself (single point of failure)
- No way to delegate payment requests to team
- No approval workflow for large transactions
- Worried about what happens if he's unavailable
- Can't afford $10K+/month enterprise solutions

**Technical Proficiency:** Medium (understands crypto basics, not a developer)

**Quote:** *"I need my team to be able to request payments, but I want multiple people to approve large transactions. And I need to be able to freeze everything instantly if something looks wrong."*

**User Stories:**
- As a business owner, I want to create a vault with configurable approval rules so that I can set up security controls that match my business needs.
- As a business owner, I want to add/remove approvers and staff so that I can manage team access as my organization changes.
- As a business owner, I want to freeze the vault instantly so that I can stop all operations if I detect suspicious activity.
- As a business owner, I want to see all vault activity so that I have full visibility into treasury operations.

---

#### Persona 2: Authorized Staff (Operations Manager)

**Name:** Sarah Chen  
**Role:** Operations Manager, Global Web3 Startup  
**Age:** 29  
**Location:** Remote (Singapore)  
**Company:** 15 employees, DAO structure, $500K treasury

**Background:**
- Manages day-to-day operations
- Needs to request payments for vendors, contractors, expenses
- Currently waits for CEO approval via email/Slack
- Frustrated by delays in payment processing

**Goals:**
- Request withdrawals quickly and easily
- See status of pending requests
- Execute approved withdrawals after delays
- Understand vault limits and rules

**Pain Points:**
- Current process is slow (email → approval → manual transfer)
- No visibility into approval status
- Can't track spending limits
- Unclear when large withdrawals will be executed

**Technical Proficiency:** High (crypto-native, comfortable with wallets)

**Quote:** *"I need to pay vendors quickly, but I also want transparency. I should be able to see who approved what and when funds will be available."*

**User Stories:**
- As a staff member, I want to request withdrawals with amount, destination, and reason so that I can initiate payment requests for business expenses.
- As a staff member, I want to see the status of my withdrawal requests so that I know when they're approved and ready to execute.
- As a staff member, I want to execute approved withdrawals so that I can complete payments after the required approvals and delays.
- As a staff member, I want to see vault limits and rules so that I know what I can request.

---

#### Persona 3: Approver (CFO/Board Member)

**Name:** Michael Rodriguez  
**Role:** CFO, Traditional SME Exploring Crypto  
**Age:** 45  
**Location:** Austin, Texas  
**Company:** 50 employees, consulting firm, considering crypto adoption

**Background:**
- Financial oversight responsibility
- Skeptical about crypto but sees business case
- Needs audit trails for compliance
- Wants controls before committing company funds

**Goals:**
- Review and approve/reject withdrawal requests
- See all pending requests in one place
- Understand request context (amount, destination, reason)
- Have permanent audit trail of all decisions

**Pain Points:**
- No way to review requests before they execute
- No audit trail for compliance
- Concerned about fraud or errors
- Needs time to review large transactions

**Technical Proficiency:** Low (new to crypto, comfortable with traditional finance)

**Quote:** *"I need to approve every significant transaction, and I need a permanent record of who approved what and when. This is non-negotiable for compliance."*

**User Stories:**
- As an approver, I want to see all pending withdrawal requests so that I can review them before approval.
- As an approver, I want to approve or reject requests so that I can control which transactions proceed.
- As an approver, I want to see request details (amount, destination, requester, reason) so that I can make informed decisions.
- As an approver, I want all my approvals recorded on-chain so that there's a permanent audit trail for compliance.

---

### 2. Function Maps

#### Function Map 1: Vault Creation & Management

```
┌─────────────────────────────────────────────────────────────┐
│                    VAULT CREATION & MANAGEMENT                │
└─────────────────────────────────────────────────────────────┘

Owner Actions:
├── Create Vault
│   ├── Input: Name, Token Mint, Approvers, Staff, Thresholds, Limits
│   ├── Validations:
│   │   ├── Name length 1-50 chars
│   │   ├── Approval threshold > 0
│   │   └── All limits > 0
│   ├── On-Chain Actions:
│   │   ├── Create Vault PDA account
│   │   ├── Initialize Vault fields
│   │   └── Create associated token account (owned by Vault PDA)
│   └── Output: Vault Account Created
│
├── Add Approver
│   ├── Input: Approver Wallet Address
│   ├── Validations:
│   │   └── Approvers Vec length < 10
│   ├── On-Chain Actions:
│   │   └── Add to Vault.approvers Vec
│   └── Output: Approver Added
│
├── Remove Approver
│   ├── Input: Approver Wallet Address
│   ├── Validations:
│   │   └── Approver exists in Vec
│   ├── On-Chain Actions:
│   │   └── Remove from Vault.approvers Vec
│   └── Output: Approver Removed
│
├── Add Staff
│   ├── Input: Staff Wallet Address
│   ├── Validations:
│   │   └── Staff Vec length < 20
│   ├── On-Chain Actions:
│   │   └── Add to Vault.staff Vec
│   └── Output: Staff Added
│
├── Remove Staff
│   ├── Input: Staff Wallet Address
│   ├── Validations:
│   │   └── Staff exists in Vec
│   ├── On-Chain Actions:
│   │   └── Remove from Vault.staff Vec
│   └── Output: Staff Removed
│
└── Freeze/Unfreeze Vault
    ├── Input: Freeze Action (true/false)
    ├── Validations: None (owner can always freeze/unfreeze)
    ├── On-Chain Actions:
    │   └── Update Vault.frozen boolean
    └── Output: Vault Frozen/Unfrozen
```

#### Function Map 2: Withdrawal Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    WITHDRAWAL WORKFLOW                       │
└─────────────────────────────────────────────────────────────┘

Staff Actions:
├── Request Withdrawal
│   ├── Input: Amount, Destination, Reason
│   ├── Validations:
│   │   ├── Vault not frozen
│   │   ├── Requester is in Vault.staff
│   │   ├── Amount > 0
│   │   ├── Amount ≤ Vault.tx_limit
│   │   └── Amount ≤ vault token account balance
│   ├── On-Chain Actions:
│   │   ├── Create WithdrawalRequest PDA
│   │   ├── Set status = PENDING
│   │   ├── Initialize approvals Vec (empty)
│   │   ├── If amount ≥ large_withdrawal_threshold:
│   │   │   └── Calculate delay_until = created_at + (delay_hours * 3600)
│   │   └── Increment Vault.withdrawal_count
│   └── Output: Request Created (Status: PENDING)
│
└── Execute Withdrawal
    ├── Input: WithdrawalRequest ID
    ├── Validations:
    │   ├── Request status = APPROVED
    │   ├── approvals.len() ≥ approval_threshold
    │   ├── If delay_until exists: current_time ≥ delay_until
    │   ├── Vault not frozen
    │   └── Vault token account balance ≥ amount
    ├── On-Chain Actions:
    │   ├── Transfer tokens (Vault PDA → Destination)
    │   ├── Update status = EXECUTED
    │   └── Set executed_at timestamp
    └── Output: Withdrawal Executed, Tokens Transferred

Approver Actions:
└── Approve Withdrawal
    ├── Input: WithdrawalRequest ID
    ├── Validations:
    │   ├── Approver is in Vault.approvers
    │   ├── Request status = PENDING
    │   ├── Approver not already in approvals Vec
    │   └── Approver ≠ requester (no self-approval)
    ├── On-Chain Actions:
    │   ├── Add approver to approvals Vec
    │   ├── If approvals.len() ≥ approval_threshold:
    │   │   └── Set status = APPROVED
    └── Output: Request Approved (or Status → APPROVED if threshold met)
```

#### Function Map 3: Access Control & Permissions Matrix

```
┌─────────────────────────────────────────────────────────────┐
│              ACCESS CONTROL & PERMISSIONS                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────┬──────────┬──────────┐
│ Action           │ Owner    │ Staff    │ Approver │
├──────────────────┼──────────┼──────────┼──────────┤
│ Create Vault     │    ✓     │    ✗     │    ✗     │
│ Add Approver     │    ✓     │    ✗     │    ✗     │
│ Remove Approver  │    ✓     │    ✗     │    ✗     │
│ Add Staff        │    ✓     │    ✗     │    ✗     │
│ Remove Staff     │    ✓     │    ✗     │    ✗     │
│ Freeze Vault     │    ✓     │    ✗     │    ✗     │
│ Request Withdraw │    ✗     │    ✓     │    ✗     │
│ Approve Request  │    ✗     │    ✗     │    ✓     │
│ Execute Withdraw │    ✗     │    ✓     │    ✗     │
│ View Activity    │    ✓     │    ✓     │    ✓     │
└──────────────────┴──────────┴──────────┴──────────┘

Note: Owner CANNOT bypass approvals, skip delays, or move funds alone.
```

---

### 2a. Top 1–2 Critical User Stories for POC (Part A, Step 4)

Derived from the function map, the following user interactions are essential to prove core value for a POC:

1. **Critical path 1 — Vault creation and team setup (Owner)**  
   *"As a business owner, I want to create a vault with configurable approval rules and add approvers and staff so that I can set up security controls and team access."*  
   This proves that the system can be initialized with the right roles and limits on-chain.

2. **Critical path 2 — Request → Approve → Execute (Staff + Approver)**  
   *"As a staff member, I want to request a withdrawal; as an approver, I want to approve it; as a staff member, I want to execute it so that payments follow a multi-approval workflow."*  
   This proves the core value: multi-approval and controlled execution without custody.

**Key technical requirements for POC (derived from these interactions):**
- On-chain Vault account (PDA) storing owner, approvers, staff, limits, and frozen state.
- On-chain WithdrawalRequest account (PDA) storing amount, destination, requester, reason, approvals, status, and timestamps (including delay_until).
- Instructions: create_vault, add_approver, add_staff, request_withdrawal, approve_withdrawal, execute_withdrawal; optionally remove_approver, remove_staff, freeze/unfreeze.
- Enforcement: role checks (owner/staff/approver), approval threshold, time delay for large withdrawals, frozen check, balance and limit checks.
- Token account owned by Vault PDA; transfers only via execute_withdrawal with PDA signing.

---

### 3. Potential On-Chain Requirements

#### 3.0 User Stories with Potential On-Chain Requirements (Part D)

For each refined user story below, the potential on-chain requirements needed to support it are listed.

---

**User Story (Owner):** As a business owner, I want to create a vault with configurable approval rules so that I can set up security controls that match my business needs.

**Potential On-Chain Requirements:**
- Need a way to create a new on-chain account (Vault PDA) to hold vault configuration and metadata.
- This account must store the vault creator’s address (owner) for permissions and immutability.
- It must store approval rules: approval threshold, daily limit, per-transaction limit, large-withdrawal threshold, and delay hours.
- It must store lists of approver and staff wallet addresses (with max lengths, e.g., 10 approvers, 20 staff).
- Must initialize a “frozen” flag to false and a creation timestamp.
- Need to create an associated token account owned by the Vault PDA so the vault can hold funds.
- The create-vault instruction must require the owner as signer and validate all inputs (e.g., name length, limits > 0, threshold > 0).

---

**User Story (Owner):** As a business owner, I want to add or remove approvers and staff so that I can manage team access as my organization changes.

**Potential On-Chain Requirements:**
- Need instructions that update the Vault account’s approvers and staff lists.
- Add-approver: append a wallet address to the approvers list; validate list length (e.g., < 10); only vault owner can sign.
- Remove-approver: remove a wallet from the approvers list; validate the address is in the list; only vault owner can sign.
- Add-staff and remove-staff: same pattern for the staff list (e.g., max 20); only vault owner can sign.
- Vault account must be mutable; owner identity must be checked on-chain from the Vault account.

---

**User Story (Owner):** As a business owner, I want to freeze the vault instantly so that I can stop all operations if I detect suspicious activity.

**Potential On-Chain Requirements:**
- Vault account must store a boolean “frozen” field.
- Need an instruction (or two: freeze / unfreeze) that only the vault owner can call to set this field.
- All withdrawal-related instructions (request, approve, execute) must read the vault’s frozen flag and fail if the vault is frozen.
- No way to bypass freeze (e.g., owner cannot move funds without going through approval workflow).

---

**User Story (Owner):** As a business owner, I want to see all vault activity so that I have full visibility into treasury operations.

**Potential On-Chain Requirements:**
- All state-changing actions (vault creation, add/remove approvers/staff, freeze, request/approve/execute withdrawal) must be recorded on-chain (immutable ledger).
- Vault account should store creation time; WithdrawalRequest accounts should store requester, approvers, timestamps, amount, destination, status.
- No special “activity” account is required for POC; activity can be derived by reading chain history and account state (indexer or RPC).

---

**User Story (Staff):** As a staff member, I want to request withdrawals with amount, destination, and reason so that I can initiate payment requests for business expenses.

**Potential On-Chain Requirements:**
- Need a way to create a new on-chain account (WithdrawalRequest PDA) per request.
- Request account must store: vault reference, amount, destination address, requester address, reason (e.g., max length), status (e.g., Pending).
- Instruction must require the requester’s signature and verify the requester is in the Vault’s staff list.
- Must validate: vault not frozen, amount > 0, amount ≤ vault’s per-transaction limit, amount ≤ vault token account balance.
- If amount ≥ large-withdrawal threshold, store a “delay_until” timestamp (created_at + delay_hours); otherwise no delay.
- Vault’s withdrawal count (or similar) may be used for PDA seeds to create unique request accounts.

---

**User Story (Staff):** As a staff member, I want to see the status of my withdrawal requests so that I know when they are approved and ready to execute.

**Potential On-Chain Requirements:**
- WithdrawalRequest account must store status (e.g., Pending, Approved, Executed, Rejected) and be readable by anyone (or by staff/approvers/owner).
- No new on-chain write is required for “seeing” status; front-end or indexer reads existing accounts.

---

**User Story (Staff):** As a staff member, I want to execute approved withdrawals so that I can complete payments after the required approvals and delays.

**Potential On-Chain Requirements:**
- Need an instruction that transfers tokens from the Vault’s token account to the destination (e.g., destination token account).
- Instruction must require the WithdrawalRequest account and validate: status = Approved, number of approvals ≥ approval threshold, and if delay_until is set, current time ≥ delay_until.
- Must validate vault not frozen and vault balance ≥ amount.
- Transfer must be done via CPI with the Vault PDA as signer (vault owns the token account).
- After successful transfer, update request status to Executed and set executed_at timestamp.

---

**User Story (Staff):** As a staff member, I want to see vault limits and rules so that I know what I can request.

**Potential On-Chain Requirements:**
- Vault account must store limits and rules (daily limit, tx_limit, large_withdrawal_threshold, delay_hours, approval_threshold).
- No new instruction; front-end reads the Vault account to display limits and rules.

---

**User Story (Approver):** As an approver, I want to see all pending withdrawal requests so that I can review them before approval.

**Potential On-Chain Requirements:**
- WithdrawalRequest accounts store full request details (amount, destination, requester, reason, status, approvals).
- Pending requests are those with status = Pending; can be enumerated by vault (e.g., by withdrawal_count or separate index). Reading existing accounts is sufficient for POC.

---

**User Story (Approver):** As an approver, I want to approve or reject requests so that I can control which transactions proceed.

**Potential On-Chain Requirements:**
- Approve: instruction that adds the approver’s address to the request’s approvals list; only callable by an address in the Vault’s approvers list; request must be Pending; approver must not already be in approvals and must not be the requester (no self-approval).
- When approvals count reaches the vault’s approval threshold, set request status to Approved.
- Reject: optional instruction or convention (e.g., set status to Rejected); if not in POC, “reject” can mean “do not approve” (no on-chain reject instruction required for minimal POC).

---

**User Story (Approver):** As an approver, I want to see request details (amount, destination, requester, reason) so that I can make informed decisions.

**Potential On-Chain Requirements:**
- WithdrawalRequest account must store amount, destination, requester, and reason; all readable from chain. No additional on-chain requirement beyond account design.

---

**User Story (Approver):** As an approver, I want all my approvals recorded on-chain so that there is a permanent audit trail for compliance.

**Potential On-Chain Requirements:**
- Approve instruction must write the approver’s address into the WithdrawalRequest’s approvals list (and optionally emit or rely on transaction history).
- Blockchain provides immutability; no separate “audit log” account required for POC.

---

#### 3.1 Account Structure Requirements

**Requirement R1: Vault Account (PDA)**
```rust
pub struct Vault {
    pub owner: Pubkey,                    // Vault creator (immutable)
    pub token_mint: Pubkey,               // SPL Token mint (USDC, USDT, etc.)
    #[max_len(50)]
    pub name: String,                     // Vault name
    #[max_len(10)]
    pub approvers: Vec<Pubkey>,           // Max 10 approvers
    #[max_len(20)]
    pub staff: Vec<Pubkey>,               // Max 20 staff
    pub approval_threshold: u8,           // e.g., 2 (in 2-of-3)
    pub daily_limit: u64,                 // USDC amount (6 decimals)
    pub tx_limit: u64,                    // Per-transaction max
    pub large_withdrawal_threshold: u64,  // Triggers time delay
    pub delay_hours: u64,                 // Time delay duration (hours)
    pub frozen: bool,                     // Emergency freeze state
    pub created_at: i64,                  // Unix timestamp
    pub bump: u8,                         // PDA bump seed
    pub withdrawal_count: u64,            // Track withdrawals for PDA seeds
}
```

**Requirement R2: WithdrawalRequest Account (PDA)**
```rust
pub struct WithdrawalRequest {
    pub vault: Pubkey,                    // Parent vault reference
    pub amount: u64,                      // USDC amount (6 decimals)
    pub destination: Pubkey,              // Recipient wallet address
    pub requester: Pubkey,                // Staff member who requested
    #[max_len(200)]
    pub reason: String,                   // Optional description
    #[max_len(10)]
    pub approvals: Vec<Pubkey>,           // Approvers who approved
    pub status: WithdrawalStatus,         // Pending/Approved/Executed/Rejected
    pub created_at: i64,                  // Request timestamp
    pub delay_until: Option<i64>,         // When execution allowed (if large)
    pub executed_at: Option<i64>,        // Execution timestamp
    pub bump: u8,                         // PDA bump seed
}

pub enum WithdrawalStatus {
    Pending,
    Approved,
    Executed,
    Rejected
}
```

#### 3.2 Instruction Requirements

**Requirement R3: Create Vault Instruction**
- **Signer:** Owner (must sign)
- **Inputs:** name (String), approval_threshold (u8), daily_limit (u64), tx_limit (u64), large_withdrawal_threshold (u64), delay_hours (u64)
- **Accounts Required:**
  - Vault PDA (init)
  - Token Mint
  - Vault Token Account (init, owned by Vault PDA)
  - Owner (signer, payer)
  - System Program, Token Program, Associated Token Program
- **Validations:**
  - Name length: 1-50 characters
  - Approval threshold > 0
  - All limits > 0
  - Delay hours ≥ 0
- **On-Chain Actions:**
  - Initialize Vault PDA account with provided configuration
  - Create associated token account owned by Vault PDA
  - Set frozen = false
  - Set created_at = current timestamp
  - Set withdrawal_count = 0
- **Output:** Vault account created, ready for use

**Requirement R4: Request Withdrawal Instruction**
- **Signer:** Staff member (must be in Vault.staff)
- **Inputs:** amount (u64), destination (Pubkey), reason (String)
- **Accounts Required:**
  - WithdrawalRequest PDA (init)
  - Vault (mut)
  - Requester (signer, payer)
  - System Program
- **Validations:**
  - Requester is in Vault.staff
  - Vault not frozen
  - Amount > 0
  - Amount ≤ Vault.tx_limit
  - Amount ≤ vault token account balance
- **On-Chain Actions:**
  - Create WithdrawalRequest PDA
  - Set status = PENDING
  - Initialize approvals Vec (empty)
  - If amount ≥ large_withdrawal_threshold:
    - Calculate delay_until = created_at + (delay_hours * 3600)
  - Else: delay_until = None
  - Increment Vault.withdrawal_count
- **Output:** WithdrawalRequest created with PENDING status

**Requirement R5: Approve Withdrawal Instruction**
- **Signer:** Approver (must be in Vault.approvers)
- **Inputs:** withdrawal_request_id (via accounts)
- **Accounts Required:**
  - WithdrawalRequest (mut)
  - Vault
  - Approver (signer)
- **Validations:**
  - Approver is in Vault.approvers
  - Request status = PENDING
  - Approver not already in approvals Vec
  - Approver ≠ requester (no self-approval)
- **On-Chain Actions:**
  - Add approver to approvals Vec
  - If approvals.len() ≥ approval_threshold:
    - Set status = APPROVED
- **Output:** Request approved (status may change to APPROVED if threshold met)

**Requirement R6: Execute Withdrawal Instruction**
- **Signer:** Anyone (typically staff, pays transaction fees)
- **Inputs:** withdrawal_request_id (via accounts)
- **Accounts Required:**
  - WithdrawalRequest (mut)
  - Vault
  - Vault Token Account (mut, source)
  - Destination Token Account (mut, recipient)
  - Vault Authority (PDA, for signing)
  - Executor (signer)
  - Token Program
- **Validations:**
  - Request status = APPROVED
  - approvals.len() ≥ approval_threshold
  - If delay_until exists: current_timestamp ≥ delay_until
  - Vault not frozen
  - Vault token account balance ≥ amount
- **On-Chain Actions:**
  - Transfer tokens using CPI with Vault PDA as signer
  - Update status = EXECUTED
  - Set executed_at = current timestamp
- **Output:** Withdrawal executed, tokens transferred to destination

**Requirement R7: Add Approver Instruction**
- **Signer:** Owner (must sign)
- **Inputs:** approver (Pubkey)
- **Accounts Required:**
  - Vault (mut)
  - Owner (signer)
- **Validations:**
  - Owner is Vault.owner
  - Approvers Vec length < 10
- **On-Chain Actions:**
  - Add approver to Vault.approvers Vec
- **Output:** Approver added

**Requirement R8: Remove Approver Instruction**
- **Signer:** Owner (must sign)
- **Inputs:** approver (Pubkey)
- **Accounts Required:**
  - Vault (mut)
  - Owner (signer)
- **Validations:**
  - Owner is Vault.owner
  - Approver exists in approvers Vec
- **On-Chain Actions:**
  - Remove approver from Vault.approvers Vec
- **Output:** Approver removed

**Requirement R9: Add Staff Instruction**
- **Signer:** Owner (must sign)
- **Inputs:** staff (Pubkey)
- **Accounts Required:**
  - Vault (mut)
  - Owner (signer)
- **Validations:**
  - Owner is Vault.owner
  - Staff Vec length < 20
- **On-Chain Actions:**
  - Add staff to Vault.staff Vec
- **Output:** Staff added

**Requirement R10: Remove Staff Instruction**
- **Signer:** Owner (must sign)
- **Inputs:** staff (Pubkey)
- **Accounts Required:**
  - Vault (mut)
  - Owner (signer)
- **Validations:**
  - Owner is Vault.owner
  - Staff exists in staff Vec
- **On-Chain Actions:**
  - Remove staff from Vault.staff Vec
- **Output:** Staff removed

**Requirement R11: Freeze/Unfreeze Vault Instruction**
- **Signer:** Owner (must sign)
- **Inputs:** freeze_action (bool) - Note: This may be implemented as separate freeze/unfreeze instructions
- **Accounts Required:**
  - Vault (mut)
  - Owner (signer)
- **Validations:**
  - Owner is Vault.owner
- **On-Chain Actions:**
  - Update Vault.frozen boolean
- **Output:** Vault frozen/unfrozen

#### 3.3 Security Requirements

**Requirement R12: Role-Based Access Control**
- Owner can only modify vault configuration (approvers, staff, limits, freeze)
- Owner CANNOT bypass approval requirements
- Owner CANNOT skip time delays
- Owner CANNOT move funds without approvals
- Staff can only request and execute withdrawals
- Staff CANNOT approve own requests
- Approvers can only approve/reject requests
- Approvers CANNOT request or execute withdrawals

**Requirement R13: Approval Threshold Enforcement**
- Withdrawal requests require N approvals (where N = approval_threshold)
- Same approver cannot approve twice (checked via approvals Vec)
- Approvals are permanent (cannot be revoked)
- Status automatically changes to APPROVED when threshold met

**Requirement R14: Time Delay Enforcement**
- If withdrawal amount ≥ large_withdrawal_threshold, execution requires delay
- Delay duration = delay_hours from vault configuration
- delay_until = created_at + (delay_hours * 3600 seconds)
- Execution blocked until current_timestamp ≥ delay_until
- Delay cannot be bypassed, even by owner
- Delay only applies to large withdrawals (below threshold = no delay)

**Requirement R15: Limit Enforcement**
- Per-transaction limit: Amount ≤ tx_limit (enforced on request creation)
- Daily limit: Sum of withdrawals in 24h ≤ daily_limit (Note: Current implementation tracks withdrawal_count but may need daily limit tracking)
- Limits cannot be bypassed
- Limits apply to all users, including owner
- Balance check: Amount ≤ vault token account balance (enforced on execution)

**Requirement R16: Freeze Mechanism**
- Owner can freeze vault instantly
- When frozen: All withdrawals blocked (request, approve, execute all check frozen status)
- Freeze state is on-chain and cannot be bypassed
- Owner can unfreeze when threat passes
- Freeze affects all operations, not just withdrawals

**Requirement R17: Audit Trail**
- All actions recorded on-chain (immutable)
- WithdrawalRequest stores: requester, approvers, timestamps, amounts, destination
- Vault stores: owner, creation time, configuration
- Full history accessible via blockchain explorer
- Status changes are permanent (PENDING → APPROVED → EXECUTED)

**Requirement R18: PDA Ownership & Security**
- Vault PDA owns the token account (not a human wallet)
- No private keys exist for vault funds
- All transfers must go through smart contract
- Cannot bypass contract via direct token transfer
- PDA seeds: [b"vault", owner.key(), name.as_bytes()]
- WithdrawalRequest PDA seeds: [b"withdrawal", vault.key(), withdrawal_count.to_le_bytes()]

**Requirement R19: Self-Approval Prevention**
- Approver cannot approve their own request
- Validation: approver.key() != withdrawal.requester
- Prevents conflict of interest

**Requirement R20: Atomic Transactions**
- All state changes happen atomically
- Token transfers use CPI (Cross-Program Invocation) with PDA signing
- If any validation fails, entire transaction reverts
- Prevents partial state updates

---

## Part C: Granularity & Clarity Refinement Log

Final manual review was applied to every user story and function from Part B. Below is the refinement log: for each change, the "Before" and "After" are noted with a short rationale.

| # | Before | After | Rationale |
|---|--------|-------|-----------|
| 1 | "As a business owner, I want to add/remove approvers and staff so that I can manage team access as my organization changes." (single story) | Split into two stories: (1) add or remove approvers, (2) add or remove staff. | **Atomicity:** Adding approvers and adding staff are distinct actions; keeping them as separate stories makes implementation and testing clearer. |
| 2 | "As a staff member, I want to execute approved withdrawals so that I can complete payments after the required approvals and delays." | Kept as-is. | **Clarity:** Single action (execute); outcome is clear. No split needed. |
| 3 | "As an approver, I want to approve or reject requests so that I can control which transactions proceed." | Kept "approve"; noted that "reject" may be a separate instruction or deferred for POC. | **Granularity:** Approve and reject are two actions; for POC we prioritized approve. Reject documented as optional. |
| 4 | "As a business owner, I want to see all vault activity so that I have full visibility into treasury operations." | Kept as-is. | **De-jargon:** "Vault activity" is plain language; no technical terms. Outcome (visibility) is clear. |
| 5 | Function map: "On-Chain Actions: Create Vault PDA account" | Function map uses "Create Vault account" in user-facing summary; technical spec keeps "PDA." | **De-jargon:** Stakeholder-facing text avoids "PDA"; technical appendix retains precise terminology. |
| 6 | "User signs up and creates a profile" (N/A — not in our stories) | N/A | Our stories did not combine sign-up and profile; no such combined story existed. |
| 7 | Owner story: "add/remove approvers and staff" as one bullet | Refined to two distinct bullets: add/remove approvers; add/remove staff. | **No overlap:** Prevents confusion between approver list and staff list; each maps to separate on-chain instructions. |
| 8 | "As a staff member, I want to see the status of my withdrawal requests" | "As a staff member, I want to see the status of my withdrawal requests so that I know when they're approved and ready to execute." | **Clarity of outcome:** Added "so that" clause to make the benefit explicit for non-technical stakeholders. |
| 9 | "As an approver, I want all my approvals recorded on-chain so that there's a permanent audit trail for compliance." | Kept as-is. | **De-jargon:** "On-chain" is necessary for domain; "audit trail" and "compliance" are standard business terms. |

**Summary:** Refinements focused on (1) splitting owner team-management into approver vs. staff for atomicity, (2) clarifying outcomes with "so that" clauses where missing, (3) keeping stakeholder language free of jargon (e.g., "PDA") in the main document, and (4) treating approve vs. reject as distinct for granularity while prioritizing approve for POC.

---

## Part B: Process Appendix

### Initial Project Overview

SME Vault is a non-custodial, smart contract-based treasury management system built on Solana that enables small and medium enterprises (SMEs) to manage their cryptocurrency funds with enterprise-grade security controls. The platform provides multi-approval workflows, programmable spending limits, time-delayed withdrawals for large amounts, and emergency freeze capabilities—all enforced on-chain without requiring third-party custody.

---

### Part A: User Personas Development

#### Step 1: Preliminary User Type List (Manual Brainstorm)

**Action:** Based on the value proposition from Assignment 1, a comprehensive list of potential user types was brainstormed (see **Part A, Section 0** in the main document). Categories used: Direct Users, Indirect Users/Beneficiaries, Administrators/Moderators, Stakeholders.

**Output:** List of 15+ user types including business owner, staff, approvers, vendors, platform developer, auditors, regulators, partners, etc.

---

#### Step 2: AI-Assisted User Prioritization

**AI Prompt:**
```
My project's value proposition is: "SME Vault gives small businesses the treasury controls of a Fortune 500 company at a fraction of the cost, fully on-chain. We solve the critical security gap for SMEs managing crypto: traditional wallets are single points of failure with no approval workflows, while enterprise solutions are prohibitively expensive. Our non-custodial smart contract platform enforces multi-approval workflows, spending limits, time delays, and emergency controls that cannot be bypassed, providing bank-level security without trusting third parties."

Here is a brainstormed list of all potential user types:
- Direct: Business owner/CEO/founder, Authorized staff/operations manager, Approvers/CFO/board members, Finance manager/department heads, Treasury manager
- Indirect: Vendors and contractors, Employees, Partners and suppliers, End customers
- Administrators: Platform developer/maintainer, Support staff, Community moderator
- Stakeholders: Investors/token holders, Auditors, Regulators, Partners (exchanges, accounting software), Insurance providers

Based on the value proposition, which 2-5 of these user types are the most critical to focus on for an initial Proof-of-Concept? For each user you recommend, provide a brief rationale explaining why they are essential for proving the project's core value.
```

**AI Output (summary):**
```
Recommended 3 critical user types for POC:

1. **Business Owner (CEO/Founder)** — Essential because the owner creates the vault, sets rules, and holds emergency controls (freeze). Without the owner, there is no vault or governance. Core value (configurable, non-custodial controls) cannot be demonstrated without this role.

2. **Authorized Staff (Operations Manager)** — Essential because they initiate withdrawal requests and execute approved withdrawals. The multi-approval workflow is meaningless without someone requesting and someone executing. Staff proves that delegation and operational use work on-chain.

3. **Approver (CFO/Board Member)** — Essential because multi-approval is the core differentiator. Without approvers, the system collapses to single-signature or owner-only, which does not prove "bank-level" or "enterprise-grade" controls. Approvers also drive the need for audit trail and compliance.

Rationale for excluding others for POC: Vendors/beneficiaries only receive funds (no on-chain interaction with our program). Administrators (developer) are you; support/moderators have no on-chain role. Stakeholders (auditors, regulators) consume data but don't use the product. Focusing on Owner, Staff, and Approver proves the full loop: create vault → request → approve → execute.
```

**Manual Action & Output:**
- **Decision:** Accepted the AI recommendation of exactly **3** key user types: **Business Owner**, **Authorized Staff**, **Approver**.
- **Rationale:** Agreed that the POC must prove the full value loop: (1) owner sets up vault and team, (2) staff requests and executes, (3) approvers approve. Adding a fourth or fifth user (e.g., vendor, auditor) does not add a new critical interaction for the smart contract; it can be deferred. Kept the list at 3 to keep POC scope tight.

**Final Prioritized List:** Business Owner, Authorized Staff (Staff), Approver.

---

#### Step 3: Core Function Mapping

**AI Prompt:**
```
For a project with this value proposition: "SME Vault gives small businesses the treasury controls of a Fortune 500 company at a fraction of the cost, fully on-chain. Multi-approval workflows, spending limits, time delays, and emergency controls enforced on-chain without third-party custody."

Focusing on these prioritized user types: (1) Business Owner, (2) Authorized Staff, (3) Approver — help map out the key functions or interactions each user would need to perform.
```

**AI Output (summary):**
```
Owner: Create vault (name, token, approvers, staff, thresholds, limits); Add/remove approvers; Add/remove staff; Freeze/unfreeze vault; View vault activity/settings.
Staff: Request withdrawal (amount, destination, reason); View status of requests; Execute approved withdrawals (after delay if applicable); View vault limits/rules.
Approver: View pending withdrawal requests; Approve or reject requests; View request details (amount, destination, requester, reason); Have approvals recorded on-chain for audit.
```

**Output:** This mapping was used to build the **Function Maps** in Part A (Vault Creation & Management, Withdrawal Workflow, Access Control & Permissions Matrix) and the **user stories** under each persona.

**Personal Reflection:** The function map made the split between "vault configuration" (owner) and "withdrawal lifecycle" (staff + approver) explicit. It also confirmed that "view" actions (activity, status, limits, details) are read-only and can be satisfied by reading on-chain state rather than new instructions.

---

#### Step 4: Deriving Core POC Requirements

**Manual Task:** From the function map, the top 1–2 critical interaction paths for POC were identified: (1) Owner creates vault and configures team (approvers, staff), (2) Staff requests withdrawal → Approver(s) approve → Staff executes withdrawal.

**AI Prompt:**
```
Based on these top 1-2 critical user interactions for an SME treasury vault on Solana:

1. Owner creates a vault with configurable approval rules and adds approvers and staff.
2. Staff requests a withdrawal; one or more approvers approve it; staff executes the withdrawal so that funds move only after multi-approval and any time delay.

What are the key technical requirements needed to build a proof-of-concept (on-chain program, e.g., Anchor)?
```

**AI Output (summary):**
```
- Vault account (PDA) storing: owner, approvers list, staff list, approval threshold, limits (daily, per-tx, large-withdrawal threshold), delay hours, frozen flag, creation time.
- WithdrawalRequest account (PDA) per request: vault ref, amount, destination, requester, reason, approvals list, status (Pending/Approved/Executed/Rejected), created_at, delay_until, executed_at.
- Instructions: create_vault (init Vault + associated token account), add_approver, add_staff, request_withdrawal (init WithdrawalRequest, validate staff, limits, balance), approve_withdrawal (add approver to list, check threshold), execute_withdrawal (transfer from vault ATA to destination, validate status, threshold, delay, frozen, balance).
- Access control: only owner for vault config; only staff for request/execute; only approvers for approve; enforce threshold and delay on-chain; reject if frozen.
- Token account owned by Vault PDA; transfers only via program with PDA signing.
```

**Output:** This list was refined into the **Key technical requirements for POC** in **Part A, Section 2a** and the detailed **Potential On-Chain Requirements (R1–R20)** in Part A, Section 3.

---

### Part B (Assignment): Adversarial Analysis & Granularity Check

#### Critique & Refine User Stories / Requirements

**Adversarial AI Prompt:**
```
Review my core user functions/stories and requirements.

Value proposition: "SME Vault gives small businesses the treasury controls of a Fortune 500 company at a fraction of the cost, fully on-chain. Multi-approval workflows, spending limits, time delays, and emergency controls enforced on-chain without third-party custody."

Core user functions/stories:
- Owner: Create vault with configurable approval rules; Add/remove approvers and staff; Freeze vault; View vault activity.
- Staff: Request withdrawals (amount, destination, reason); See status of requests; Execute approved withdrawals; See vault limits/rules.
- Approver: See pending withdrawal requests; Approve or reject requests; See request details; Have approvals recorded on-chain for audit.

Key technical requirements (summary): Vault PDA (owner, approvers, staff, limits, frozen); WithdrawalRequest PDA (amount, destination, requester, reason, approvals, status, delay_until); Instructions: create_vault, add/remove approver/staff, request_withdrawal, approve_withdrawal, execute_withdrawal, freeze/unfreeze; Role-based access; threshold and time-delay enforcement.

Considering my project's refined value proposition, do these stories truly hit the mark? Are the requirements granular enough to map to specific technical components (e.g., account schemas, instructions, program logic)? What's missing or unclear?
```

**AI Critique (summary):**
```
Strengths: Stories align with value prop; roles are clear; request → approve → execute is the right core loop.

Suggestions and gaps:
1. Granularity: "Add/remove approvers and staff" is two distinct operations (approvers vs staff) and four instructions (add approver, remove approver, add staff, remove staff). Split user stories or bullets so each maps to one instruction.
2. Reject path: "Approve or reject" — if reject is in scope, need an on-chain reject instruction (e.g., set status to Rejected) and clear behavior (e.g., request cannot later be approved). If POC defers reject, say so explicitly.
3. Daily limit: Requirements mention daily_limit on Vault; need to clarify whether POC enforces "sum of withdrawals in last 24h ≤ daily_limit" (requires tracking time-windowed usage) or defers it. If deferred, remove from POC requirements to avoid scope creep.
4. Read-only "view" stories: "View activity," "see status," "see limits" — no new on-chain write is required; clarify that these are satisfied by reading existing accounts/chain. Prevents over-engineering.
5. Edge cases: What if vault has zero approvers or zero staff? create_vault should allow initial creation with empty lists; add_approver/add_staff used to populate. Document so implementation doesn't assume non-empty.
6. Security: Self-approval (approver = requester) must be forbidden on-chain; requirement is present but worth calling out in story-level requirements.
```

**Analysis of feedback:**
- **Valid and adopted:** (1) Split add/remove approvers vs add/remove staff in stories and refinement log. (2) Reject: documented as optional for POC; approve is required. (3) Daily limit: kept in Vault schema for future use; POC enforcement deferred (only tx_limit and balance enforced on request/execute). (4) View stories: explicitly noted in Part D that "see status/limits/activity" require no new instructions. (5) Empty approvers/staff: allowed at creation; add instructions used to populate. (6) Self-approval: already in R19; kept.
- **Not adopted:** Changing scope of daily_limit to full enforcement in POC (would require time-window accounting); kept as config-only for POC.

**Refinements made:**
- Owner stories: Refined to separate "add/remove approvers" and "add/remove staff" for atomicity and mapping to instructions (see Part C Refinement Log).
- Approver story: Kept "approve or reject"; documented that reject can be a separate instruction or deferred.
- Requirements: Added explicit note that "view" stories are satisfied by reading existing accounts; daily_limit enforcement deferred to post-POC; self-approval prevention already in R19.

**Documentation:** AI critique, analysis, and refinements documented above; Part C Refinement Log in main document captures before/after for each story-level change.

---

### Part C (Assignment): Granularity & Clarity Refinement

Final manual review was performed on every user story (de-jargon, granularity, atomicity, clarity, no overlap). The **Part C Refinement Log** is in the main document under **Part C: Granularity & Clarity Refinement Log**. No additional appendix text is required for this step.

---

### Part D (Assignment): Defining Potential On-Chain Requirements

**Action:** For each refined user story from Part C, a bulleted list of potential on-chain requirements was produced. This is the brainstorming step that translates user actions into technical needs.

**Output:** The main document **Section 3.0 (User Stories with Potential On-Chain Requirements)** contains each user story followed by its bulleted on-chain requirements. The consolidated technical specification (account structures, instructions, security) remains in **Sections 3.1–3.3 (R1–R20)**.

**Personal Reflection:** Mapping each story to bullets forced clarity on what "view" stories need (read-only; no new accounts) and what "create/update" stories need (new PDAs, instructions, validations). The exercise also confirmed that reject, daily limit enforcement, and remove_approver/remove_staff are scoped as optional or deferred for POC to keep the deliverable focused.

---

## Appendix: Research Sources

### User Research
- Assignment 1 (Project Proposal) value proposition and target markets used as input for user-type brainstorming and prioritization.
- Personas (Owner, Staff, Approver) informed by PROJECT_BRIEF.md user roles and capstone target segments (Nigerian/African SMEs, Web3 startups, traditional SMEs).

### Technical Documentation
- Solana Program Library (SPL) Token Documentation: https://spl.solana.com/token
- Anchor Framework Documentation: https://www.anchor-lang.com/
- Solana Account Model: https://docs.solana.com/developing/programming-model/accounts
- Program Derived Addresses (PDAs): https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses
- SME-vault program source: `programs/sme-vault/src/` (state, instructions) for alignment of requirements with implementation.

### Industry Standards
- Multi-signature and approval workflows: separation of duties (request ≠ approve ≠ execute); audit trail for compliance; time delays for large transactions (common in custody/treasury).

---

**Document Status:** Complete for Assignment 2  
**Last Updated:** February 2025  
**Next Steps:** Use this document as input for Assignment 3 (architectural design and diagrams); export to PDF for submission (Part A: main document Sections 0–3; Part B: Process Appendix + Part C Refinement Log + Research Sources).
