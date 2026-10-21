# Update Approval Threshold – Implementation Hints

## 1. Instruction Handler

Create `programs/sme-vault/src/instructions/update_approval_threshold.rs` (or add to an existing vault config module):

```rust
pub fn handler(ctx: Context<UpdateApprovalThreshold>, new_threshold: u8) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // 1. Validate: threshold > 0
    require!(new_threshold > 0, VaultErrorCode::InvalidThreshold);

    // 2. Validate: threshold <= approvers.len() (can't require more approvals than approvers exist)
    require!(
        new_threshold as usize <= vault.approvers.len(),
        VaultErrorCode::InvalidThreshold
    );

    vault.approval_threshold = new_threshold;
    Ok(())
}
```

## 2. Accounts Struct

Same pattern as `AddApprover` / `RemoveApprover`:

```rust
#[derive(Accounts)]
pub struct UpdateApprovalThreshold<'info> {
    #[account(
        mut,
        seeds = [Vault::SEED_PREFIX, vault.owner.as_ref(), vault.name.as_bytes()],
        bump = vault.bump,
        has_one = owner @ VaultErrorCode::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}
```

## 3. Wire Up in lib.rs

Add to `programs/sme-vault/src/lib.rs`:

```rust
pub fn update_approval_threshold(
    ctx: Context<UpdateApprovalThreshold>,
    new_threshold: u8,
) -> Result<()> {
    instructions::update_approval_threshold::handler(ctx, new_threshold)
}
```

And add the context type to the `Context` enum / imports.

## 4. Module Structure

- Create `programs/sme-vault/src/instructions/update_approval_threshold.rs`
- Export it from `programs/sme-vault/src/instructions/mod.rs`
- Add the instruction to the `#[program]` block in `lib.rs`

## 5. Error Message

`VaultErrorCode::InvalidThreshold` already exists with message  
`"Invalid threshold: Threshold must be > 0 and <= number of approvers"`  
which fits both validations.

## 6. Edge Case: Empty Approvers

If `vault.approvers.len() == 0`, then `new_threshold <= 0` fails (threshold > 0), and `new_threshold <= 0` is false for any valid threshold. So the only valid value would be `1`, but `1 <= 0` fails. So with zero approvers, no threshold is valid—which is correct. The tests use a vault with 3 approvers, so this case is not exercised.

## 7. Build & Run Tests

```bash
anchor build
anchor test -- --grep "update_approval_threshold"
```
