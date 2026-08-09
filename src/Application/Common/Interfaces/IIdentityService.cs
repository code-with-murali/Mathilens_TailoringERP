using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Common.Interfaces;

/// <summary>
/// Port for authentication (00_MASTER_SPEC.md § 10.1 / 01_ARCHITECTURE.md § 17 Authentication
/// Flow). Application depends only on this abstraction and the DTOs it defines — never on
/// ASP.NET Core Identity's <c>UserManager</c>/<c>ApplicationUser</c> directly, since those are
/// Infrastructure-layer types (01_ARCHITECTURE.md § 9.2). Implemented in Infrastructure.
/// </summary>
public interface IIdentityService
{
    Task<Result<AuthTokensDto>> LoginAsync(string email, string password, CancellationToken cancellationToken);

    /// <summary>
    /// Creates a new user account and, on success, signs them straight in — matching the
    /// pattern of a self-service sign-up page (00_MASTER_SPEC.md § 10.1).
    /// </summary>
    Task<Result<AuthTokensDto>> RegisterAsync(string email, string password, CancellationToken cancellationToken);

    /// <summary>
    /// Redeems a refresh token for a new token pair. The presented token is rotated
    /// (revoked and replaced); if it was already revoked, this is treated as a replay and
    /// every active refresh token for that user is revoked (00_MASTER_SPEC.md § 10.1).
    /// </summary>
    Task<Result<AuthTokensDto>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken);
}
