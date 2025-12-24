pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::ErrorCode;
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
}
