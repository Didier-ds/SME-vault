# SME Vault - Code Patterns & Best Practices

## 📚 Table of Contents

1. [Smart Contract Patterns (Anchor/Rust)](#smart-contract-patterns)
2. [Frontend Patterns (React/TypeScript)](#frontend-patterns)
3. [Testing Patterns](#testing-patterns)
4. [Common Pitfalls & Solutions](#common-pitfalls)
5. [Security Best Practices](#security-best-practices)

---

## 🔧 Smart Contract Patterns (Anchor/Rust)

### Pattern 1: Instruction Structure

**Standard instruction pattern:**

```rust
#[program]
pub mod sme_vault {
    use super::*;

    /// Instruction: Create a new vault
    /// 
    /// # Arguments
    /// * `ctx` - Context containing accounts
    /// * `name` - Vault name (max 50 chars)
    /// * `approval_threshold` - Required approvals (e.g., 2 in 2-of-3)
    /// * `daily_limit` - Max daily withdrawal amount
    /// 
    /// # Returns
    /// * `Result<()>` - Ok if successful, Err otherwise
    pub fn create_vault(
        ctx: Context<CreateVault>,
        name: String,
        approval_threshold: u8,
        daily_limit: u64,
        tx_limit: u64,
        large_withdrawal_threshold: u64,
        delay_hours: u64,
    ) -> Result<()> {
        // 1. Validate inputs
        require!(name.len() > 0 && name.len() <= 50, ErrorCode::InvalidName);
        require!(approval_threshold > 0, ErrorCode::InvalidThreshold);
        require!(daily_limit > 0, ErrorCode::InvalidLimit);
        
        // 2. Get mutable reference to account
        let vault = &mut ctx.accounts.vault;
        
        // 3. Set account fields
        vault.owner = ctx.accounts.owner.key();
        vault.name = name;
        vault.approval_threshold = approval_threshold;
        vault.daily_limit = daily_limit;
        vault.tx_limit = tx_limit;
        vault.large_withdrawal_threshold = large_withdrawal_threshold;
        vault.delay_hours = delay_hours;
        vault.frozen = false;
        vault.created_at = Clock::get()?.unix_timestamp;
        vault.bump = ctx.bumps.vault;
        
        // 4. Emit event for indexing
        emit!(VaultCreated {
            vault: vault.key(),
            owner: vault.owner,
            name: vault.name.clone(),
        });
        
        // 5. Log for debugging
        msg!("Vault created: {} by {}", vault.name, vault.owner);
        
        Ok(())
    }
}
```

**Key principles:**
- Validate all inputs first
- Use `require!` macro for assertions
- Get mutable references early
- Set all fields explicitly
- Emit events for off-chain indexing
- Log important state changes
- Return `Result<()>`

---

### Pattern 2: Account Validation (Context Struct)

**Standard accounts pattern:**

```rust
#[derive(Accounts)]
#[instruction(name: String)] // Pass through instruction args if needed for seeds
pub struct CreateVault<'info> {
    /// Vault account - initialized with PDA
    #[account(
        init,
        payer = owner,
        space = 8 + Vault::INIT_SPACE, // 8 for discriminator
        seeds = [b"vault", owner.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    
    /// Owner - must sign and pay for account creation
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// System program - required for account creation
    pub system_program: Program<'info, System>,
}
```

**Key principles:**
- Document each account
- Use `#[account(...)]` constraints
- Always include `payer` for `init`
- Calculate correct `space`
- Use seeds for deterministic PDAs
- Mark signers explicitly
- Include required programs

---

### Pattern 3: PDA Derivation

**Consistent PDA derivation:**

```rust
// In smart contract
#[derive(Accounts)]
pub struct ApproveWithdrawal<'info> {
    #[account(
        mut,
        seeds = [
            b"withdrawal",
            vault.key().as_ref(),
            &withdrawal.request_id.to_le_bytes() // Counter as seed
        ],
        bump = withdrawal.bump,
    )]
    pub withdrawal: Account<'info, WithdrawalRequest>,
    
    // ... other accounts
}

// In frontend (TypeScript)
const [withdrawalPda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("withdrawal"),
    vaultPubkey.toBuffer(),
    Buffer.from(requestId.toString().padStart(8, '0')) // Match Rust encoding
  ],
  program.programId
);
```

**Key principles:**
- Use descriptive seed prefixes ("vault", "withdrawal")
- Include parent references (vault key)
- Use counters for multiple instances
- Match encoding between Rust and TypeScript
- Store bump in account for verification

---

### Pattern 4: Role-Based Access Control

**Permission checking pattern:**

```rust
pub fn approve_withdrawal(ctx: Context<ApproveWithdrawal>) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let approver = &ctx.accounts.approver;
    let withdrawal = &mut ctx.accounts.withdrawal;
    
    // 1. Check if signer is in approvers list
    require!(
        vault.approvers.contains(&approver.key()),
        ErrorCode::NotApprover
    );
    
    // 2. Check withdrawal status
    require!(
        withdrawal.status == WithdrawalStatus::Pending,
        ErrorCode::InvalidStatus
    );
    
    // 3. Check not already approved by this approver
    require!(
        !withdrawal.approvals.contains(&approver.key()),
        ErrorCode::AlreadyApproved
    );
    
    // 4. Prevent self-approval
    require!(
        withdrawal.requester != approver.key(),
        ErrorCode::SelfApprovalNotAllowed
    );
    
    // 5. Perform action
    withdrawal.approvals.push(approver.key());
    withdrawal.approvals_count += 1;
    
    // 6. Check if threshold met
    if withdrawal.approvals_count >= vault.approval_threshold {
        withdrawal.status = WithdrawalStatus::Approved;
        msg!("Withdrawal approved! Threshold met.");
    }
    
    Ok(())
}
```

**Key principles:**
- Check permissions first
- Validate state before action
- Prevent logical errors (self-approval, double-approval)
- Update state atomically
- Check thresholds/conditions after update

---

### Pattern 5: Time-Based Logic

**Time delay enforcement:**

```rust
pub fn execute_withdrawal(ctx: Context<ExecuteWithdrawal>) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let withdrawal = &mut ctx.accounts.withdrawal;
    let clock = Clock::get()?;
    
    // 1. Check if delay required and has passed
    if let Some(delay_until) = withdrawal.delay_until {
        require!(
            clock.unix_timestamp >= delay_until,
            ErrorCode::DelayNotPassed
        );
        msg!("Time delay satisfied: {} seconds passed", 
             clock.unix_timestamp - withdrawal.created_at);
    }
    
    // 2. Proceed with execution
    // ... transfer logic
    
    withdrawal.executed_at = Some(clock.unix_timestamp);
    
    Ok(())
}
```

**Key principles:**
- Use `Clock::get()?.unix_timestamp`
- Store absolute timestamps (not durations)
- Use `Option<i64>` for optional delays
- Log time-based validations
- Handle timezone correctly (always UTC/Unix time)

---

### Pattern 6: Error Definitions

**Custom error codes:**

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Vault is currently frozen")]
    VaultFrozen,
    
    #[msg("Unauthorized: You are not authorized to perform this action")]
    Unauthorized,
    
    #[msg("Insufficient approvals: Need more approvals before execution")]
    InsufficientApprovals,
    
    #[msg("Time delay not passed: Large withdrawal requires waiting period")]
    DelayNotPassed,
    
    #[msg("Exceeds limit: Amount exceeds configured limit")]
    ExceedsLimit,
    
    #[msg("Insufficient balance: Vault does not have enough funds")]
    InsufficientBalance,
    
    #[msg("Already approved: This approver has already approved this request")]
    AlreadyApproved,
    
    #[msg("Self-approval not allowed: Cannot approve your own request")]
    SelfApprovalNotAllowed,
    
    #[msg("Invalid threshold: Threshold must be > 0 and <= number of approvers")]
    InvalidThreshold,
    
    #[msg("Invalid status: Operation not allowed for current status")]
    InvalidStatus,
}
```

**Key principles:**
- Use descriptive error names
- Include helpful error messages
- Group related errors
- Document what caused the error
- Return errors with `require!` macro

---

### Pattern 7: Account Size Calculation

**Proper space allocation:**

```rust
#[account]
#[derive(InitSpace)] // Auto-calculates space for most types
pub struct Vault {
    pub owner: Pubkey,              // 32 bytes
    
    #[max_len(50)]                  // Required for String/Vec
    pub name: String,               // 4 (length) + 50 = 54 bytes
    
    #[max_len(10)]
    pub approvers: Vec<Pubkey>,     // 4 (length) + (32 * 10) = 324 bytes
    
    #[max_len(20)]
    pub staff: Vec<Pubkey>,         // 4 + (32 * 20) = 644 bytes
    
    pub approval_threshold: u8,     // 1 byte
    pub daily_limit: u64,           // 8 bytes
    pub tx_limit: u64,              // 8 bytes
    pub large_withdrawal_threshold: u64, // 8 bytes
    pub delay_hours: u64,           // 8 bytes
    pub frozen: bool,               // 1 byte
    pub created_at: i64,            // 8 bytes
    pub bump: u8,                   // 1 byte
}

// Total: ~1,097 bytes + 8 (discriminator) = 1,105 bytes
// Always add buffer: use 1,200 bytes to be safe

// In accounts struct:
#[account(
    init,
    payer = owner,
    space = 8 + Vault::INIT_SPACE, // InitSpace derives correct size
    seeds = [...],
    bump
)]
pub vault: Account<'info, Vault>,
```

**Size reference:**
- `Pubkey`: 32 bytes
- `u8`: 1 byte
- `u16`: 2 bytes
- `u32`: 4 bytes
- `u64`: 8 bytes
- `i64`: 8 bytes
- `bool`: 1 byte
- `String`: 4 + actual length
- `Vec<T>`: 4 + (sizeof(T) * length)
- Account discriminator: 8 bytes

---

## ⚛️ Frontend Patterns (React/TypeScript)

### Pattern 1: Custom Hook - useProgram

**Anchor program initialization:**

```typescript
// lib/hooks/useProgram.ts
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { SmeVault } from '@/types/sme_vault'; // Generated IDL type
import idl from '@/idl/sme_vault.json';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    
    const provider = new AnchorProvider(
      connection,
      wallet,
      { 
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    );
    
    return new Program(
      idl as SmeVault,
      PROGRAM_ID,
      provider
    );
  }, [connection, wallet]);

  return program;
}
```

---

### Pattern 2: Custom Hook - useVaults

**Data fetching with loading/error states:**

```typescript
// lib/hooks/useVaults.ts
import { useEffect, useState } from 'react';
import { useProgram } from './useProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface Vault {
  publicKey: PublicKey;
  account: {
    owner: PublicKey;
    name: string;
    approvers: PublicKey[];
    staff: PublicKey[];
    approvalThreshold: number;
    dailyLimit: number;
    frozen: boolean;
    // ... other fields
  };
}

interface UseVaultsReturn {
  vaults: Vault[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVaults(): UseVaultsReturn {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVaults = async () => {
    if (!program || !publicKey) {
      setVaults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all vaults
      const allVaults = await program.account.vault.all();
      
      // Filter vaults where user has any role
      const userVaults = allVaults.filter(vault => {
        const { owner, staff, approvers } = vault.account;
        return (
          owner.equals(publicKey) ||
          staff.some(s => s.equals(publicKey)) ||
          approvers.some(a => a.equals(publicKey))
        );
      });
      
      setVaults(userVaults);
    } catch (err) {
      console.error('Error fetching vaults:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaults();
  }, [program, publicKey]);

  return { vaults, loading, error, refetch: fetchVaults };
}
```

---

### Pattern 3: Custom Hook - useUserRole

**Role detection:**

```typescript
// lib/hooks/useUserRole.ts
import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface UserRole {
  isOwner: boolean;
  isStaff: boolean;
  isApprover: boolean;
  hasAnyRole: boolean;
}

export function useUserRole(vault: {
  owner: PublicKey;
  staff: PublicKey[];
  approvers: PublicKey[];
} | null): UserRole {
  const { publicKey } = useWallet();

  return useMemo(() => {
    if (!publicKey || !vault) {
      return {
        isOwner: false,
        isStaff: false,
        isApprover: false,
        hasAnyRole: false,
      };
    }

    const isOwner = vault.owner.equals(publicKey);
    const isStaff = vault.staff.some(s => s.equals(publicKey));
    const isApprover = vault.approvers.some(a => a.equals(publicKey));

    return {
      isOwner,
      isStaff,
      isApprover,
      hasAnyRole: isOwner || isStaff || isApprover,
    };
  }, [publicKey, vault]);
}
```

---

### Pattern 4: Transaction Helper

**Standard transaction pattern:**

```typescript
// lib/utils/transaction.ts
import { Program } from '@coral-xyz/anchor';
import { toast } from 'sonner';

interface TransactionOptions {
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export async function executeTransaction<T>(
  txPromise: Promise<T>,
  options: TransactionOptions = {}
): Promise<T | null> {
  const {
    onSuccess,
    onError,
    successMessage = 'Transaction successful!',
    errorMessage = 'Transaction failed',
  } = options;

  try {
    // Show loading toast
    const loadingToast = toast.loading('Waiting for signature...');
    
    // Execute transaction
    const result = await txPromise;
    
    // Dismiss loading
    toast.dismiss(loadingToast);
    
    // Show success
    toast.success(successMessage, {
      description: typeof result === 'string' 
        ? `Signature: ${result.slice(0, 8)}...` 
        : undefined,
    });
    
    // Call success callback
    if (onSuccess && typeof result === 'string') {
      onSuccess(result);
    }
    
    return result;
  } catch (error) {
    console.error('Transaction error:', error);
    
    // Parse error message
    const errorMsg = parseErrorMessage(error);
    
    // Show error toast
    toast.error(errorMessage, {
      description: errorMsg,
    });
    
    // Call error callback
    if (onError) {
      onError(error as Error);
    }
    
    return null;
  }
}

function parseErrorMessage(error: any): string {
  // User rejected
  if (error.message?.includes('User rejected')) {
    return 'Transaction cancelled';
  }
  
  // Insufficient SOL
  if (error.message?.includes('insufficient')) {
    return 'Insufficient SOL for transaction fee';
  }
  
  // Custom program error
  if (error.error?.errorMessage) {
    return error.error.errorMessage;
  }
  
  // Anchor error
  if (error.logs) {
    const errorLog = error.logs.find((log: string) => 
      log.includes('Error Code:')
    );
    if (errorLog) {
      return errorLog.split('Error Message: ')[1] || 'Unknown error';
    }
  }
  
  return error.message || 'Unknown error occurred';
}
```

**Usage in component:**

```typescript
// In component
const handleCreateVault = async () => {
  if (!program) return;
  
  await executeTransaction(
    program.methods
      .createVault(name, threshold, dailyLimit, txLimit, largeThreshold, delay)
      .accounts({ /* ... */ })
      .rpc(),
    {
      successMessage: 'Vault created successfully!',
      errorMessage: 'Failed to create vault',
      onSuccess: (signature) => {
        console.log('Signature:', signature);
        router.push('/vaults');
      },
    }
  );
};
```

---

### Pattern 5: Component - Vault Card

**Reusable card component:**

```typescript
// components/vault/VaultCard.tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicKey } from '@solana/web3.js';
import { formatNumber, truncateAddress } from '@/lib/utils/format';

interface VaultCardProps {
  vault: {
    publicKey: PublicKey;
    account: {
      name: string;
      frozen: boolean;
      owner: PublicKey;
    };
  };
  balance?: number;
  role: 'owner' | 'staff' | 'approver';
  onSelect: () => void;
}

export function VaultCard({ vault, balance, role, onSelect }: VaultCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">
            {vault.account.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {truncateAddress(vault.publicKey.toString())}
          </p>
        </div>
        <Badge variant={vault.account.frozen ? 'destructive' : 'default'}>
          {vault.account.frozen ? '🔒 Frozen' : '✅ Active'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className="text-xl font-bold">
            {balance !== undefined ? `${formatNumber(balance)} USDC` : '—'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Role</span>
          <Badge variant="outline" className="capitalize">
            {role}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={onSelect} className="w-full">
          Open Vault →
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### Pattern 6: Form Handling

**Create vault form with validation:**

```typescript
// components/vault/CreateVaultForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PublicKey } from '@solana/web3.js';

const vaultSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  approvers: z.array(z.string()).min(1, 'At least one approver required'),
  staff: z.array(z.string()),
  threshold: z.number().min(1, 'Threshold must be at least 1'),
  dailyLimit: z.number().min(0, 'Must be positive'),
  txLimit: z.number().min(0, 'Must be positive'),
  largeWithdrawalThreshold: z.number().min(0, 'Must be positive'),
  delayHours: z.number().min(0, 'Must be non-negative'),
});

type VaultFormData = z.infer<typeof vaultSchema>;

export function CreateVaultForm() {
  const [submitting, setSubmitting] = useState(false);
  const program = useProgram();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<VaultFormData>({
    resolver: zodResolver(vaultSchema),
    defaultValues: {
      approvers: [],
      staff: [],
      threshold: 2,
      dailyLimit: 10000,
      txLimit: 5000,
      largeWithdrawalThreshold: 3000,
      delayHours: 24,
    },
  });

  const onSubmit = async (data: VaultFormData) => {
    if (!program) return;
    
    setSubmitting(true);
    
    try {
      // Validate approver addresses
      const approverPubkeys = data.approvers.map(addr => {
        try {
          return new PublicKey(addr);
        } catch {
          throw new Error(`Invalid approver address: ${addr}`);
        }
      });
      
      // Validate staff addresses
      const staffPubkeys = data.staff.map(addr => {
        try {
          return new PublicKey(addr);
        } catch {
          throw new Error(`Invalid staff address: ${addr}`);
        }
      });
      
      // Convert USDC amounts (6 decimals)
      const dailyLimit = data.dailyLimit * 1_000_000;
      const txLimit = data.txLimit * 1_000_000;
      const largeThreshold = data.largeWithdrawalThreshold * 1_000_000;
      
      // Derive vault PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          program.provider.publicKey!.toBuffer(),
          Buffer.from(data.name),
        ],
        program.programId
      );
      
      // Create vault
      const signature = await program.methods
        .createVault(
          data.name,
          data.threshold,
          dailyLimit,
          txLimit,
          largeThreshold,
          data.delayHours
        )
        .accounts({
          vault: vaultPda,
          owner: program.provider.publicKey!,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      toast.success('Vault created!', {
        description: `Signature: ${signature.slice(0, 8)}...`,
      });
      
      // Add approvers
      for (const approver of approverPubkeys) {
        await program.methods
          .addApprover(approver)
          .accounts({
            vault: vaultPda,
            owner: program.provider.publicKey!,
          })
          .rpc();
      }
      
      // Add staff
      for (const staff of staffPubkeys) {
        await program.methods
          .addStaff(staff)
          .accounts({
            vault: vaultPda,
            owner: program.provider.publicKey!,
          })
          .rpc();
      }
      
      // Redirect
      router.push(`/vaults/${vaultPda.toString()}`);
      
    } catch (error) {
      console.error('Error creating vault:', error);
      toast.error('Failed to create vault', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form fields */}
      <div>
        <label>Vault Name</label>
        <input {...register('name')} />
        {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      </div>
      
      {/* ... more fields */}
      
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Vault'}
      </Button>
    </form>
  );
}
```

---

### Pattern 7: Conditional Rendering Based on Role

```typescript
// components/vault/VaultDashboard.tsx
import { useUserRole } from '@/lib/hooks/useUserRole';

export function VaultDashboard({ vault }: { vault: VaultData }) {
  const role = useUserRole(vault.account);

  return (
    <div className="space-y-6">
      {/* Everyone sees this */}
      <VaultOverview vault={vault} />
      
      {/* Owner-only section */}
      {role.isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Owner Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FreezeButton vault={vault} />
            <UpdateLimitsButton vault={vault} />
            <ManageApproversButton vault={vault} />
          </CardContent>
        </Card>
      )}
      
      {/* Staff-only section */}
      {role.isStaff && (
        <Card>
          <CardHeader>
            <CardTitle>💸 Staff Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestWithdrawalButton vault={vault} disabled={vault.account.frozen} />
          </CardContent>
        </Card>
      )}
      
      {/* Approver-only section */}
      {role.isApprover && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalQueue vaultAddress={vault.publicKey} />
          </CardContent>
        </Card>
      )}
      
      {/* Everyone sees this */}
      <WithdrawalHistory vaultAddress={vault.publicKey} />
    </div>
  );
}
```

---

## 🧪 Testing Patterns

### Pattern 1: Anchor Test Structure

```typescript
// tests/sme-vault.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SmeVault } from "../target/types/sme_vault";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";

describe("sme-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmeVault as Program<SmeVault>;
  
  // Test accounts
  let vaultPda: PublicKey;
  let approver1: anchor.web3.Keypair;
  let approver2: anchor.web3.Keypair;
  let staff: anchor.web3.Keypair;
  
  before(async () => {
    // Set up test accounts
    approver1 = anchor.web3.Keypair.generate();
    approver2 = anchor.web3.Keypair.generate();
    staff = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        approver1.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      )
    );
  });
  
  describe("Vault Creation", () => {
    it("Creates a vault with valid parameters", async () => {
      const vaultName = "Test Vault";
      
      [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vault"),
          provider.wallet.publicKey.toBuffer(),
          Buffer.from(vaultName),
        ],
        program.programId
      );
      
      await program.methods
        .createVault(
          vaultName,
          2, // threshold
          10000_000000, // daily limit
          5000_000000, // tx limit
          3000_000000, // large withdrawal
          24 // delay hours
        )
        .accounts({
          vault: vaultPda,
          owner: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      const vault = await program.account.vault.fetch(vaultPda);
      
      expect(vault.name).to.equal(vaultName);
      expect(vault.owner.toString()).to.equal(provider.wallet.publicKey.toString());
      expect(vault.approvalThreshold).to.equal(2);
      expect(vault.frozen).to.equal(false);
    });
    
    it("Fails with empty vault name", async () => {
      try {
        await program.methods
          .createVault("", 2, 10000, 5000, 3000, 24)
          .accounts({
            vault: PublicKey.default,
            owner: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("InvalidName");
      }
    });
  });
  
  describe("Withdrawal Flow", () => {
    // ... more tests
  });
});
```

---

## ⚠️ Common Pitfalls & Solutions

### Pitfall 1: Incorrect Account Size

**Problem:**
```rust
// ❌ WRONG - Not accounting for String/Vec overhead
space = 32 + 50 + 1 + 8  // Pubkey + String + u8 + u64
```

**Solution:**
```rust
// ✅ CORRECT - Use InitSpace derive macro
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub owner: Pubkey,
    #[max_len(50)]
    pub name: String,  // 4 bytes overhead + 50
    pub threshold: u8,
    pub limit: u64,
}

// In accounts:
space = 8 + Vault::INIT_SPACE
```

---

### Pitfall 2: Not Handling PublicKey Comparison

**Problem:**
```typescript
// ❌ WRONG - Comparing objects
if (userKey == vaultOwner) { ... }
```

**Solution:**
```typescript
// ✅ CORRECT - Use .equals()
if (userKey.equals(vaultOwner)) { ... }
```

---

### Pitfall 3: Forgetting to Mark Account as Mutable

**Problem:**
```rust
// ❌ WRONG - Vault will be read-only
#[derive(Accounts)]
pub struct UpdateVault<'info> {
    pub vault: Account<'info, Vault>,  // Not mutable!
}
```

**Solution:**
```rust
// ✅ CORRECT - Mark as mut
#[derive(Accounts)]
pub struct UpdateVault<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
}
```

---

### Pitfall 4: Integer Overflow

**Problem:**
```rust
// ❌ WRONG - Can overflow
withdrawal.amount = withdrawal.amount + new_amount;
```

**Solution:**
```rust
// ✅ CORRECT - Use checked math
withdrawal.amount = withdrawal.amount
    .checked_add(new_amount)
    .ok_or(ErrorCode::Overflow)?;
```

---

## 🔒 Security Best Practices

### 1. Always Validate Signers

```rust
// Check signer is authorized
require!(
    ctx.accounts.signer.key() == vault.owner,
    ErrorCode::Unauthorized
);
```

### 2. Verify PDA Derivation

```rust
// Verify PDA matches expected derivation
let (expected_pda, bump) = Pubkey::find_program_address(
    &[b"vault", owner.as_ref(), name.as_bytes()],
    program_id
);
require!(vault.key() == expected_pda, ErrorCode::InvalidPDA);
```

### 3. Use Checked Arithmetic

```rust
// Always use checked operations
let new_balance = vault.balance
    .checked_sub(amount)
    .ok_or(ErrorCode::InsufficientBalance)?;
```

### 4. Validate State Transitions

```rust
// Only allow valid status transitions
match (current_status, new_status) {
    (Pending, Approved) => Ok(()),
    (Approved, Executed) => Ok(()),
    _ => Err(ErrorCode::InvalidStatusTransition.into())
}
```

### 5. Emit Events for Critical Actions

```rust
emit!(WithdrawalExecuted {
    vault: vault.key(),
    amount,
    destination,
    executor: ctx.accounts.executor.key(),
});
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**For:** SME Vault Development