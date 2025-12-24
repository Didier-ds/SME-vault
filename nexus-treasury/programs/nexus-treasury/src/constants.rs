use anchor_lang::prelude::*;

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const WITHDRAWAL_SEED: &[u8] = b"withdrawal";

pub const MAX_APPROVERS: usize = 10;
pub const MAX_STAFF: usize = 20;