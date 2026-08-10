using System.Security.Claims;
using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Users;
using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public sealed class UsersController : ApiControllerBase
{
    private readonly IUserAdminService _userAdminService;

    public UsersController(IUserAdminService userAdminService)
    {
        _userAdminService = userAdminService;
    }

    /// <summary>
    /// The authenticated caller's identity, role and resolved permissions. The frontend uses the
    /// permission list to decide which screens and actions to offer — the server enforces the same
    /// list independently, so hiding a button is a courtesy, never the control.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var email = User.FindFirstValue(ClaimTypes.Email);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var permissions = AppRoles.PermissionsFor(roles);

        return Ok(ApiResponse<CurrentUserResponse>.Ok(new CurrentUserResponse(id, email, roles, permissions)));
    }

    /// <summary>Every login in the system, with the role each one holds.</summary>
    [HttpGet]
    [Authorize(Policy = Permissions.UsersView)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AppUserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var users = await _userAdminService.ListUsersAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AppUserDto>>.Ok(users));
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
}
