using MathilensERP.Application.Customers.Commands.Create;

namespace MathilensERP.UnitTests.Application.Customers.Commands.Create;

public class CreateCustomerCommandValidatorTests
{
    private readonly CreateCustomerCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_Passes()
    {
        var result = _validator.Validate(new CreateCustomerCommand("Asha Rao", "+91 98765 43210", "asha@example.com", "12 MG Road", "Notes"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithBlankFullName_Fails()
    {
        var result = _validator.Validate(new CreateCustomerCommand("", "+91 98765 43210", null, null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerCommand.FullName));
    }

    [Fact]
    public void Validate_WithBlankPhoneNumber_Fails()
    {
        var result = _validator.Validate(new CreateCustomerCommand("Asha Rao", "", null, null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerCommand.PhoneNumber));
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("12")]
    public void Validate_WithMalformedPhoneNumber_Fails(string phoneNumber)
    {
        var result = _validator.Validate(new CreateCustomerCommand("Asha Rao", phoneNumber, null, null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerCommand.PhoneNumber));
    }

    [Fact]
    public void Validate_WithMalformedEmail_Fails()
    {
        var result = _validator.Validate(new CreateCustomerCommand("Asha Rao", "+91 98765 43210", "not-an-email", null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerCommand.Email));
    }

    [Fact]
    public void Validate_WithNullEmail_Passes()
    {
        var result = _validator.Validate(new CreateCustomerCommand("Asha Rao", "+91 98765 43210", null, null, null));

        Assert.True(result.IsValid);
    }
}
