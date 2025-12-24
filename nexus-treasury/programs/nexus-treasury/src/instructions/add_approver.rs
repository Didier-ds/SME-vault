use anchor_lang::prelude::*;
use crate::{Vault, ErrorCode, MAX_APPROVERS};

pub fn handler(ctx: Context<AddApprover>, approver: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // 1. Validate: Check max approvers
    require!(
        vault.approvers.len() < MAX_APPROVERS,
        ErrorCode::MaxApproversReached
    );

    // 2. Validate: Check for duplicates
    require!(
        !vault.approvers.contains(&approver),
        ErrorCode::DuplicateApprover
    );

    // 3. Add approver to the list
    vault.approvers.push(approver);

    msg!("Approver added: {}", approver);

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
        has_one = owner @ ErrorCode::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}