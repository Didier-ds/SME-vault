use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode, MAX_STAFF};

pub fn handler(ctx: Context<AddStaff>, staff: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(
        vault.staff.len() < MAX_STAFF,
        VaultErrorCode::MaxStaffReached
    );

    require!(
        !vault.staff.contains(&staff),
        VaultErrorCode::DuplicateStaff
    );

    vault.staff.push(staff);

    msg!("Staff added successfully: {}", staff);

    Ok(())
}

#[derive(Accounts)]
pub struct  AddStaff<'info> {
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