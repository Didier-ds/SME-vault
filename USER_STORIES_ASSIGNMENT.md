# User Stories & On-Chain Requirements Document
## SME Vault: Non-Custodial Crypto Treasury Management for SMEs

---

## Part A: User Stories & On-Chain Requirements Document

### 1. Core User Personas

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

### 3. Potential On-Chain Requirements

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

## Part B: Process Appendix

### Initial Project Overview

SME Vault is a non-custodial, smart contract-based treasury management system built on Solana that enables small and medium enterprises (SMEs) to manage their cryptocurrency funds with enterprise-grade security controls. The platform provides multi-approval workflows, programmable spending limits, time-delayed withdrawals for large amounts, and emergency freeze capabilities—all enforced on-chain without requiring third-party custody.

---

### Part A: User Personas Development

#### Step 1: Core User Personas

**AI Prompt:**
```
[TO BE COMPLETED - Your prompt to AI asking for help with user personas based on the three user roles: Owner, Staff, and Approver]
```

**AI Output:**
```
[TO BE COMPLETED - Full AI response]
```

**Manual Research Notes:**
```
[TO BE COMPLETED - Your research on target users, interviews, surveys, user feedback, market research]
```

**Final Personas:**
```
[TO BE COMPLETED - Your refined personas with rationale for changes from AI output]
```

**Personal Reflection:**
```
[TO BE COMPLETED - What you learned, what changed, why, how personas inform requirements]
```

---

### Part B: Function Maps Development

#### Step 2: Function Maps

**AI Prompt:**
```
[TO BE COMPLETED - Your prompt to AI asking for help with function maps/workflows for vault creation, withdrawal process, and access control]
```

**AI Output:**
```
[TO BE COMPLETED - Full AI response]
```

**Manual Analysis:**
```
[TO BE COMPLETED - Your analysis of workflows, edge cases, state transitions, error handling]
```

**Final Function Maps:**
```
[TO BE COMPLETED - Your refined function maps with rationale for changes]
```

**Personal Reflection:**
```
[TO BE COMPLETED - What you learned, what changed, why, how function maps inform on-chain requirements]
```

---

### Part C: On-Chain Requirements Development

#### Step 3: Potential On-Chain Requirements

**AI Prompt:**
```
[TO BE COMPLETED - Your prompt to AI asking for help with on-chain requirements based on Solana/Anchor constraints, security considerations, and the function maps]
```

**AI Output:**
```
[TO BE COMPLETED - Full AI response]
```

**Technical Analysis:**
```
[TO BE COMPLETED - Your analysis of Solana/Anchor constraints, PDA architecture, account size limits, security considerations, gas optimization]
```

**Final Requirements List:**
```
[TO BE COMPLETED - Your refined requirements with rationale for changes]
```

**Personal Reflection:**
```
[TO BE COMPLETED - What you learned, what changed, why, how requirements evolved from personas and function maps]
```

---

### Part D: Refinement Process

#### Step 4: Adversarial Analysis & Refinement

**Adversarial AI Prompt:**
```
[TO BE COMPLETED - Your prompt asking AI to critique personas, function maps, and requirements for gaps, edge cases, security issues, or missing functionality]
```

**AI Critique:**
```
[TO BE COMPLETED - Full AI critique]
```

**Your Analysis:**
```
[TO BE COMPLETED - Which critiques are valid, which to address, which are overstated]
```

**Refinements Made:**
```
[TO BE COMPLETED - What changed and why, before/after comparisons]
```

**Final Reflection:**
```
[TO BE COMPLETED - How the process improved your document, what you learned, what you'd do differently]
```

---

## Appendix: Research Sources

### User Research
- [TO BE COMPLETED - Interviews, surveys, user feedback, market research]

### Technical Documentation
- Solana Program Library (SPL) Token Documentation: https://spl.solana.com/token
- Anchor Framework Documentation: https://www.anchor-lang.com/
- Solana Account Model: https://docs.solana.com/developing/programming-model/accounts
- Program Derived Addresses (PDAs): https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses
- [ADD MORE - Technical references]

### Industry Standards
- [TO BE COMPLETED - Relevant standards, best practices, security guidelines]


**Document Status:** In Progress  
**Last Updated:** [Date]  
**Next Steps:** Complete Process Appendix sections documenting your journey
