using System.Text.Json;
using MathilensERP.Application.Measurements.Templates;
using MathilensERP.Application.Measurements.Templates.Commands;
using MathilensERP.Application.Settings;
using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Settings;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Measurements.Templates;

public class SetMeasurementTemplateCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithNoStoredTemplate_AddsOneHoldingThePointsInOrder()
    {
        var repository = Substitute.For<ISettingRepository>();
        repository.GetByKeyAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((Setting?)null);
        var handler = new SetMeasurementTemplateCommandHandler(repository);

        var result = await handler.Handle(
            new SetMeasurementTemplateCommand(GarmentType.Trousers, ["Length", "Waist"]), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(["Length", "Waist"], result.Value.Points);
        repository.Received(1).Add(Arg.Is<Setting>(s =>
            s != null &&
            s.Key == MeasurementTemplateKeys.For(GarmentType.Trousers) &&
            s.Value == JsonSerializer.Serialize(new[] { "Length", "Waist" })));
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithAStoredTemplate_ReplacesItRatherThanAddingASecond()
    {
        var existing = Setting.Create(MeasurementTemplateKeys.For(GarmentType.Shirt), "[\"Neck\"]");
        var repository = Substitute.For<ISettingRepository>();
        repository.GetByKeyAsync(MeasurementTemplateKeys.For(GarmentType.Shirt), Arg.Any<CancellationToken>()).Returns(existing);
        var handler = new SetMeasurementTemplateCommandHandler(repository);

        await handler.Handle(new SetMeasurementTemplateCommand(GarmentType.Shirt, ["Chest", "Neck"]), CancellationToken.None);

        Assert.Equal(JsonSerializer.Serialize(new[] { "Chest", "Neck" }), existing.Value);
        repository.DidNotReceive().Add(Arg.Any<Setting>());
    }

    [Fact]
    public async Task Handle_TrimsPointNames()
    {
        var repository = Substitute.For<ISettingRepository>();
        var handler = new SetMeasurementTemplateCommandHandler(repository);

        var result = await handler.Handle(
            new SetMeasurementTemplateCommand(GarmentType.Blouse, ["  Waist  "]), CancellationToken.None);

        // Values are stored keyed by point name, so a stray space would key them differently.
        Assert.Equal(["Waist"], result.Value.Points);
    }
}

public class ResetMeasurementTemplateCommandHandlerTests
{
    [Fact]
    public async Task Handle_RemovesTheStoredTemplateAndReturnsTheDefault()
    {
        var existing = Setting.Create(MeasurementTemplateKeys.For(GarmentType.Dress), "[\"Length\"]");
        var repository = Substitute.For<ISettingRepository>();
        repository.GetByKeyAsync(MeasurementTemplateKeys.For(GarmentType.Dress), Arg.Any<CancellationToken>()).Returns(existing);
        var handler = new ResetMeasurementTemplateCommandHandler(repository);

        var result = await handler.Handle(new ResetMeasurementTemplateCommand(GarmentType.Dress), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(MeasurementTemplateDefaults.For(GarmentType.Dress), result.Value.Points);
        Assert.False(result.Value.IsCustomised);
        repository.Received(1).Remove(existing);
    }

    [Fact]
    public async Task Handle_WhenAlreadyOnTheDefault_SucceedsWithoutSaving()
    {
        var repository = Substitute.For<ISettingRepository>();
        repository.GetByKeyAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((Setting?)null);
        var handler = new ResetMeasurementTemplateCommandHandler(repository);

        var result = await handler.Handle(new ResetMeasurementTemplateCommand(GarmentType.Suit), CancellationToken.None);

        Assert.True(result.IsSuccess);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}

public class SetMeasurementTemplateCommandValidatorTests
{
    private readonly SetMeasurementTemplateCommandValidator _validator = new();

    [Fact]
    public void Validate_WithPoints_Passes()
    {
        var result = _validator.Validate(new SetMeasurementTemplateCommand(GarmentType.Shirt, ["Neck", "Chest"]));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WithNoPoints_Fails()
    {
        var result = _validator.Validate(new SetMeasurementTemplateCommand(GarmentType.Shirt, []));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WithABlankPointName_Fails()
    {
        var result = _validator.Validate(new SetMeasurementTemplateCommand(GarmentType.Shirt, ["Neck", " "]));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WithDuplicatePointNames_Fails()
    {
        // Values are stored keyed by point name, so two "Waist" rows would collapse into one.
        var result = _validator.Validate(new SetMeasurementTemplateCommand(GarmentType.Shirt, ["Waist", "waist"]));

        Assert.False(result.IsValid);
    }
}
