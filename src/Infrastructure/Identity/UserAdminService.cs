using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Shared.Authorization;
using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Identity;

/// <summary>
/// Implements <see cref="IUserAdminService"/> over ASP.NET Core Identity.
///
/// Exactly one role per user: a shop hands out "front desk" or "tailor", not a combination, and
/// allowing several would make what someone can do a question nobody can answer at a glance.
/// </summary>
public sealed class UserAdminService : IUserAdminService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly Persistence.ApplicationDbContext _dbContext;
    private readonly IPasswordHasher<ApplicationUser> _passwordHasher;

    public UserAdminService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        Persistence.ApplicationDbContext dbContext,
        IPasswordHasher<ApplicationUser> passwordHasher)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<PagedResult<AppUserDto>> ListUsersAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _userManager.Users.OrderBy(u => u.Email);

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // One role lookup per user on the page only — previously this ran for every user in the
        // system on every load, which is what made paging worth doing here at all.
        var items = new List<AppUserDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            items.Add(new AppUserDto(user.Id, user.Email ?? string.Empty, roles.FirstOrDefault()));
        }

        return new PagedResult<AppUserDto>(items, page, pageSize, totalCount);
    }

    public async Task<Result<AppUserDto>> CreateUserAsync(string email, string password, string role, CancellationToken cancellationToken)
    {
        // Against the role store rather than a fixed list: a shop can add its own roles on the
        // User Roles screen, and one created five minutes ago is as assignable as Front Desk.
        if (!await _roleManager.RoleExistsAsync(role))
        {
            return Result.Failure<AppUserDto>(Error.Validation("Users.UnknownRole", $"'{role}' is not a role in this system."));
        }

        if (await _userManager.FindByEmailAsync(email) is not null)
        {
            return Result.Failure<AppUserDto>(Error.Conflict("Users.EmailAlreadyRegistered", "An account with this email already exists."));
        }

        var user = new ApplicationUser { UserName = email, Email = email };
        var created = await _userManager.CreateAsync(user, password);
        if (!created.Succeeded)
        {
            var details = created.Errors.Select(e => new FieldError("password", e.Description)).ToList();
            return Result.Failure<AppUserDto>(Error.Validation("Users.CreateFailed", "This account could not be created.", details));
        }

        await _userManager.AddToRoleAsync(user, role);

        return Result.Success(new AppUserDto(user.Id, email, role));
    }

    public async Task<Result> SetRoleAsync(Guid userId, string role, CancellationToken cancellationToken)
    {
        if (!await _roleManager.RoleExistsAsync(role))
        {
            return Result.Failure(Error.Validation("Users.UnknownRole", $"'{role}' is not a role in this system."));
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure(Error.NotFound("Users.NotFound", $"No user was found with id '{userId}'."));
        }

        var currentRoles = await _userManager.GetRolesAsync(user);

        // Demoting the last Owner would leave nobody able to grant access to anyone, including
        // themselves — an unrecoverable state short of database surgery.
        if (currentRoles.Contains(AppRoles.Owner) && role != AppRoles.Owner)
        {
            var owners = await _userManager.GetUsersInRoleAsync(AppRoles.Owner);
            if (owners.Count <= 1)
            {
                return Result.Failure(Error.Conflict(
                    "Users.LastOwner", "This is the only Owner. Make someone else an Owner first."));
            }
        }

        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, role);

        return Result.Success();
    }

    public async Task<Result> ResetPasswordAsync(Guid userId, string newPassword, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure(Error.NotFound("Users.NotFound", $"No user was found with id '{userId}'."));
        }

        // Generate-and-redeem rather than RemovePassword/AddPassword: it is one atomic operation
        // that leaves the account with a password throughout, and it runs the configured policy.
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var reset = await _userManager.ResetPasswordAsync(user, token, newPassword);
        if (!reset.Succeeded)
        {
            var details = reset.Errors.Select(e => new FieldError("newPassword", e.Description)).ToList();
            return Result.Failure(Error.Validation("Users.ResetPasswordFailed", "This password could not be set.", details));
        }

        // A reset is often prompted by the account being in the wrong hands. Their existing
        // sessions must not outlive it, so every refresh token they hold is revoked, and the
        // security stamp is rolled so nothing minted from the old credentials survives.
        await _userManager.UpdateSecurityStampAsync(user);

        var now = DateTime.UtcNow;
        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);
        foreach (var activeToken in activeTokens)
        {
            activeToken.Revoke(now);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Lockout from earlier failed attempts would otherwise persist past the fix.
        await _userManager.ResetAccessFailedCountAsync(user);
        await _userManager.SetLockoutEndDateAsync(user, null);

        return Result.Success();
    }

    public async Task<Result<PasswordResetCodeDto>> IssueResetCodeAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure<PasswordResetCodeDto>(Error.NotFound("Users.NotFound", $"No user was found with id '{userId}'."));
        }

        var code = PasswordResetCodes.Generate();
        var expiresAtUtc = DateTime.UtcNow.Add(PasswordResetCodes.Lifetime);

        // Setting replaces any code already outstanding, so issuing a second one silently retires
        // the first. Two live codes for one account would double the guessing surface for no gain.
        await _userManager.SetAuthenticationTokenAsync(
            user,
            PasswordResetCodes.Provider,
            PasswordResetCodes.CodeHashName,
            PasswordResetCodes.Hash(_passwordHasher, user, code));

        await _userManager.SetAuthenticationTokenAsync(
            user,
            PasswordResetCodes.Provider,
            PasswordResetCodes.ExpiresName,
            expiresAtUtc.ToString("O"));

        // Sessions end now, not when the code is redeemed. Waiting would leave whoever currently
        // holds the account signed in for as long as they simply avoid using the code.
        await _userManager.UpdateSecurityStampAsync(user);

        var now = DateTime.UtcNow;
        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);
        foreach (var activeToken in activeTokens)
        {
            activeToken.Revoke(now);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // A locked-out account cannot sign in even with the new password, so the lockout goes too.
        await _userManager.ResetAccessFailedCountAsync(user);
        await _userManager.SetLockoutEndDateAsync(user, null);

        return Result.Success(new PasswordResetCodeDto(code, expiresAtUtc));
    }
}
