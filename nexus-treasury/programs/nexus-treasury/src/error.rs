use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid name: Name must be between 1 and 50 characters")]
    InvalidName,
    
    #[msg("Invalid threshold: Threshold must be > 0 and <= number of approvers")]
    InvalidThreshold,
    
    #[msg("Invalid limit: Limit must be greater than 0")]
    InvalidLimit,
    
    #[msg("Custom error message")]
    CustomError,
}
