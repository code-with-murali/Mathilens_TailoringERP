using MathilensERP.Domain.Activity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MathilensERP.Infrastructure.Persistence.Configurations;

/// <summary>
/// Realizes the insert-only activity trail. No audit columns and no soft-delete flag: this table
/// <em>is</em> the audit record, and one that could be edited or hidden would be worthless.
/// </summary>
public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("ActivityLogs");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.UserName).HasMaxLength(256);

        builder.Property(a => a.Screen)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Action)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.RequestName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.OccurredAtUtc).IsRequired();

        // The log is always read newest-first and filtered by these three, so each filter path is
        // indexed. This table grows faster than any other in the schema.
        builder.HasIndex(a => a.OccurredAtUtc);
        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.Screen);
    }
}
