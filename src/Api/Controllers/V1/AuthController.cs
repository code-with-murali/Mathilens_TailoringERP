using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Auth;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Application.Auth.Commands.Login;
using MathilensERP.Application.Auth.Commands.RefreshAccessToken;
using MathilensERP.Application.Auth.Commands.Register;
using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Common.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>Authentication endpoints (00_MASTER_SPEC.md § 10.1). URL-segment versioned per § 8.2.</summary>
[ApiController]
[Route("api/v1/auth")]
[AllowAnonymous]
public sealed class AuthController : ApiControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Authenticates a user and issues a JWT access token + refresh token pair.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthTokensDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new LoginCommand(request.Email, request.Password), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Creates a new account and signs them straight in, issuing a JWT access token + refresh token pair.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthTokensDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new RegisterCommand(request.Email, request.Password), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Redeems a refresh token for a new token pair, rotating the presented token.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthTokensDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new RefreshAccessTokenCommand(request.RefreshToken), cancellationToken);
        return ToActionResult(result);
    }
}
