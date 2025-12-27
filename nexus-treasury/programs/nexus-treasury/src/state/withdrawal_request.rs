use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct WithdrawalRequest {
    pub vault: Pubkey,              // Which vault is this for?
    pub amount: u64,                // How much to withdraw?
    pub destination: Pubkey,        // Where to send it?
    pub requester: Pubkey,          // Who requested it?

    #[max_len(200)]
    pub reason: String,             // Optional description

    #[max_len(10)]
    pub approvals: Vec<Pubkey>,     // Who approved so far?

    pub status: WithdrawalStatus,   // Current status
    pub created_at: i64,            // When created?
    pub delay_until: Option<i64>,   // When can execute? (None = no delay)
    pub executed_at: Option<i64>,   // When executed? (None = not yet)
    pub bump: u8,                   // PDA bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum WithdrawalStatus {
    Pending,
    Approved,
    Executed,
    Rejected
}

impl WithdrawalRequest {
    pub const SEED_PREFIX: &'static [u8] = b"withdrawal";
}