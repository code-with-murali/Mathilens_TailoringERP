using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace MathilensERP.IntegrationTests;

/// <summary>
/// Boots the real Api host with test-safe configuration overrides, so tests never depend on
/// (or risk touching) a developer's local appsettings.Development.json values.
///
/// <para>
/// This fixture needs a real PostgreSQL on the connection string below. It did not always: these
/// tests were written to exercise paths that fail fast before reaching the database, and the
/// connection string was never actually opened. Authorization now resolves a role's permissions
/// from the database on each request — so that changing what a role may do takes effect on the
/// next request rather than when every outstanding token expires — and authorization runs before
/// model validation. Every authenticated request therefore touches the database, including the
/// ones that only assert a 400 envelope. CI provisions Postgres as a service container; locally,
/// a database named <c>mathilens_test</c> on the default port is what these expect.
/// </para>
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

        // Without this, an unhandled exception inside the host is invisible: the test sees only the
        // 500 the error middleware turned it into, and on a CI machine there is nothing else to
        // read. Logging to the console puts the actual stack trace in the build output, where a
        // failure that does not reproduce locally can still be diagnosed.
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddSimpleConsole(o => o.SingleLine = false);
            logging.SetMinimumLevel(LogLevel.Warning);
        });
    }
}
