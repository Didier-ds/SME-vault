# SME Vault - Project Brief

## 📋 Executive Summary

**Project Name:** SME Vault  
**Tagline:** "Where Security Meets Collaboration"  
**Category:** SME Crypto Treasury Management Platform  
**Target Market:** Small and Medium Enterprises (10-500 employees)  
**Primary Use Case:** Non-custodial, multi-approval crypto treasury management

---

## 🎯 Problem Statement

### Current Pain Points

**For Small Businesses Managing Crypto:**
1. **Single Point of Failure:** Traditional crypto wallets require one person to hold private keys
2. **No Approval Workflows:** Anyone with the key can move unlimited funds instantly
3. **Zero Fraud Prevention:** No way to detect or stop suspicious transactions
4. **Lack of Accountability:** No audit trail for who authorized what
5. **No Spending Controls:** Can't set daily limits or per-transaction caps
6. **Emergency Vulnerabilities:** If key holder is unavailable, funds are locked

**Why Existing Solutions Don't Work:**
- **Multisig wallets** (Gnosis Safe, etc.) lack programmable rules, limits, and time delays
- **Custodial services** require trusting third parties with funds
- **Enterprise solutions** (Fireblocks, Copper) cost $10K+/month, unsuitable for SMEs
- **Basic wallets** (MetaMask, Phantom) have zero business controls

---

## 💡 Our Solution

### What is SME Vault?

A **non-custodial, smart contract-based treasury management system** that gives small businesses bank-level security controls over their crypto funds, entirely on-chain, with no third-party custody.

### Core Value Proposition

**"We give small businesses the treasury controls of a Fortune 500 company, at a fraction of the cost, fully on-chain."**

### Key Differentiators

1. **Non-Custodial:** Business keeps control; we can't access funds
2. **Programmable Rules:** Set limits, delays, and thresholds that can't be bypassed
3. **Time Delays:** Large withdrawals require waiting periods for fraud detection
4. **Role Separation:** Request ≠ Approve ≠ Execute = multiple checkpoints
5. **Emergency Freeze:** Owner can instantly halt all operations
6. **Full Audit Trail:** Every action recorded permanently on-chain
7. **Affordable:** ~$50/month vs $10K+/month enterprise solutions

---

## 🏗️ Technical Architecture

### Blockchain Layer
- **Network:** Solana (high speed, low fees)
- **Framework:** Anchor (Rust-based smart contracts)
- **Token Standard:** SPL Token (USDC, USDT, etc.)
- **Account Model:** Program Derived Addresses (PDAs) - no private keys

### Frontend Layer
- **Framework:** Next.js 14 (React with App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand
- **Wallet Integration:** Solana Wallet Adapter (Phantom, Solflare)

### Data Flow
```
User → Wallet (Signs) → Frontend → Solana RPC → Smart Contract → PDA Accounts
```

### Security Model
- **Trust Boundary:** Everything off-chain is untrusted
- **Enforcement:** Smart contract validates all rules on-chain
- **Ownership:** Vault PDA owns token accounts (no human has private key)
- **Validation:** Every transaction checked against: limits, approvals, delays, freeze status

---

## 👥 User Roles

### Business Owner
**Who:** CEO, Founder, Managing Director  
**Powers:** 
- Create vault
- Add/remove approvers and staff
- Freeze/unfreeze vault
- Change limits and thresholds
- View all activity

**Limitations:**
- CANNOT bypass approval requirements
- CANNOT skip time delays
- CANNOT move funds alone

### Authorized Staff
**Who:** Operations Manager, Finance Manager, Department Heads  
**Powers:**
- Request withdrawals
- Execute approved withdrawals (after delay)
- View vault status

**Limitations:**
- CANNOT approve own requests
- CANNOT bypass limits
- CANNOT freeze vault

### Approvers
**Who:** CFO, Board Members, Senior Management  
**Powers:**
- Review withdrawal requests
- Approve or reject requests
- View all pending requests

**Limitations:**
- CANNOT request withdrawals
- CANNOT execute transfers
- CANNOT approve same request twice

---

## 🔄 Core Workflows

### 1. Vault Creation (Owner)
```
Owner → Connect Wallet
     → Create Vault Form
     → Enter Configuration:
         - Vault name
         - Approvers (wallet addresses)
         - Staff (wallet addresses)
         - Threshold (e.g., 2 of 3)
         - Daily limit
         - Per-transaction limit
         - Large withdrawal threshold
         - Time delay (hours)
     → Sign Transaction
     → Vault Created (PDA generated)
```

### 2. Withdrawal Request (Staff)
```
Staff → Connect Wallet
     → Select Vault
     → Request Withdrawal
     → Enter Details:
         - Amount
         - Destination address
         - Reason (optional)
     → System Validates:
         ✓ Vault not frozen
         ✓ Amount ≤ transaction limit
         ✓ Amount ≤ vault balance
     → Sign Transaction
     → Request Created (Status: PENDING)
     → Approvers Notified
```

### 3. Approval Process (Approvers)
```
Approver → Connect Wallet
        → View Pending Requests
        → Review Request:
            - Amount, destination, requester
            - Current approvals (e.g., "1 of 2")
            - Reason/description
        → Decision:
            APPROVE → Sign → Increment approval count
            REJECT → Sign → Mark as rejected
        → If threshold met:
            Status: PENDING → APPROVED
            If large amount → Delay timer starts
```

### 4. Execution (Staff or Anyone)
```
Executor → Connect Wallet
        → View Approved Requests
        → Check Eligibility:
            ✓ Approval threshold met
            ✓ Time delay passed (if applicable)
            ✓ Vault not frozen
        → Click Execute
        → Sign Transaction
        → Smart Contract:
            - Final validation
            - Deduct from vault balance
            - Transfer USDC to destination
        → Status: EXECUTED
```

### 5. Emergency Freeze (Owner)
```
Owner → Connect Wallet
     → Click "Freeze Vault"
     → Confirm Action
     → Sign Transaction
     → All withdrawals blocked immediately
     → Team notified
     → Can unfreeze when threat passes
```

---

## 📊 Data Models

### Vault Account (PDA)
```rust
pub struct Vault {
    pub owner: Pubkey,                    // Vault creator
    pub name: String,                     // "TechStart Treasury"
    pub approvers: Vec<Pubkey>,           // Up to 10 approvers
    pub staff: Vec<Pubkey>,               // Up to 20 staff
    pub approval_threshold: u8,           // e.g., 2 (in 2-of-3)
    pub daily_limit: u64,                 // USDC (6 decimals)
    pub tx_limit: u64,                    // Per-transaction max
    pub large_withdrawal_threshold: u64,  // Triggers delay
    pub delay_hours: u64,                 // Time delay duration
    pub frozen: bool,                     // Emergency freeze state
    pub created_at: i64,                  // Unix timestamp
    pub bump: u8,                         // PDA bump seed
}
```

### Withdrawal Request Account (PDA)
```rust
pub struct WithdrawalRequest {
    pub vault: Pubkey,                    // Parent vault
    pub amount: u64,                      // USDC amount
    pub destination: Pubkey,              // Recipient address
    pub requester: Pubkey,                // Who requested
    pub reason: String,                   // Optional description
    pub approvals: Vec<Pubkey>,           // Who approved
    pub approvals_count: u8,              // Current count
    pub status: WithdrawalStatus,         // Enum: Pending/Approved/Executed/Rejected
    pub created_at: i64,                  // Request timestamp
    pub delay_until: Option<i64>,         // When execution allowed
    pub executed_at: Option<i64>,         // Execution timestamp
    pub bump: u8,                         // PDA bump
}

pub enum WithdrawalStatus {
    Pending,
    Approved,
    Executed,
    Rejected,
}
```

### Token Account (SPL)
```
Standard SPL Token Account owned by Vault PDA
- Owner: Vault PDA (controlled by smart contract)
- Mint: USDC mint address
- Amount: Balance in smallest units (lamports)
```

---

## 🔐 Security Architecture

### Smart Contract Validations

**Every instruction validates:**
1. **Signer Authority:** Is signer authorized for this action?
2. **Vault State:** Is vault frozen?
3. **Role Permissions:** Does role match action?
4. **Limit Compliance:** Within configured limits?
5. **Threshold Met:** Enough approvals?
6. **Time Delay:** Has delay period passed?
7. **Balance Check:** Sufficient funds?

### Attack Prevention

| Attack Vector | Protection Mechanism |
|---------------|---------------------|
| Single compromised key | Multi-approval threshold |
| Insider collusion | Time delays create detection windows |
| Operational errors | Approval process catches mistakes |
| Unauthorized access | On-chain role verification |
| Front-running | Atomic transactions |
| Reentrancy | Anchor's built-in protections |
| Overflow/Underflow | Rust's type safety |
| UI manipulation | Smart contract is source of truth |

---

## 🎯 Success Metrics

### Technical KPIs
- Smart contract deployment: Devnet → Mainnet
- Zero critical vulnerabilities in audit
- 99.9% uptime on frontend
- <2 second transaction confirmation

### Product KPIs
- 10 beta customers (Month 3)
- 100 active vaults (Month 6)
- $1M+ in total value locked (Month 6)
- 500+ monthly active users (Month 9)

### Business KPIs
- 50 paying customers @ $50/month (Month 6)
- $2,500 MRR (Monthly Recurring Revenue)
- 20% month-over-month growth
- <$100 customer acquisition cost

---

## 🚀 Development Phases

### Phase 1: Smart Contracts
**Deliverables:**
- [ ] Vault creation instruction
- [ ] Add/remove approvers & staff
- [ ] Request withdrawal instruction
- [ ] Approve withdrawal instruction
- [ ] Execute withdrawal instruction
- [ ] Freeze/unfreeze instructions
- [ ] Comprehensive test suite (80%+ coverage)
- [ ] Deploy to Devnet

### Phase 2: Core Frontend
**Deliverables:**
- [ ] Wallet connection
- [ ] Create vault flow
- [ ] Vault selector/switcher
- [ ] Request withdrawal form
- [ ] Approval interface
- [ ] Execute withdrawal button
- [ ] Basic dashboard

### Phase 3: Polish & Features
**Deliverables:**
- [ ] Role-based UI rendering
- [ ] Loading states & error handling
- [ ] Toast notifications
- [ ] Activity feed
- [ ] Settings management
- [ ] Mobile responsive design

### Phase 4: Testing & Audit
**Deliverables:**
- [ ] End-to-end testing
- [ ] Security audit (external)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation

### Phase 5: Launch
**Deliverables:**
- [ ] Mainnet deployment
- [ ] Beta user onboarding
- [ ] Support documentation
- [ ] Marketing website
- [ ] Customer support setup

**Note:** Work at your own pace - these phases are guidelines, not deadlines!

---

## 💰 Business Model

### Pricing Tiers

**Free Tier** (Beta)
- 1 vault
- Up to 3 approvers
- Up to 5 staff
- Basic features
- Community support

**Pro Tier** ($50/month)
- Unlimited vaults
- Unlimited approvers/staff
- Advanced features
- Email support
- API access

**Enterprise Tier** (Custom)
- White-label option
- Dedicated support
- SLA guarantees
- Custom integrations
- Training sessions

### Revenue Projections (Year 1)

| Month | Customers | MRR | ARR |
|-------|-----------|-----|-----|
| 3 | 10 | $500 | $6,000 |
| 6 | 50 | $2,500 | $30,000 |
| 9 | 120 | $6,000 | $72,000 |
| 12 | 200 | $10,000 | $120,000 |

---

## 🌍 Go-to-Market Strategy

### Target Customer Profile

**Primary:** Nigerian/African SMEs with crypto exposure
- 10-100 employees
- $100K-$5M annual revenue
- Already using crypto for payments/treasury
- Tech-forward leadership

**Secondary:** Global SMEs, DAOs, Web3 startups
- Remote-first companies
- Crypto-native businesses
- International payment needs

### Distribution Channels

1. **Direct Sales:** Outreach to Nigerian fintech/Web3 companies
2. **Partnerships:** Integrate with African crypto exchanges (Luno, Quidax)
3. **Content Marketing:** Educational content on crypto treasury best practices
4. **Community:** Build in crypto/Web3 communities (Twitter, Discord, Telegram)
5. **Events:** Sponsor/speak at African blockchain conferences

---

## 🎓 Educational Value (For Capstone)

### Learning Outcomes Demonstrated

**Blockchain Development:**
- Solana/Anchor smart contract development
- PDA architecture and security
- SPL token integration
- Transaction lifecycle understanding

**Full-Stack Development:**
- Next.js/React frontend
- Wallet integration
- State management
- Responsive design

**Software Engineering:**
- System architecture design
- Role-based access control
- Security threat modeling
- Test-driven development

**Product Management:**
- User research and personas
- Feature prioritization
- MVP definition
- Go-to-market planning

**Business Analysis:**
- Market sizing
- Competitive analysis
- Pricing strategy
- Revenue modeling

---

## 📚 Documentation Deliverables

### For Submission
1. **Architecture Diagrams** (7 total)
   - High-level system architecture
   - Withdrawal flow diagram
   - Data/state architecture
   - Vault creation flow
   - Owner user flow
   - Staff user flow
   - Approver user flow

2. **Written Report** (40-60 pages)
   - Executive summary
   - Problem statement
   - Solution architecture
   - Implementation details
   - Testing results
   - Future roadmap

3. **Code Repository**
   - Smart contracts (Rust/Anchor)
   - Frontend (TypeScript/React)
   - Tests (TypeScript/Mocha)
   - Documentation (Markdown)
   - README with setup instructions

4. **Live Demo**
   - Deployed on Devnet
   - Video walkthrough
   - Interactive prototype

---

## 🔮 Future Roadmap (Post-Launch)

### Version 2.0 Features
- Multi-chain support (Ethereum, Polygon)
- Recurring payments/subscriptions
- Budget allocations per department
- Integration with accounting software (QuickBooks, Xero)
- Mobile apps (iOS, Android)
- Batch transactions
- Custom approval workflows
- Compliance reporting

### Version 3.0 Features
- AI-powered fraud detection
- Automated tax reporting
- DeFi yield strategies
- Fiat on/off ramps
- Payroll management
- Invoicing system

---

## ✅ Success Criteria

### Must Have (MVP)
- [x] Vault creation working
- [x] Multi-approval workflow functional
- [x] Time delays enforced
- [x] Emergency freeze operational
- [x] Deployed to Devnet
- [x] Basic UI completed
- [x] 5 end-to-end tests passing

### Should Have (Beta)
- [ ] 10 real users testing
- [ ] Mobile responsive
- [ ] Activity notifications
- [ ] Settings management
- [ ] Security audit passed

### Nice to Have (V1)
- [ ] Dark mode
- [ ] Export reports
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] API documentation

---

## 📞 Support & Resources

### Technical Support
- GitHub Issues: github.com/nexus-treasury/issues
- Discord: discord.gg/nexus-treasury
- Email: support@nexustreasury.io

### Documentation
- Developer Docs: docs.nexustreasury.io
- User Guide: help.nexustreasury.io
- API Reference: api.nexustreasury.io

### Community
- Twitter: @nexustreasury
- Telegram: t.me/nexustreasury
- Blog: blog.nexustreasury.io

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Active Development  
**Next Review:** After Phase 1 Completion