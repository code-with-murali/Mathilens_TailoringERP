using System.Text.Json;
using MathilensERP.Application.Measurements.Templates;
using MathilensERP.Application.Measurements.Templates.Queries;
using MathilensERP.Application.Settings;
using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Settings;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Measurements.Templates;

public class GetMeasurementTemplatesQueryHandlerTests
{
    private static ISettingRepository RepositoryReturning(params Setting[] settings)
    {
        var repository = Substitute.For<ISettingRepository>();
        repository.ListByKeyPrefixAsync(MeasurementTemplateKeys.Prefix, Arg.Any<CancellationToken>())
            .Returns(settings);
        return repository;
    }

    [Fact]
    public async Task Handle_WithNothingConfigured_ReturnsADefaultForEveryGarmentType()
    {
        var handler = new GetMeasurementTemplatesQueryHandler(RepositoryReturning());

        var result = await handler.Handle(new GetMeasurementTemplatesQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(Enum.GetValues<GarmentType>().Length, result.Value.Count);
        // Every garment type is measurable out of the box — previously only Shirt and Trousers were.
        Assert.All(result.Value, t => Assert.NotEmpty(t.Points));
        Assert.All(result.Value, t => Assert.False(t.IsCustomised));
    }

    [Fact]
    public async Task Handle_WithAStoredTemplate_PrefersItAndKeepsItsOrder()
    {
        var stored = Setting.Create(MeasurementTemplateKeys.For(GarmentType.Trousers), JsonSerializer.Serialize(new[] { "Length", "Waist" }));
        var handler = new GetMeasurementTemplatesQueryHandler(RepositoryReturning(stored));

        var result = await handler.Handle(new GetMeasurementTemplatesQuery(), CancellationToken.None);

        var trousers = result.Value.Single(t => t.GarmentType == GarmentType.Trousers);
        Assert.Equal(["Length", "Waist"], trousers.Points);
        Assert.True(trousers.IsCustomised);

        // Configuring one garment type leaves the others on their defaults.
        var shirt = result.Value.Single(t => t.GarmentType == GarmentType.Shirt);
        Assert.False(shirt.IsCustomised);
        Assert.Equal(MeasurementTemplateDefaults.For(GarmentType.Shirt), shirt.Points);
    }

    [Theory]
    [InlineData("not json at all")]
    [InlineData("[]")]
    public async Task Handle_WithAnUnusableStoredTemplate_FallsBackToTheDefault(string value)
    {
        // A row hand-edited in the database must not leave that garment type unmeasurable.
        var stored = Setting.Create(MeasurementTemplateKeys.For(GarmentType.Kurta), value);
        var handler = new GetMeasurementTemplatesQueryHandler(RepositoryReturning(stored));

        var result = await handler.Handle(new GetMeasurementTemplatesQuery(), CancellationToken.None);

        var kurta = result.Value.Single(t => t.GarmentType == GarmentType.Kurta);
        Assert.Equal(MeasurementTemplateDefaults.For(GarmentType.Kurta), kurta.Points);
        Assert.False(kurta.IsCustomised);
    }
}
