using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Common.Interfaces;

/// <summary>
/// Port for administering who can sign in and what role they hold. Kept separate from
/// <see cref="IIdentityService"/>, which is about authenticating yourself — this is about
/// granting access to other people, and only an Owner may do it.
/// </summary>
public interface IUserAdminService
{
    /// <summary>Every login, a page at a time — ordered by email so the order is stable across pages.</summary>
    Task<PagedResult<AppUserDto>> ListUsersAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<Result<AppUserDto>> CreateUserAsync(string email, string password, string role, CancellationToken cancellationToken);

    Task<Result> SetRoleAsync(Guid userId, string role, CancellationToken cancellationToken);

    /// <summary>
    /// Sets a new password for someone who has lost theirs, without needing the old one — the shop
    /// owner is standing next to them, not proving anything to the system.
    ///
    /// Every refresh token that user holds is revoked at the same time. A reset is often prompted
    /// by an account being used by the wrong person, and leaving their existing sessions alive
    /// would let that carry on for as long as the tokens last.
    /// </summary>
    Task<Result> ResetPasswordAsync(Guid userId, string newPassword, CancellationToken cancellationToken);

    /// <summary>
    /// Issues a one-time code the user redeems to choose their own password.
    ///
    /// Preferred over <see cref="ResetPasswordAsync"/>: the Owner hands the code over in person and
    /// never learns the password that gets set. The plaintext is returned exactly once, because only
    /// its hash is stored — reopening the screen cannot show it again, and nor can the database.
    ///
    /// Their existing sessions are revoked immediately, not when the code is redeemed. A reset is
    /// often prompted by an account being in the wrong hands, and waiting would leave whoever has it
    /// signed in for as long as they avoid using the code.
    /// </summary>
    Task<Result<PasswordResetCodeDto>> IssueResetCodeAsync(Guid userId, CancellationToken cancellationToken);
}

public sealed record AppUserDto(Guid Id, string Email, string? Role);

/// <summary>The plaintext code and when it stops working. Shown once and never retrievable again.</summary>
public sealed record PasswordResetCodeDto(string Code, DateTime ExpiresAtUtc);
