using MathilensERP.Application.Employees.Commands.Create;

namespace MathilensERP.UnitTests.Application.Employees.Commands.Create;

public class CreateEmployeeCommandValidatorTests
{
    private readonly CreateEmployeeCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_Passes()
    {
        var result = _validator.Validate(new CreateEmployeeCommand("Ravi Kumar", "Tailor", "+91 98765 43210", "ravi@example.com"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithOnlyFullName_Passes()
    {
        var result = _validator.Validate(new CreateEmployeeCommand("Ravi Kumar", null, null, null));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithBlankFullName_Fails()
    {
        var result = _validator.Validate(new CreateEmployeeCommand("", null, null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateEmployeeCommand.FullName));
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("12")]
    public void Validate_WithMalformedPhoneNumber_Fails(string phoneNumber)
    {
        var result = _validator.Validate(new CreateEmployeeCommand("Ravi Kumar", null, phoneNumber, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateEmployeeCommand.PhoneNumber));
    }

    [Fact]
    public void Validate_WithMalformedEmail_Fails()
    {
        var result = _validator.Validate(new CreateEmployeeCommand("Ravi Kumar", null, null, "not-an-email"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateEmployeeCommand.Email));
    }
}
