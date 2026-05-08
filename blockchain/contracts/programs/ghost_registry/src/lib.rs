use anchor_lang::prelude::*;

declare_id!("5v95TCKx8XvdXKnGjFQUumdNwdAuM6prvcYx6YfZxBKH");

#[program]
pub mod ghost_registry {
    use super::*;

    // ── Username ──────────────────────────────────────────────────────

    pub fn register_username(ctx: Context<RegisterUsername>, username: String) -> Result<()> {
        require!(username.len() >= 3, ErrorCode::UsernameTooShort);
        require!(username.len() <= 32, ErrorCode::UsernameTooLong);

        let registry = &mut ctx.accounts.registry;
        registry.username = username.clone();
        registry.wallet = ctx.accounts.user.key();
        registry.bump = ctx.bumps.registry;
        registry.created_at = Clock::get()?.unix_timestamp;

        emit!(UsernameRegistered {
            username,
            wallet: ctx.accounts.user.key(),
        });

        Ok(())
    }

    pub fn update_wallet(ctx: Context<UpdateWallet>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        let old_wallet = registry.wallet;
        registry.wallet = ctx.accounts.new_wallet.key();

        emit!(WalletUpdated {
            username: registry.username.clone(),
            old_wallet,
            new_wallet: ctx.accounts.new_wallet.key(),
        });

        Ok(())
    }

    pub fn close_username(_ctx: Context<CloseUsername>) -> Result<()> {
        Ok(())
    }

    // ── Payment References ────────────────────────────────────────────

    pub fn create_payment_reference(
        ctx: Context<CreatePaymentReference>,
        id: String,
        amount: u64,
        source_chain: String,
    ) -> Result<()> {
        require!(id.len() <= 64, ErrorCode::IdentifierTooLong);
        require!(source_chain.len() <= 32, ErrorCode::ChainNameTooLong);

        let reference = &mut ctx.accounts.reference;
        reference.id = id.clone();
        reference.sender = ctx.accounts.payer.key();
        reference.receiver = ctx.accounts.registry.wallet;
        reference.amount = amount;
        reference.source_chain = source_chain;
        reference.status = PaymentStatus::Pending;
        reference.bump = ctx.bumps.reference;
        reference.created_at = Clock::get()?.unix_timestamp;

        emit!(PaymentReferenceCreated {
            id,
            sender: ctx.accounts.payer.key(),
            receiver: ctx.accounts.registry.wallet,
            username: ctx.accounts.registry.username.clone(),
            amount,
        });

        Ok(())
    }

    pub fn claim_payment_reference(ctx: Context<UpdatePaymentReference>, id: String) -> Result<()> {
        let reference = &mut ctx.accounts.reference;
        require!(
            reference.status == PaymentStatus::Pending,
            ErrorCode::PaymentAlreadyFinalized
        );

        reference.status = PaymentStatus::Claimed;

        emit!(PaymentReferenceClaimed {
            id,
            receiver: reference.receiver,
        });

        Ok(())
    }

    pub fn cancel_payment_reference(ctx: Context<UpdatePaymentReference>, id: String) -> Result<()> {
        let reference = &mut ctx.accounts.reference;
        require!(
            reference.status == PaymentStatus::Pending,
            ErrorCode::PaymentAlreadyFinalized
        );

        reference.status = PaymentStatus::Cancelled;

        emit!(PaymentReferenceCancelled {
            id,
            sender: reference.sender,
        });

        Ok(())
    }
}

// ── Contexts ────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterUsername<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UsernameRegistry::INIT_SPACE,
        seeds = [b"registry", username.as_bytes()],
        bump
    )]
    pub registry: Account<'info, UsernameRegistry>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateWallet<'info> {
    #[account(
        mut,
        has_one = wallet @ ErrorCode::Unauthorized
    )]
    pub registry: Account<'info, UsernameRegistry>,

    pub wallet: Signer<'info>,

    /// CHECK: new wallet address, only stored not executed
    pub new_wallet: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CloseUsername<'info> {
    #[account(
        mut,
        has_one = wallet @ ErrorCode::Unauthorized,
        close = wallet
    )]
    pub registry: Account<'info, UsernameRegistry>,

    pub wallet: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct CreatePaymentReference<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + PaymentReference::INIT_SPACE,
        seeds = [b"payment", registry.username.as_bytes(), id.as_bytes()],
        bump
    )]
    pub reference: Account<'info, PaymentReference>,

    pub registry: Account<'info, UsernameRegistry>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct UpdatePaymentReference<'info> {
    #[account(
        mut,
        seeds = [b"payment", registry.username.as_bytes(), id.as_bytes()],
        bump = reference.bump
    )]
    pub reference: Account<'info, PaymentReference>,

    pub registry: Account<'info, UsernameRegistry>,

    #[account(
        constraint = authority.key() == reference.sender
                  || authority.key() == reference.receiver
                  @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
}

// ── Accounts ────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct UsernameRegistry {
    #[max_len(32)]
    pub username: String,
    pub wallet: Pubkey,
    pub bump: u8,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct PaymentReference {
    #[max_len(64)]
    pub id: String,
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount: u64,
    #[max_len(32)]
    pub source_chain: String,
    pub status: PaymentStatus,
    pub bump: u8,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum PaymentStatus {
    Pending,
    Claimed,
    Cancelled,
}

// ── Events ──────────────────────────────────────────────────────────────

#[event]
pub struct UsernameRegistered {
    pub username: String,
    pub wallet: Pubkey,
}

#[event]
pub struct WalletUpdated {
    pub username: String,
    pub old_wallet: Pubkey,
    pub new_wallet: Pubkey,
}

#[event]
pub struct PaymentReferenceCreated {
    pub id: String,
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub username: String,
    pub amount: u64,
}

#[event]
pub struct PaymentReferenceClaimed {
    pub id: String,
    pub receiver: Pubkey,
}

#[event]
pub struct PaymentReferenceCancelled {
    pub id: String,
    pub sender: Pubkey,
}

// ── Errors ──────────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Username must be at least 3 characters")]
    UsernameTooShort,
    #[msg("Username must be 32 characters or less")]
    UsernameTooLong,
    #[msg("Identifier must be 64 characters or less")]
    IdentifierTooLong,
    #[msg("Chain name must be 32 characters or less")]
    ChainNameTooLong,
    #[msg("Payment has already been finalized")]
    PaymentAlreadyFinalized,
    #[msg("Not authorized")]
    Unauthorized,
}