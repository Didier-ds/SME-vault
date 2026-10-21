# SME Vault — User Flow & Smart Contract Diagrams

## 1. App User Flow

```mermaid
flowchart TB
    subgraph Entry[" "]
        A["Landing Page"]
        A --> B["Launch App / Get Started"]
        B --> C["Dashboard"]
    end

    subgraph Wallet["Wallet"]
        C --> D{"Wallet connected?"}
        D -->|No| E["Wallet Connection Dialog"]
        E --> C
        D -->|Yes| F["Show vault switcher + content"]
    end

    subgraph VaultSelection["Vault"]
        F --> G{"Has vaults?"}
        G -->|No| H["Create Vault CTA"]
        G -->|Yes| I["Select vault from switcher"]
        H --> J["Create Vault Page"]
        J --> K["Form: name, approval threshold, limits, delay, mint, approvers, staff"]
        K --> L["Submit → create_vault + add_approver + add_staff"]
        L --> C
    end

    subgraph DashboardActions["Dashboard (vault selected)"]
        I --> M["Hero Card: balance, Manage Team, Request Withdrawal"]
        M --> N["Withdrawal Requests list"]
        M --> O["Manage Team Modal"]
        O --> P["Add/remove approvers & staff (owner only)"]
        M --> Q["Request Withdrawal Modal"]
        Q --> R["Staff: amount, destination, reason → request_withdrawal"]
    end

    subgraph OtherPages["Other pages"]
        F --> S["Activity Page"]
        S --> T["View deposits, withdrawal request/approve/execute events"]
        F --> U["Withdrawals Page"]
        U --> V["Request form (staff)"]
        U --> W["Pending / Approved / Executed list"]
        W --> X["Approvers: approve_withdrawal"]
        W --> Y["Anyone: execute_withdrawal when approved + delay passed"]
    end

    style A fill:#e1f5fe
    style C fill:#e8f5e9
    style J fill:#fff3e0
    style M fill:#f3e5f5
```

---

## 2. Smart Contract (Program) Flow

```mermaid
flowchart LR
    subgraph Setup["Program & vault setup"]
        I["initialize"]
        I --> CV["create_vault"]
        CV --> CV_params["name, approval_threshold, daily_limit, tx_limit, large_withdrawal_threshold, delay_hours"]
    end

    subgraph Team["Team (owner only)"]
        CV --> A["add_approver"]
        CV --> B["add_staff"]
        A --> RA["remove_approver"]
        B --> RS["remove_staff"]
        CV --> UAT["update_approval_threshold"]
        CV --> FV["freeze_vault"]
        FV --> UFV["unfreeze_vault"]
    end

    subgraph Withdrawal["Withdrawal lifecycle"]
        RQ["request_withdrawal"]
        RQ --> RQ_guard["Staff only, vault not frozen, amount ≤ tx_limit"]
        RQ_guard --> AP["approve_withdrawal"]
        AP --> AP_guard["Approver, not requester, not already approved"]
        AP_guard --> AP_done["approvals.push; if len ≥ threshold → status = Approved"]
        AP_done --> EX["execute_withdrawal"]
        EX --> EX_guard["Status = Approved, vault not frozen, delay passed, balance ≥ amount"]
        EX_guard --> EX_done["SPL transfer; status = Executed"]
    end

    CV -.-> RQ
    style RQ fill:#ffecb3
    style AP fill:#c8e6c9
    style EX fill:#b3e5fc
```

---

## 3. Withdrawal Request → Approve → Execute (detailed)

```mermaid
flowchart TB
    subgraph Request["1. Request (staff)"]
        R1["Staff calls request_withdrawal(amount, destination, reason)"]
        R2["Checks: staff, !frozen, amount ≤ tx_limit"]
        R3["Create WithdrawalRequest: Pending"]
        R4["If amount ≥ large_withdrawal_threshold → set delay_until"]
        R1 --> R2 --> R3 --> R4
    end

    subgraph Approve["2. Approve (approvers)"]
        A1["Approver calls approve_withdrawal"]
        A2["Checks: is approver, !frozen, status = Pending, not requester, not already approved"]
        A3["Add approver to approvals[]"]
        A4["If approvals.length ≥ approval_threshold → status = Approved"]
        A1 --> A2 --> A3 --> A4
    end

    subgraph Execute["3. Execute (any signer)"]
        E1["Signer calls execute_withdrawal"]
        E2["Checks: status = Approved, !frozen, now ≥ delay_until, balance ≥ amount"]
        E3["Vault PDA signs SPL token transfer to destination"]
        E4["Update: executed_at, status = Executed"]
        E1 --> E2 --> E3 --> E4
    end

    Request --> Approve --> Execute
```

---

## 4. App ↔ Contract Mapping

| App action / screen | Program instruction(s) |
|--------------------|-------------------------|
| Create Vault (form submit) | `create_vault`, then `add_approver` / `add_staff` per member |
| Manage Team (add/remove) | `add_approver`, `remove_approver`, `add_staff`, `remove_staff` |
| Update approval threshold | `update_approval_threshold` |
| Request Withdrawal modal | `request_withdrawal` |
| Approve button on a request | `approve_withdrawal` |
| Execute button on approved request | `execute_withdrawal` |
| Freeze / unfreeze (if in UI) | `freeze_vault`, `unfreeze_vault` |
| Deposits | No instruction — user sends SPL tokens to vault’s ATA |

---

## 5. Roles

| Role | How assigned | Can do |
|------|----------------|--------|
| **Owner** | Creator of vault (signer of `create_vault`) | Add/remove approvers and staff, update approval threshold, freeze/unfreeze |
| **Approver** | Added via `add_approver` | `approve_withdrawal` (cannot approve own request) |
| **Staff** | Added via `add_staff` | `request_withdrawal` |

Execution of an approved withdrawal is permissionless: any signer can call `execute_withdrawal` once the request is Approved and the delay (if any) has passed.
