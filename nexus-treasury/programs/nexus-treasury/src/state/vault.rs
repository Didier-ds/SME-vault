use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub owner: Pubkey,
    #[max_len(50)]
    pub name: String,
    #[max_len(10)]
    pub approvers: Vec<Pubkey>,
    #[max_len(20)]
    pub staff: Vec<Pubkey>, 
    pub approval_threshold: u8,
    pub daily_limit: u64,
    pub tx_limit: u64,
    pub large_withdrawal_threshold: u64,
    pub delay_hours: u64,
    pub frozen: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl Vault {
    pub const SEED_PREFIX: &'static [u8] = b"vault";
}