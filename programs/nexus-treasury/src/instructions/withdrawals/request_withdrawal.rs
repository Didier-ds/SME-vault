use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode, WithdrawalRequest, WithdrawalStatus};

pub fn handler(ctx: Context<RequestWithdrawal>, amount: u64, destination: Pubkey, reason: String,) -> Result<()> {

    let vault = &mut ctx.accounts.vault;
    let withdrawal = &mut ctx.accounts.withdrawal;
    let requester = ctx.accounts.requester.key();
    let clock = Clock::get()?;

    // 1. Validate: requester is staff
    require!(
          vault.staff.contains(&requester),
          VaultErrorCode::Unauthorized
      );

    // 2. Is vault frozen?
    require!(
        !vault.frozen,
        VaultErrorCode::VaultFrozen
    );

    // 3. Validate: amount > 0
    require!(
          amount > 0,
          VaultErrorCode::InvalidLimit
      );

    // 4. Validate: amount <= tx_limit
    require!(
          amount <= vault.tx_limit,
          VaultErrorCode::ExceedsLimit
      );

    withdrawal.vault = vault.key();
    withdrawal.amount = amount;
    withdrawal.destination = destination;
    withdrawal.requester = requester;
    withdrawal.reason = reason;
    withdrawal.approvals = Vec::new();
    withdrawal.status = WithdrawalStatus::Pending;
    withdrawal.created_at = clock.unix_timestamp;
    withdrawal.bump = ctx.bumps.withdrawal;
    vault.withdrawal_count += 1;

    // 6. Check if large withdrawal (needs time delay)
    if amount >= vault.large_withdrawal_threshold {
        let delay_seconds = vault.delay_hours * 3600; // hours to seconds
        withdrawal.delay_until = Some(clock.unix_timestamp + delay_seconds as i64);
    } else {
        withdrawal.delay_until = None;
    }

    withdrawal.executed_at = None;

    msg!("✅ Withdrawal request created: {} tokens", amount);

    Ok(())
}
#[derive(Accounts)]
#[instruction(amount: u64, destination: Pubkey, reason: String)]
pub struct RequestWithdrawal<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + WithdrawalRequest::INIT_SPACE,
        seeds = [
              WithdrawalRequest::SEED_PREFIX,
              vault.key().as_ref(),
              &vault.withdrawal_count.to_le_bytes(),
        ],
        bump
    )]
    pub withdrawal: Account<'info, WithdrawalRequest>,

    #[account(
        mut,
        seeds = [
              Vault::SEED_PREFIX,
              vault.owner.as_ref(),
              vault.name.as_bytes()
          ],
          bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub requester: Signer<'info>,
    pub system_program: Program<'info, System>
}