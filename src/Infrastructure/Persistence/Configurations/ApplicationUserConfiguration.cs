using MathilensERP.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MathilensERP.Infrastructure.Persistence.Configurations;

/// <summary>Realizes the "Users" entity documented in 02_DATABASE.md § 10.1.</summary>
public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        // 02_DATABASE.md § 4.1 Table Naming: PascalCase, plural noun — not Identity's
        // default "AspNetUsers".
        builder.ToTable("Users");

        // 02_DATABASE.md § 7 Concurrency — PostgreSQL's native xmin system column,
        // exposed as a shadow property (no corresponding CLR property needed).
        builder.Property<uint>("xmin").IsRowVersion();

        builder.Property(u => u.CreatedBy).IsRequired();
        builder.Property(u => u.CreatedAtUtc).IsRequired();

        // 02_DATABASE.md § 10.1 Index Recommendations.
        builder.HasIndex(u => u.IsDeleted);
    }
}
