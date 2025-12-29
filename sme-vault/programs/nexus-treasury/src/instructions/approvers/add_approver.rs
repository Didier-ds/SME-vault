use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode, MAX_APPROVERS};

pub fn handler(ctx: Context<AddApprover>, approver: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // Debug logging - see what's happening
    msg!("🔍 ADD_APPROVER called");
    msg!("   Vault: {}", vault.key());
    msg!("   Owner: {}", ctx.accounts.owner.key());
    msg!("   Approver to add: {}", approver);
    msg!("   Current approvers count: {}/{}", vault.approvers.len(), MAX_APPROVERS);

    // 1. Validate: Check max approvers
    require!(
        vault.approvers.len() < MAX_APPROVERS,
        VaultErrorCode::MaxApproversReached
    );

    // 2. Validate: Check for duplicates
    require!(
        !vault.approvers.contains(&approver),
        VaultErrorCode::DuplicateApprover
    );

    // 3. Add approver to the list
    vault.approvers.push(approver);

    msg!("✅ Approver added successfully: {}", approver);
    msg!("   New approvers count: {}", vault.approvers.len());

    Ok(())
}

#[derive(Accounts)]
pub struct AddApprover<'info> {
    #[account(
        mut,
        seeds = [
            Vault::SEED_PREFIX,
            vault.owner.as_ref(),
            vault.name.as_bytes()
        ],
        bump = vault.bump,
        has_one = owner @ VaultErrorCode::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}