using MathilensERP.Domain.Employees;
using MathilensERP.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MathilensERP.Infrastructure.Persistence.Configurations;

/// <summary>Realizes the "Employees" entity (02_DATABASE.md § 10.6).</summary>
public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.EmployeeCode)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(e => e.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.JobTitle)
            .HasMaxLength(100);

        builder.Property(e => e.PhoneNumber)
            .HasMaxLength(20);

        builder.Property(e => e.Email)
            .HasMaxLength(256);

        builder.Property(e => e.CreatedBy).IsRequired();
        builder.Property(e => e.CreatedAtUtc).IsRequired();

        // 02_DATABASE.md § 10.6 Validation Rules: "if linked to a Users record, the link must
        // be unique" — a real FK constraint (§ 4.4), enforced without a Domain-level reference
        // to the Infrastructure-only ApplicationUser type.
        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<Employee>(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => e.UserId)
            .IsUnique()
            .HasFilter("\"UserId\" IS NOT NULL");

        // 02_DATABASE.md § 10.6 Index Recommendations: active-staff lookups filter on IsDeleted.
        builder.HasIndex(e => e.IsDeleted);

        // The staff code and phone number each identify one person. Both are unique across live
        // employees only — a soft-deleted record must not reserve a code or a number forever —
        // and the phone filter also excludes NULL, since "no phone recorded" is not a clash.
        // The application layer reports either collision as a friendly conflict; these indexes
        // are the backstop two simultaneous requests can't slip past.
        builder.HasIndex(e => e.EmployeeCode)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.HasIndex(e => e.PhoneNumber)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false AND \"PhoneNumber\" IS NOT NULL");

        builder.Property<uint>("xmin").IsRowVersion();
    }
}
