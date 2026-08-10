using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Common.Interfaces;

/// <summary>
/// Port for administering who can sign in and what role they hold. Kept separate from
/// <see cref="IIdentityService"/>, which is about authenticating yourself — this is about
/// granting access to other people, and only an Owner may do it.
/// </summary>
public interface IUserAdminService
{
    Task<IReadOnlyList<AppUserDto>> ListUsersAsync(CancellationToken cancellationToken);

    Task<Result<AppUserDto>> CreateUserAsync(string email, string password, string role, CancellationToken cancellationToken);

    Task<Result> SetRoleAsync(Guid userId, string role, CancellationToken cancellationToken);
}

public sealed record AppUserDto(Guid Id, string Email, string? Role);
