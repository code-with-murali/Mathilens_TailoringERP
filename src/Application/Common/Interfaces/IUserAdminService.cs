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
}

public sealed record AppUserDto(Guid Id, string Email, string? Role);
