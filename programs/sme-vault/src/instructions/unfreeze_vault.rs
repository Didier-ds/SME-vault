use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode};

pub fn handler(ctx: Context<UnfreezeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    vault.frozen = false;

    Ok(())
}

#[derive(Accounts)]
pub struct UnfreezeVault<'info> {
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

