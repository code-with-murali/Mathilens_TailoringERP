using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Customers;
using MathilensERP.Infrastructure.Identity;
using MathilensERP.Infrastructure.Persistence;
using MathilensERP.Infrastructure.Persistence.Customers;
using MathilensERP.Infrastructure.Persistence.Interceptors;
using MathilensERP.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MathilensERP.Infrastructure;

/// <summary>
/// Infrastructure's half of the composition root (01_ARCHITECTURE.md § 10 Dependency
/// Injection Strategy) — called once from Api's <c>Program.cs</c>. This is the only place
/// port interfaces defined in Application are bound to their Infrastructure implementations.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException(
                "Connection string 'Default' is not configured (00_MASTER_SPEC.md § 13.1 Environment Variables).");

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<AuditableEntitySaveChangesInterceptor>();

        // AddIdentityCore's default token providers (used for password reset, email
        // confirmation, etc.) need IDataProtectionProvider. A full WebApplication host
        // registers this automatically at runtime, but EF Core's design-time host (used by
        // `dotnet ef migrations`) does not — so it is registered explicitly here.
        services.AddDataProtection();

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
            options.UseNpgsql(connectionString)
                .AddInterceptors(sp.GetRequiredService<AuditableEntitySaveChangesInterceptor>()));

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                // 00_MASTER_SPEC.md § 10.4 Password Policy.
                options.Password.RequiredLength = 12;
                options.Password.RequireNonAlphanumeric = false;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        services
            .AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();

        return services;
    }
}
