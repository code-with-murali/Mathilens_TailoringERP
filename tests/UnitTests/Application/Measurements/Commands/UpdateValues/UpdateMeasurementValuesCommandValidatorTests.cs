using MathilensERP.Application.Measurements.Commands.UpdateValues;

namespace MathilensERP.UnitTests.Application.Measurements.Commands.UpdateValues;

public class UpdateMeasurementValuesCommandValidatorTests
{
    private readonly UpdateMeasurementValuesCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_Passes()
    {
        var result = _validator.Validate(new UpdateMeasurementValuesCommand(Guid.NewGuid(), new Dictionary<string, decimal> { ["Chest"] = 42 }));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithEmptyId_Fails()
    {
        var result = _validator.Validate(new UpdateMeasurementValuesCommand(Guid.Empty, new Dictionary<string, decimal> { ["Chest"] = 42 }));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateMeasurementValuesCommand.Id));
    }

    [Fact]
    public void Validate_WithNoValues_Fails()
    {
        var result = _validator.Validate(new UpdateMeasurementValuesCommand(Guid.NewGuid(), new Dictionary<string, decimal>()));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateMeasurementValuesCommand.Values));
    }
}
