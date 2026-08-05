using MathilensERP.Domain.Common;
using MathilensERP.Shared.Guards;

namespace MathilensERP.Domain.Customers;

/// <summary>
/// An individual who orders tailoring services from the shop (02_DATABASE.md § 10.3).
/// Anchors a customer's contact details and, once those modules exist, their
/// <c>Measurements</c> and <c>Orders</c> history.
/// </summary>
public sealed class Customer : AuditableEntity
{
    public string FullName { get; private set; } = string.Empty;

    /// <summary>The customer's primary contact method — required (02_DATABASE.md § 10.3
    /// Validation Rules) since the WhatsApp module correlates on it.</summary>
    public string PhoneNumber { get; private set; } = string.Empty;

    public string? Email { get; private set; }

    public string? Address { get; private set; }

    public string? Notes { get; private set; }

    private Customer()
    {
        // Reserved for EF Core materialization.
    }

    private Customer(Guid id)
        : base(id)
    {
    }

    public static Customer Create(string fullName, string phoneNumber, string? email, string? address, string? notes)
    {
        var customer = new Customer(Guid.NewGuid());
        customer.SetDetails(fullName, phoneNumber, email, address, notes);
        return customer;
    }

    public void UpdateDetails(string fullName, string phoneNumber, string? email, string? address, string? notes) =>
        SetDetails(fullName, phoneNumber, email, address, notes);

    private void SetDetails(string fullName, string phoneNumber, string? email, string? address, string? notes)
    {
        FullName = Guard.AgainstNullOrWhiteSpace(fullName, nameof(fullName));
        PhoneNumber = Guard.AgainstNullOrWhiteSpace(phoneNumber, nameof(phoneNumber));
        Email = email;
        Address = address;
        Notes = notes;
    }
}
