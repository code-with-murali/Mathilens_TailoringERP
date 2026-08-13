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

    public Gender? Gender { get; private set; }

    public Religion? Religion { get; private set; }

    /// <summary>Date only — the shop greets customers on their birthday, it doesn't need the hour.</summary>
    public DateOnly? DateOfBirth { get; private set; }

    /// <summary>Wedding anniversary. Useful to a tailor: anniversaries drive occasion wear.</summary>
    public DateOnly? WeddingDate { get; private set; }

    private Customer()
    {
        // Reserved for EF Core materialization.
    }

    private Customer(Guid id)
        : base(id)
    {
    }

    public static Customer Create(
        string fullName,
        string phoneNumber,
        string? email,
        string? address,
        string? notes,
        Gender? gender = null,
        Religion? religion = null,
        DateOnly? dateOfBirth = null,
        DateOnly? weddingDate = null)
    {
        var customer = new Customer(Guid.NewGuid());
        customer.SetDetails(fullName, phoneNumber, email, address, notes, gender, religion, dateOfBirth, weddingDate);
        return customer;
    }

    public void UpdateDetails(
        string fullName,
        string phoneNumber,
        string? email,
        string? address,
        string? notes,
        Gender? gender = null,
        Religion? religion = null,
        DateOnly? dateOfBirth = null,
        DateOnly? weddingDate = null) =>
        SetDetails(fullName, phoneNumber, email, address, notes, gender, religion, dateOfBirth, weddingDate);

    private void SetDetails(
        string fullName,
        string phoneNumber,
        string? email,
        string? address,
        string? notes,
        Gender? gender,
        Religion? religion,
        DateOnly? dateOfBirth,
        DateOnly? weddingDate)
    {
        FullName = Guard.AgainstNullOrWhiteSpace(fullName, nameof(fullName));
        // Trimmed because the phone number is compared for uniqueness — a trailing space must
        // not be what makes a second customer "different".
        PhoneNumber = Guard.AgainstNullOrWhiteSpace(phoneNumber, nameof(phoneNumber)).Trim();
        Email = email;
        Address = address;
        Notes = notes;
        Gender = gender;
        Religion = religion;
        DateOfBirth = dateOfBirth;
        WeddingDate = weddingDate;
    }
}
