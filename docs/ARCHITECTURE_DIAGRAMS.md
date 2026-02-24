# SME Vault — Architecture Diagrams

## 1. Vault Context Architecture

This diagram shows the structure of `VaultContext`, its dependencies, and how data flows through the vault layer.

```mermaid
flowchart TB
    subgraph Consumers["Consumers (Dashboard Pages & Components)"]
        Dashboard["dashboard/page.tsx"]
        Withdrawals["withdrawals/page.tsx"]
        Activity["activity/page.tsx"]
        AppLayout["app-layout.tsx"]
        VaultSwitcher["vault-switcher.tsx"]
        WithdrawalForm["WithdrawalRequestForm"]
        WithdrawalCard["WithdrawalCard"]
    end

    subgraph VaultContext["VaultContext (Single Source of Truth)"]
        direction TB
        Provider["VaultProvider"]
        Context["VaultContext (React Context)"]
        Hook["useVaultContext()"]
        
        Provider --> Context
        Context --> Hook
    end

    subgraph VaultContextState["Context State & Derived Values"]
        direction TB
        Selection["selectedVaultAddress\nsetSelectedVault"]
        VaultsList["vaults[]\nvaultsLoading"]
        SelectedVault["selectedVault (computed)"]
        Balance["vaultBalance\nbalanceLoading\nvaultTokenAccount"]
        TokenProps["tokenMint\ntokenDecimals\ndecimalMultiplier\ndecimalDivisor"]
        Actions["refetchVaults\nrefetchBalance"]
    end

    subgraph Dependencies["VaultProvider Dependencies"]
        useConnection["useConnection()"]
        useVaults["useVaults(selectedVaultAddress)"]
        localStorage["localStorage (selectedVault)"]
    end

    subgraph useVaultsInternals["useVaults Hook"]
        useProgram["useProgram()"]
        useWallet["useWallet()"]
        fetchVaults["fetchVaults() → program.account.vault.all()"]
        fetchBalance["fetchBalance() → connection.getTokenAccountBalance()"]
    end

    Consumers -->|"useVaultContext()"| Hook
    Hook --> VaultContextState

    Provider --> useConnection
    Provider --> useVaults
    Provider --> localStorage

    useVaults --> useProgram
    useVaults --> useWallet
    useVaults --> fetchVaults
    useVaults --> fetchBalance

    useVaults --> VaultContextState
```

### Vault Context Data Flow (Simplified)

```mermaid
flowchart LR
    subgraph Inputs
        Wallet["Wallet (publicKey)"]
        Connection["Solana Connection"]
        UserSelection["User Selection\n(localStorage)"]
    end

    subgraph VaultProvider
        useVaults["useVaults"]
        Compute["Compute:\n• effectiveSelectedVault\n• selectedVault\n• tokenMint"]
        TokenDecimals["Fetch token decimals\n(useEffect)"]
    end

    subgraph Outputs["Context Value"]
        O1["vaults, vaultsLoading"]
        O2["selectedVault, selectedVaultAddress"]
        O3["vaultBalance, balanceLoading"]
        O4["tokenMint, tokenDecimals"]
        O5["decimalMultiplier, decimalDivisor"]
    end

    Wallet --> useVaults
    Connection --> useVaults
    UserSelection --> Compute

    useVaults --> Compute
    Compute --> TokenDecimals
    Compute --> O1
    Compute --> O2
    useVaults --> O3
    TokenDecimals --> O4
    O4 --> O5
```

---

## 2. State Management: App Mount → Fully Mounted

This diagram shows the sequence of initialization from when the app mounts until the dashboard is fully loaded and ready.

```mermaid
sequenceDiagram
    participant Browser
    participant RootLayout
    participant AppWalletProvider
    participant ConnectionProvider
    participant WalletProvider
    participant WalletModalProvider
    participant User
    participant DashboardLayout
    participant VaultProvider
    participant useVaults
    participant useProgram
    participant SolanaRPC

    Note over Browser,SolanaRPC: Phase 1 — Root Layout Mount
    Browser->>RootLayout: Mount (html, body)
    RootLayout->>AppWalletProvider: Mount
    AppWalletProvider->>ConnectionProvider: Mount (endpoint: Devnet)
    ConnectionProvider->>WalletProvider: Mount (Phantom, Solflare)
    WalletProvider->>WalletModalProvider: Mount
    WalletModalProvider->>User: Render children (e.g. landing page)

    Note over Browser,SolanaRPC: Phase 2 — User Navigates to /dashboard
    User->>Browser: Navigate to /dashboard
    Browser->>DashboardLayout: Mount
    DashboardLayout->>VaultProvider: Mount
    VaultProvider->>VaultProvider: Read localStorage (selectedVault)
    VaultProvider->>VaultProvider: Init userSelectedVaultAddress state
    VaultProvider->>useVaults: Call (selectedVaultAddress)
    VaultProvider->>VaultProvider: Mount AppLayout + children

    Note over Browser,SolanaRPC: Phase 3 — useVaults Initialization (requires wallet)
    useVaults->>useProgram: Call
    useProgram->>useConnection: Get connection
    useProgram->>useAnchorWallet: Get wallet
    alt Wallet NOT connected
        useProgram-->>useVaults: program = null
        useVaults->>useVaults: fetchVaults() early-exit (no program)
        useVaults-->>VaultProvider: vaults=[], vaultsLoading=false
    else Wallet connected
        useProgram-->>useVaults: program (Anchor Program)
        useVaults->>useVaults: fetchVaults() [useEffect]
        useVaults->>useVaults: setVaultsLoading(true)
        useVaults->>SolanaRPC: program.account.vault.all()
        SolanaRPC-->>useVaults: allVaultAccounts
        useVaults->>useVaults: Filter by user role (owner/staff/approver)
        useVaults->>useVaults: setVaults(), setVaultsLoading(false)
        useVaults-->>VaultProvider: vaults, vaultsLoading=false
    end

    Note over Browser,SolanaRPC: Phase 4 — VaultProvider Computes effectiveSelectedVault
    VaultProvider->>VaultProvider: effectiveSelectedVaultAddress = userSelected OR first vault
    VaultProvider->>VaultProvider: selectedVault = vaults.find(effectiveSelected)
    VaultProvider->>useVaults: fetchBalance() [useEffect, depends on selectedVault]

    Note over Browser,SolanaRPC: Phase 5 — Balance Fetch (when vault selected)
    useVaults->>useVaults: fetchBalance()
    useVaults->>SolanaRPC: getAssociatedTokenAddress(tokenMint, vaultPda)
    useVaults->>SolanaRPC: connection.getTokenAccountBalance(ata)
    SolanaRPC-->>useVaults: tokenBalance
    useVaults->>useVaults: setSelectedVaultBalance(), setBalanceLoading(false)
    useVaults-->>VaultProvider: selectedVaultBalance, balanceLoading=false

    Note over Browser,SolanaRPC: Phase 6 — Token Decimals (async)
    VaultProvider->>VaultProvider: useEffect: loadTokenDecimals(tokenMint)
    VaultProvider->>SolanaRPC: connection.getParsedAccountInfo(tokenMint)
    SolanaRPC-->>VaultProvider: decimals
    VaultProvider->>VaultProvider: setTokenDecimals(), decimalMultiplier, decimalDivisor

    Note over Browser,SolanaRPC: Phase 7 — Fully Mounted
    VaultProvider-->>AppLayout: Context value ready
    AppLayout-->>User: Dashboard fully rendered with vault data
```

### Provider Hierarchy (Component Tree)

```mermaid
flowchart TB
    subgraph Root["Root Layout (app/layout.tsx)"]
        html["<html>"]
        body["<body>"]
    end

    subgraph WalletLayer["Wallet Layer"]
        AppWalletProvider["AppWalletProvider"]
        ConnectionProvider["ConnectionProvider\n(endpoint: Devnet)"]
        WalletProvider["WalletProvider\n(Phantom, Solflare)"]
        WalletModalProvider["WalletModalProvider"]
    end

    subgraph DashboardLayer["Dashboard Layout (app/dashboard/layout.tsx)"]
        VaultProvider["VaultProvider"]
        AppLayout["AppLayout"]
        PageTransition["PageTransition"]
        Children["{children}"]
    end

    html --> body
    body --> AppWalletProvider
    AppWalletProvider --> ConnectionProvider
    ConnectionProvider --> WalletProvider
    WalletProvider --> WalletModalProvider
    WalletModalProvider --> Children

    Note1["/dashboard only"]
    Children --> Note1
    Note1 -.->|"When route = /dashboard/*"| VaultProvider
    VaultProvider --> AppLayout
    AppLayout --> PageTransition
    PageTransition --> Children
```

### State Readiness Checklist

| State | Depends On | When Ready |
|-------|------------|------------|
| `connection` | `ConnectionProvider` | Immediately on mount |
| `wallet` / `publicKey` | User connects wallet | When user clicks "Connect" |
| `program` | `connection` + `wallet` | When wallet connected |
| `vaults` | `program` + `publicKey` | After `program.account.vault.all()` |
| `effectiveSelectedVaultAddress` | `vaults` + `localStorage` | After vaults loaded |
| `selectedVault` | `vaults` + `effectiveSelectedVaultAddress` | Derived, immediate |
| `vaultBalance` | `connection` + `selectedVault` + `vaults` | After `getTokenAccountBalance()` |
| `tokenDecimals` | `connection` + `tokenMint` | After `getParsedAccountInfo()` |
| `decimalMultiplier` / `decimalDivisor` | `tokenDecimals` | Derived, immediate |

---

## Summary

- **VaultContext** is the single source of truth for vault selection, vault list, selected vault data, balance, and token decimals. It wraps `useVaults` and adds selection logic and persistence.
- **App mount flow**: Root → Wallet providers → (on /dashboard) → VaultProvider → useVaults → useProgram. Vault data loads only after the wallet is connected; balance and token decimals load after a vault is selected.
