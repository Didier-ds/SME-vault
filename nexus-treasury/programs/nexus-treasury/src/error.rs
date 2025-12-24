use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
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
    
    #[msg("Custom error message")]
    CustomError,
}
