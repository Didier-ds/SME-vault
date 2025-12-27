use anchor_lang::prelude::*;
use crate::{Vault,VaultErrorCode};

pub fn handler(ctx: Context<RemoveStaff>, staff: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    if!(vault.staff.contains(&staff)) {
        return Err(VaultErrorCode::StaffNotFound.into());
    }

    // Remove the staff
    vault.staff.retain(|&x| x != staff);

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveStaff<'info> {
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