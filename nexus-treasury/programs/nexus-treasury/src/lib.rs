pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::VaultErrorCode;
pub use instructions::*;
pub use state::*;

declare_id!("87oBsf59JzNKiCwqhpzKceYgJm1LnwPdnA3FxCE29D7p");

#[program]
pub mod nexus_treasury {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn create_vault(
        ctx: Context<CreateVault>,
        name: String,
        approval_threshold: u8,
        daily_limit: u64,
        tx_limit: u64,
        large_withdrawal_threshold: u64,
        delay_hours: u64,
    ) -> Result<()> {
        instructions::create_vault::handler(
            ctx,
            name,
            approval_threshold,
            daily_limit,
            tx_limit,
            large_withdrawal_threshold,
            delay_hours,
        )
    }

    pub fn add_approver(
        ctx: Context<AddApprover>,
        approver: Pubkey,
    ) -> Result<()> {
        instructions::add_approver::handler(ctx, approver)
    }

    pub fn remove_approver(
        ctx: Context<RemoveApprover>,
        approver: Pubkey
    ) -> Result<()> {
        instructions::remove_approver::handler(ctx, approver)
    }

    pub fn add_staff(ctx: Context<AddStaff>, staff: Pubkey) -> Result<()> {
        instructions::add_staff::handler(ctx, staff)
    }

    pub fn remove_staff(ctx: Context<RemoveStaff>, staff: Pubkey) -> Result<()> {
        instructions::staff::remove_staff::handler(ctx, staff)
    }

    pub fn request_withdrawal(
        ctx: Context<RequestWithdrawal>,
        amount: u64,
        destination: Pubkey,
        reason: String,
    ) -> Result<()> {
        instructions::request_withdrawal::handler(ctx, amount, destination, reason)
    }

    pub fn approve_withdrawal(ctx: Context<ApproveWithdrawal>) -> Result<()> {
        instructions::withdrawals::approve_withdrawal::handler(ctx)
    }

    pub fn execute_withdrawal(ctx: Context<ExecuteWithdrawal>) -> Result<()> {
        instructions::withdrawals::execute_withdrawal::handler(ctx)
    }
}
