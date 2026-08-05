using System.Linq.Expressions;
using MathilensERP.Domain.Common;
using MathilensERP.Domain.Billing;
using MathilensERP.Domain.Customers;
using MathilensERP.Domain.Employees;
using MathilensERP.Domain.Identity;
using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Orders;
using MathilensERP.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Persistence;

/// <summary>
/// The solution's single EF Core <c>DbContext</c>, targeting PostgreSQL exclusively
/// (02_DATABASE.md § 2.1). Extends <see cref="IdentityDbContext{TUser,TRole,TKey}"/> so
/// ASP.NET Core Identity's persisted model and this product's own entities share one
/// database and one migration history.
/// </summary>
public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<Customer> Customers => Set<Customer>();

    public DbSet<Measurement> Measurements => Set<Measurement>();

    public DbSet<MeasurementHistory> MeasurementHistory => Set<MeasurementHistory>();

    public DbSet<Employee> Employees => Set<Employee>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<FabricDetails> FabricDetails => Set<FabricDetails>();

    public DbSet<Invoice> Invoices => Set<Invoice>();

    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        RenameIdentityTables(builder);
        ApplySoftDeleteQueryFilters(builder);
    }

    /// <summary>
    /// Renames ASP.NET Core Identity's default "AspNetXxx" join/claim tables to match
    /// the PascalCase naming standard in 02_DATABASE.md § 4.1.
    /// </summary>
    private static void RenameIdentityTables(ModelBuilder builder)
    {
        builder.Entity<IdentityUserRole<Guid>>(e => e.ToTable("UserRoles"));
        builder.Entity<IdentityUserClaim<Guid>>(e => e.ToTable("UserClaims"));
        builder.Entity<IdentityUserLogin<Guid>>(e => e.ToTable("UserLogins"));
        builder.Entity<IdentityUserToken<Guid>>(e => e.ToTable("UserTokens"));
        builder.Entity<IdentityRoleClaim<Guid>>(e => e.ToTable("RoleClaims"));
    }

    /// <summary>
    /// Applies the soft-delete global query filter (02_DATABASE.md § 5) to every entity
    /// implementing <see cref="ISoftDeletable"/>, centrally — so a future entity gets this
    /// behavior automatically just by implementing the interface, with nothing to remember
    /// to configure per entity (00_MASTER_SPEC.md § 16.2).
    /// </summary>
    private static void ApplySoftDeleteQueryFilters(ModelBuilder builder)
    {
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (!typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var isDeletedProperty = Expression.Property(parameter, nameof(ISoftDeletable.IsDeleted));
            var notDeleted = Expression.Not(isDeletedProperty);
            var lambda = Expression.Lambda(notDeleted, parameter);

            builder.Entity(entityType.ClrType).HasQueryFilter(lambda);
        }
    }
}
