namespace MathilensERP.Application.Common.Interfaces;

/// <summary>Issued token pair returned by a successful login or refresh (00_MASTER_SPEC.md § 10.1).</summary>
public sealed record AuthTokensDto(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAtUtc);
