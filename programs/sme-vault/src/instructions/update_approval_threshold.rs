use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode};

pub fn handler(ctx: Context<UpdateApprovalThreshold>, approval_threshold: u8) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(approval_threshold > 0, VaultErrorCode::InvalidThreshold);

    require!(
        approval_threshold as usize <= vault.approvers.len(),
        VaultErrorCode::InvalidThreshold
    );

    vault.approval_threshold = approval_threshold;
    Ok(())
}

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