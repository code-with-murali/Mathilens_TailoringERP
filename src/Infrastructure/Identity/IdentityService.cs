using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Domain.Identity;
using MathilensERP.Infrastructure.Persistence;
using MathilensERP.Shared.Authorization;
using MathilensERP.Shared.Results;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MathilensERP.Infrastructure.Identity;

/// <summary>
/// Implements the <see cref="IIdentityService"/> port defined in Application, using ASP.NET
/// Core Identity's <see cref="UserManager{TUser}"/>/<see cref="SignInManager{TUser}"/> for
/// credential verification and lockout, and hand-issuing JWT access tokens + opaque refresh
/// tokens (01_ARCHITECTURE.md § 17 Authentication Flow).
/// </summary>
public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtOptions _jwtOptions;

    public IdentityService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ApplicationDbContext dbContext,
        IOptions<JwtOptions> jwtOptions)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _dbContext = dbContext;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<Result<AuthTokensDto>> LoginAsync(string email, string password, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<AuthTokensDto>(InvalidCredentialsError());
        }

        var signInResult = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (!signInResult.Succeeded)
        {
            return Result.Failure<AuthTokensDto>(signInResult.IsLockedOut
                ? Error.Unauthorized("Auth.LockedOut", "This account is temporarily locked due to repeated failed sign-in attempts.")
                : InvalidCredentialsError());
        }

        var tokens = await IssueTokensAsync(user, cancellationToken);
        return Result.Success(tokens);
    }

    public async Task<Result<AuthTokensDto>> RegisterAsync(string email, string password, CancellationToken cancellationToken)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            return Result.Failure<AuthTokensDto>(
                Error.Conflict("Auth.EmailAlreadyRegistered", "An account with this email already exists."));
        }

        var user = new ApplicationUser { UserName = email, Email = email };
        var createResult = await _userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            var details = createResult.Errors
                .Select(e => new FieldError("password", e.Description))
                .ToList();
            return Result.Failure<AuthTokensDto>(
                Error.Validation("Auth.RegistrationFailed", "This account could not be created.", details));
        }

        // The very first account to register is the shop owner — otherwise nobody would hold the
        // permission to grant anyone else access, and the system would be locked out of itself.
        // Everyone after that starts with the least privilege and is raised deliberately.
        var isFirstUser = await _userManager.Users.CountAsync(cancellationToken) == 1;
        await _userManager.AddToRoleAsync(user, isFirstUser ? AppRoles.Owner : AppRoles.Tailor);

        var tokens = await IssueTokensAsync(user, cancellationToken);
        return Result.Success(tokens);
    }

    public async Task<Result<AuthTokensDto>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = Hash(refreshToken);
        var existingToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (existingToken is null)
        {
            return Result.Failure<AuthTokensDto>(InvalidRefreshTokenError());
        }

        var now = DateTime.UtcNow;

        if (existingToken.IsRevoked)
        {
            // Replay of an already-rotated/revoked token: treat as a compromise signal and
            // revoke every active token for this user (00_MASTER_SPEC.md § 10.1).
            await RevokeAllActiveTokensAsync(existingToken.UserId, now, cancellationToken);

            return Result.Failure<AuthTokensDto>(
                Error.Unauthorized("Auth.TokenReuseDetected", "This refresh token has already been used. All sessions have been revoked."));
        }

        if (existingToken.IsExpired(now))
        {
            return Result.Failure<AuthTokensDto>(
                Error.Unauthorized("Auth.RefreshTokenExpired", "The refresh token has expired."));
        }

        var user = await _userManager.FindByIdAsync(existingToken.UserId.ToString());
        if (user is null || user.IsDeleted)
        {
            return Result.Failure<AuthTokensDto>(InvalidRefreshTokenError());
        }

        var tokens = await IssueTokensAsync(user, cancellationToken, rotatedFrom: existingToken);
        return Result.Success(tokens);
    }

    private async Task RevokeAllActiveTokensAsync(Guid userId, DateTime nowUtc, CancellationToken cancellationToken)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.Revoke(nowUtc);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthTokensDto> IssueTokensAsync(ApplicationUser user, CancellationToken cancellationToken, RefreshToken? rotatedFrom = null)
    {
        var now = DateTime.UtcNow;
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateAccessToken(user, roles, now, out var accessTokenExpiresAtUtc);

        var rawRefreshToken = GenerateRefreshTokenValue();
        var refreshTokenEntity = RefreshToken.Issue(
            user.Id,
            Hash(rawRefreshToken),
            now,
            now.AddDays(_jwtOptions.RefreshTokenExpiryDays));

        _dbContext.RefreshTokens.Add(refreshTokenEntity);
        rotatedFrom?.Revoke(now, refreshTokenEntity.Id);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthTokensDto(accessToken, rawRefreshToken, accessTokenExpiresAtUtc);
    }

    private string GenerateAccessToken(ApplicationUser user, IList<string> roles, DateTime nowUtc, out DateTime expiresAtUtc)
    {
        expiresAtUtc = nowUtc.AddMinutes(_jwtOptions.AccessTokenExpiryMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var signingKey = new SymmetricSecurityKey(Convert.FromBase64String(_jwtOptions.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: nowUtc,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshTokenValue() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    /// <summary>Only the hash is ever persisted or looked up (02_DATABASE.md § 10.14).</summary>
    private static string Hash(string value) => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static Error InvalidCredentialsError() => Error.Unauthorized("Auth.InvalidCredentials", "Invalid email or password.");

    private static Error InvalidRefreshTokenError() => Error.Unauthorized("Auth.InvalidRefreshToken", "The refresh token is invalid.");
}
