using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace MathilensERP.IntegrationTests;

/// <summary>
/// Hand-issues a JWT matching <see cref="CustomWebApplicationFactory"/>'s test signing
/// key/issuer/audience, so tests can exercise a protected endpoint's logic (past the
/// `[Authorize]` gate) without a live database — JWT bearer validation is entirely
/// self-contained (signature + claims), it never queries the database.
/// </summary>
internal static class TestAuthentication
{
    private const string SigningKey = "dGVzdC1zaWduaW5nLWtleS1mb3ItaW50ZWdyYXRpb24tdGVzdHMtb25seS1kby1ub3QtdXNlLWluLXByb2Q9";
    private const string Issuer = "MathilensERP.Api.Tests";
    private const string Audience = "MathilensERP.Client.Tests";

    public static string CreateBearerToken(Guid? userId = null)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, (userId ?? Guid.NewGuid()).ToString()),
            new Claim(ClaimTypes.Email, "test-user@shop.example"),
        };

        var signingKey = new SymmetricSecurityKey(Convert.FromBase64String(SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
