use anchor_lang::prelude::*;

#[error_code]
pub enum VaultErrorCode {
    #[msg("Invalid name: Name must be between 1 and 50 characters")]
    InvalidName,
    
    #[msg("Invalid threshold: Threshold must be > 0 and <= number of approvers")]
    InvalidThreshold,
    
    #[msg("Invalid limit: Limit must be greater than 0")]
    InvalidLimit,

    #[msg("Unauthorized: You are not authorized to perform this action")]
    Unauthorized,

    #[msg("Max approvers reached: Cannot add more than 10 approvers")]
    MaxApproversReached,

    #[msg("Duplicate approver: Approver is already in the list")]
    DuplicateApprover,

    #[msg("Approver not found")]
    ApproverNotFound,

    #[msg("Max staff reached: Cannot add more than 20 staff members")]
    MaxStaffReached,

    #[msg("Duplicate staff: Staff member is already in the list")]
    DuplicateStaff,

    #[msg("Staff not found")]
    StaffNotFound,

    #[msg("Vault is frozen: Cannot perform this action while vault is frozen")]
    VaultFrozen,

    #[msg("Exceeds limit: Amount exceeds configured transaction limit")]
    ExceedsLimit,

    #[msg("Invalid status: Operation not allowed for current withdrawal status")]
    InvalidStatus,

    #[msg("Already approved: This approver has already approved this request")]
    AlreadyApproved,

    #[msg("Self-approval not allowed: Cannot approve your own withdrawal request")]
    SelfApprovalNotAllowed,

    #[msg("Insufficient approvals: Not enough approvals to execute withdrawal")]
    InsufficientApprovals,

    #[msg("Delay not passed: Time delay period has not elapsed yet")]
    DelayNotPassed,

    #[msg("Insufficient balance: Vault does not have enough tokens")]
    InsufficientBalance,

    #[msg("Custom error message")]
    CustomError,
}
