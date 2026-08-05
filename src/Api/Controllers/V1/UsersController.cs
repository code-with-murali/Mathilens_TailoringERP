using System.Security.Claims;
using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public sealed class UsersController : ApiControllerBase
{
    /// <summary>
    /// Returns the authenticated caller's identity from their JWT claims — the first
    /// protected endpoint, proving the bearer authentication middleware actually enforces
    /// access (01_ARCHITECTURE.md § 18 Authorization Flow).
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var email = User.FindFirstValue(ClaimTypes.Email);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        return Ok(ApiResponse<CurrentUserResponse>.Ok(new CurrentUserResponse(id, email, roles)));
    }
}
