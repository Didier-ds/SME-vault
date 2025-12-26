use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode};

pub fn handler(ctx: Context<RemoveApprover>, approver: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    if !vault.approvers.contains(&approver) {
        return Err(VaultErrorCode::ApproverNotFound.into())
    }

    require!(
        vault.approvers.len() > vault.approval_threshold as usize,
        VaultErrorCode::InvalidThreshold
    );

    // Remove the approver
    vault.approvers.retain(|&x| x != approver);

    msg!("✅ Approver removed: {}", approver);

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveApprover<'info> {
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

    pub owner: Signer<'info>
}