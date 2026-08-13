using MathilensERP.Domain.Common;
using MathilensERP.Shared.Guards;

namespace MathilensERP.Domain.Employees;

/// <summary>
/// A staff member of the tailoring shop (02_DATABASE.md § 10.6) — the entity `Orders` are
/// assigned to for work tracking once the Tailoring Orders module exists.
///
/// <see cref="UserId"/> is the schema's place for the optional one-to-one link to a system
/// login (<c>Users</c>/<c>ApplicationUser</c>), per 02_DATABASE.md § 10.6 Relationships — but
/// no command in this module sets it yet. Linking an employee to a login account is an
/// admin/role-management flow, and that flow was already deferred in Phase 1
/// (03_ROADMAP.md: "admin role-management deferred to Phase 2 once a live database is
/// available to verify startup seeding against"), which remains true here for the same reason.
/// </summary>
public sealed class Employee : AuditableEntity
{
    /// <summary>The shop's own staff identifier (e.g. "EMP-014") — assigned by the shop, unique
    /// across live employees, and how staff refer to each other on a job card rather than by a
    /// system id nobody can read out loud.</summary>
    public string EmployeeCode { get; private set; } = string.Empty;

    public string FullName { get; private set; } = string.Empty;

    /// <summary>The employee's function in the shop (e.g. "Master Tailor", "Cutter") — free
    /// text, distinct from the system's RBAC <c>Roles</c> (02_DATABASE.md § 10.2).</summary>
    public string? JobTitle { get; private set; }

    public string? PhoneNumber { get; private set; }

    public string? Email { get; private set; }

    public Guid? UserId { get; private set; }

    private Employee()
    {
        // Reserved for EF Core materialization.
    }

    private Employee(Guid id)
        : base(id)
    {
    }

    public static Employee Create(string employeeCode, string fullName, string? jobTitle, string? phoneNumber, string? email)
    {
        var employee = new Employee(Guid.NewGuid());
        employee.SetDetails(employeeCode, fullName, jobTitle, phoneNumber, email);
        return employee;
    }

    public void UpdateDetails(string employeeCode, string fullName, string? jobTitle, string? phoneNumber, string? email) =>
        SetDetails(employeeCode, fullName, jobTitle, phoneNumber, email);

    private void SetDetails(string employeeCode, string fullName, string? jobTitle, string? phoneNumber, string? email)
    {
        // Trimmed because the code and phone are both compared for uniqueness — a trailing space
        // must not be what makes a second record "different".
        EmployeeCode = Guard.AgainstNullOrWhiteSpace(employeeCode, nameof(employeeCode)).Trim();
        FullName = Guard.AgainstNullOrWhiteSpace(fullName, nameof(fullName));
        JobTitle = jobTitle;
        PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
        Email = email;
    }
}
