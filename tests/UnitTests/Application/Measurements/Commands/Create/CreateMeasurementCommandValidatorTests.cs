using MathilensERP.Application.Measurements.Commands.Create;
using MathilensERP.Domain.Measurements;

namespace MathilensERP.UnitTests.Application.Measurements.Commands.Create;

public class CreateMeasurementCommandValidatorTests
{
    private readonly CreateMeasurementCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_Passes()
    {
        var result = _validator.Validate(new CreateMeasurementCommand(Guid.NewGuid(), GarmentType.Shirt, new Dictionary<string, decimal> { ["Chest"] = 40 }));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithEmptyCustomerId_Fails()
    {
        var result = _validator.Validate(new CreateMeasurementCommand(Guid.Empty, GarmentType.Shirt, new Dictionary<string, decimal> { ["Chest"] = 40 }));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateMeasurementCommand.CustomerId));
    }

    [Fact]
    public void Validate_WithNoValues_Fails()
    {
        var result = _validator.Validate(new CreateMeasurementCommand(Guid.NewGuid(), GarmentType.Shirt, new Dictionary<string, decimal>()));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateMeasurementCommand.Values));
    }

    [Fact]
    public void Validate_WithNonPositiveValue_Fails()
    {
        var result = _validator.Validate(new CreateMeasurementCommand(Guid.NewGuid(), GarmentType.Shirt, new Dictionary<string, decimal> { ["Chest"] = 0 }));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WithUndefinedGarmentType_Fails()
    {
        var result = _validator.Validate(new CreateMeasurementCommand(Guid.NewGuid(), (GarmentType)999, new Dictionary<string, decimal> { ["Chest"] = 40 }));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateMeasurementCommand.GarmentType));
    }
}
