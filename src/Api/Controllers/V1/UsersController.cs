using System.Security.Claims;
using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Users;
using MathilensERP.Application.Authorization;
using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Shared.Authorization;
using MathilensERP.Shared.Results;
using MathilensERP.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public sealed class UsersController : ApiControllerBase
{
    private readonly IUserAdminService _userAdminService;
    private readonly IRolePermissionService _rolePermissions;

    public UsersController(IUserAdminService userAdminService, IRolePermissionService rolePermissions)
    {
        _userAdminService = userAdminService;
        _rolePermissions = rolePermissions;
    }

    /// <summary>
    /// The authenticated caller's identity, role and resolved permissions. The frontend uses the
    /// permission list to decide which screens and actions to offer — the server enforces the same
    /// list independently, so hiding a button is a courtesy, never the control.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var email = User.FindFirstValue(ClaimTypes.Email);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        // Through the same resolver the server enforces with, so the screens the frontend offers
        // and the calls it is actually allowed to make can never disagree.
        var permissions = await _rolePermissions.PermissionsForAsync(roles, cancellationToken);

        return Ok(ApiResponse<CurrentUserResponse>.Ok(new CurrentUserResponse(id, email, roles, permissions)));
    }

    /// <summary>Every login in the system with the role each one holds, paginated (00_MASTER_SPEC.md § 8.3).</summary>
    [HttpGet]
    [Authorize(Policy = Permissions.UsersView)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AppUserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var users = await _userAdminService.ListUsersAsync(page, pageSize, cancellationToken);
        return ToPagedActionResult(Result.Success(users));
    }

    /// <summary>The roles that can be assigned, so the UI never offers one the server would reject.</summary>
    [HttpGet("roles")]
    [Authorize(Policy = Permissions.UsersView)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<string>>), StatusCodes.Status200OK)]
    public IActionResult Roles() => Ok(ApiResponse<IReadOnlyList<string>>.Ok(AppRoles.All));

    /// <summary>Creates a login and assigns its role.</summary>
    [HttpPost]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(ApiResponse<AppUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.CreateUserAsync(request.Email, request.Password, request.Role, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Changes a user's role. Refused if it would remove the last Owner.</summary>
    [HttpPut("{id:guid}/role")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetRole(Guid id, [FromBody] SetUserRoleRequest request, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.SetRoleAsync(id, request.Role, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>
    /// Sets a new password for a user who has lost theirs, and signs them out everywhere by
    /// revoking their refresh tokens.
    /// </summary>
    [HttpPost("{id:guid}/password")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetUserPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.ResetPasswordAsync(id, request.NewPassword, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>
    /// Every role and every screen, with what each role may currently do — the rights grid in
    /// Settings. Readable by anyone who may see the Users screen.
    /// </summary>
    [HttpGet("role-permissions")]
    [Authorize(Policy = Permissions.UsersView)]
    [ProducesResponseType(typeof(ApiResponse<RolePermissionMatrixDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RolePermissions(CancellationToken cancellationToken)
    {
        var matrix = await _rolePermissions.GetMatrixAsync(cancellationToken);
        return Ok(ApiResponse<RolePermissionMatrixDto>.Ok(matrix));
    }

    /// <summary>
    /// Replaces what one role may do. Requires Users.Manage rather than Settings.Manage: this is
    /// access control, and a Manager holding Settings.Manage must not be able to grant themselves
    /// the right to hand out access.
    /// </summary>
    [HttpPut("role-permissions/{role}")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(ApiResponse<RolePermissionsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetRolePermissions(
        string role,
        [FromBody] SetRolePermissionsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _rolePermissions.SetPermissionsAsync(role, request.Permissions, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Restores a role to its built-in permissions.</summary>
    [HttpDelete("role-permissions/{role}")]
    [Authorize(Policy = Permissions.UsersManage)]
    [ProducesResponseType(typeof(ApiResponse<RolePermissionsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetRolePermissions(string role, CancellationToken cancellationToken)
    {
        var result = await _rolePermissions.ResetPermissionsAsync(role, cancellationToken);
        return ToActionResult(result);
    }
}
