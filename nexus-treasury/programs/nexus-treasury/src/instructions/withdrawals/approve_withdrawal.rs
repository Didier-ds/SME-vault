use anchor_lang::prelude::*;
use crate::{Vault, VaultErrorCode, WithdrawalRequest, WithdrawalStatus};

pub fn handler(ctx:Context<ApproveWithdrawal>) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let withdrawal = &mut ctx.accounts.withdrawal;
    let approver = &ctx.accounts.approver;

    require!(
        vault.approvers.contains(&approver.key()),
        VaultErrorCode::Unauthorized
    );

    require!(
        withdrawal.status == WithdrawalStatus::Pending,
        VaultErrorCode::InvalidStatus
    );

    require!(
        !withdrawal.approvals.contains(&approver.key()),
        VaultErrorCode::AlreadyApproved
    );

    require!(
       approver.key() != withdrawal.requester,
        VaultErrorCode::SelfApprovalNotAllowed
    );

    withdrawal.approvals.push(approver.key());

    if (withdrawal.approvals.len() >= vault.approval_threshold as usize) {
        withdrawal.status = WithdrawalStatus::Approved
    }

    Ok(())
}

#[derive(Accounts)]
pub struct ApproveWithdrawal<'info> {
    #[account(mut)]
    pub withdrawal: Account<'info, WithdrawalRequest>,

    pub vault: Account<'info, Vault>,
    pub approver: Signer<'info>
}