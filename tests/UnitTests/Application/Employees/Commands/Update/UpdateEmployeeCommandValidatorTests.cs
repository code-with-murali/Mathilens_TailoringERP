using MathilensERP.Application.Employees.Commands.Update;

namespace MathilensERP.UnitTests.Application.Employees.Commands.Update;

public class UpdateEmployeeCommandValidatorTests
{
    private readonly UpdateEmployeeCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_Passes()
    {
        var result = _validator.Validate(new UpdateEmployeeCommand(Guid.NewGuid(), "EMP-001", "Ravi Kumar", null, null, null));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithEmptyId_Fails()
    {
        var result = _validator.Validate(new UpdateEmployeeCommand(Guid.Empty, "EMP-001", "Ravi Kumar", null, null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateEmployeeCommand.Id));
    }

    [Fact]
    public void Validate_WithBlankFullName_Fails()
    {
        var result = _validator.Validate(new UpdateEmployeeCommand(Guid.NewGuid(), "EMP-001", "", null, null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateEmployeeCommand.FullName));
    }
}
