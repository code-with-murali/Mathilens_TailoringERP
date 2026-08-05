using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace MathilensERP.IntegrationTests;

/// <summary>
/// Boots the real Api host with test-safe configuration overrides, so tests never depend on
/// (or risk touching) a developer's local appsettings.Development.json values. The connection
/// string here is never actually connected to by the tests in this fixture — they exercise
/// paths that fail fast before reaching the database (00_MASTER_SPEC.md § 12.3: every
/// endpoint has at least one success- and error-path test; the DB-touching success paths are
/// covered separately once a real PostgreSQL instance is available — see 03_ROADMAP.md).
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = "Host=localhost;Port=5432;Database=mathilens_test;Username=postgres;Password=postgres",
                ["Jwt:SigningKey"] = "dGVzdC1zaWduaW5nLWtleS1mb3ItaW50ZWdyYXRpb24tdGVzdHMtb25seS1kby1ub3QtdXNlLWluLXByb2Q9",
                ["Jwt:Issuer"] = "MathilensERP.Api.Tests",
                ["Jwt:Audience"] = "MathilensERP.Client.Tests",
                ["Jwt:AccessTokenExpiryMinutes"] = "15",
                ["Jwt:RefreshTokenExpiryDays"] = "30",
            });
        });
    }
}
