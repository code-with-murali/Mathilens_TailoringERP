using System.Security.Claims;
using MathilensERP.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace MathilensERP.Api.Common.Authorization;

/// <summary>The permission an endpoint demands, e.g. <c>Orders.Manage</c>.</summary>
public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }

    public string Permission { get; }
}

/// <summary>
/// Grants access when any role on the caller's token carries the required permission.
///
/// Permissions are resolved from the role at request time rather than stamped into the token,
/// so changing what a role may do takes effect on the next request instead of waiting for every
/// outstanding access token to expire.
/// </summary>
public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var roles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        if (AppRoles.PermissionsFor(roles).Contains(requirement.Permission, StringComparer.Ordinal))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
