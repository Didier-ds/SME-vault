use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode};

pub fn handler(ctx: Context<CreateVault>, name: String, approval_threshold: u8, daily_limit: u64, tx_limit: u64, large_withdrawal_threshold: u64, delay_hours: u64) -> Result<()> {
    require!(name.len() > 0 && name.len() <= 50, VaultErrorCode::InvalidName);
    require!(approval_threshold > 0, VaultErrorCode::InvalidThreshold);
    require!(daily_limit > 0, VaultErrorCode::InvalidLimit);
    require!(tx_limit > 0, VaultErrorCode::InvalidLimit);
    require!(large_withdrawal_threshold > 0, VaultErrorCode::InvalidLimit);

    let vault = &mut ctx.accounts.vault;

    vault.owner = ctx.accounts.owner.key();
    vault.name = name;
    vault.approvers = Vec::new();
    vault.staff = Vec::new();
    vault.approval_threshold = approval_threshold;
    vault.daily_limit = daily_limit;
    vault.tx_limit = tx_limit;
    vault.large_withdrawal_threshold = large_withdrawal_threshold;
    vault.delay_hours = delay_hours;
    vault.frozen = false;
    vault.created_at = Clock::get()?.unix_timestamp;
    vault.bump = ctx.bumps.vault;
    vault.withdrawal_count = 0;

    // 4. LOG FOR DEBUGGING
    msg!("Vault created: {} by {}", vault.name, vault.owner);

    // 5. RETURN SUCCESS
    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Vault::INIT_SPACE,
        seeds = [Vault::SEED_PREFIX, owner.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}