use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode};

pub fn handler(ctx: Context<FreezeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    vault.frozen = true;

    Ok(())
}

#[derive(Accounts)]
pub struct FreezeVault<'info> {
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

