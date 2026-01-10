use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{Vault, VaultErrorCode, WithdrawalRequest, WithdrawalStatus};

pub fn handler(ctx: Context<ExecuteWithdrawal>) -> Result<()> {
    let withdrawal = &mut ctx.accounts.withdrawal;
    let vault = &ctx.accounts.vault;
    let vault_token_account = &ctx.accounts.vault_token_account;
    let clock = Clock::get()?;

    // 1. Validate: withdrawal must be Approved
    require!(
        withdrawal.status == WithdrawalStatus::Approved,
        VaultErrorCode::InvalidStatus
    );

    // 2. Check time delay (if it exists)
    if let Some(delay_until) = withdrawal.delay_until {
        require!(
            clock.unix_timestamp >= delay_until,
            VaultErrorCode::DelayNotPassed
        );
    }

    // 3. Check sufficient balance
    require!(
        vault_token_account.amount >= withdrawal.amount,
        VaultErrorCode::InsufficientBalance
    );

    // 4. Transfer tokens using CPI with PDA signing

    // Build the seeds that were used to create the vault PDA
    let seeds = &[
        Vault::SEED_PREFIX,
        vault.owner.as_ref(),
        vault.name.as_bytes(),
        &[vault.bump],
    ];

    // Wrap seeds for signing (required format)
    let signer_seeds = &[&seeds[..]];

    // Create the Transfer instruction accounts
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.destination_token_account.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };

    // Create CPI context with the signer seeds
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds
    );

    // Call the SPL Token transfer instruction
    token::transfer(cpi_ctx, withdrawal.amount)?;

    // 5. Update withdrawal record
    withdrawal.executed_at = Some(clock.unix_timestamp);
    withdrawal.status = WithdrawalStatus::Executed;

    msg!("✅ Withdrawal executed: {} tokens", withdrawal.amount);

    Ok(())
}

#[derive(Accounts)]
pub struct ExecuteWithdrawal<'info> {
    #[account(mut)]
    pub withdrawal: Account<'info, WithdrawalRequest>,

    #[account(
        seeds = [
            Vault::SEED_PREFIX,
            vault.owner.as_ref(),
            vault.name.as_bytes()
        ],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    /// Vault's token account (source of funds)
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Destination token account (where tokens go)
    #[account(mut)]
    pub destination_token_account: Account<'info, TokenAccount>,

    /// CHECK: The vault PDA itself, used as signing authority
    pub vault_authority: UncheckedAccount<'info>,

    /// SPL Token Program
    pub token_program: Program<'info, Token>,

    /// Person executing (anyone can execute, just pays gas)
    pub executor: Signer<'info>,
}
