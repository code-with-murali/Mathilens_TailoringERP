using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Shared.Authorization;
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

    public UserAdminService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<AppUserDto>> ListUsersAsync(CancellationToken cancellationToken)
    {
        var users = await _userManager.Users.OrderBy(u => u.Email).ToListAsync(cancellationToken);

        var result = new List<AppUserDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new AppUserDto(user.Id, user.Email ?? string.Empty, roles.FirstOrDefault()));
        }

        return result;
    }

    public async Task<Result<AppUserDto>> CreateUserAsync(string email, string password, string role, CancellationToken cancellationToken)
    {
        if (!AppRoles.IsKnownRole(role))
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
        if (!AppRoles.IsKnownRole(role))
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
}
