using MathilensERP.Application.Measurements;
using MathilensERP.Application.Measurements.Queries.ByCustomer;
using MathilensERP.Domain.Measurements;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Measurements.Queries.ByCustomer;

public class GetMeasurementsByCustomerQueryHandlerTests
{
    [Fact]
    public async Task Handle_ReturnsAllMeasurementsForCustomer()
    {
        var customerId = Guid.NewGuid();
        var shirt = Measurement.Create(customerId, GarmentTypes.Shirt, new Dictionary<string, decimal> { ["Chest"] = 40 });
        var trousers = Measurement.Create(customerId, GarmentTypes.Trousers, new Dictionary<string, decimal> { ["Waist"] = 34 });
        var repository = Substitute.For<IMeasurementRepository>();
        repository.GetByCustomerAsync(customerId, Arg.Any<CancellationToken>()).Returns([shirt, trousers]);
        var handler = new GetMeasurementsByCustomerQueryHandler(repository);

        var result = await handler.Handle(new GetMeasurementsByCustomerQuery(customerId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
    }
}
