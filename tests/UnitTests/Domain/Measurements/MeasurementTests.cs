using MathilensERP.Domain.Measurements;

namespace MathilensERP.UnitTests.Domain.Measurements;

public class MeasurementTests
{
    [Fact]
    public void Create_WithValidInputs_SetsAllFields()
    {
        var customerId = Guid.NewGuid();
        var values = new Dictionary<string, decimal> { ["Chest"] = 40, ["Waist"] = 34 };

        var measurement = Measurement.Create(customerId, GarmentTypes.Shirt, values);

        Assert.NotEqual(Guid.Empty, measurement.Id);
        Assert.Equal(customerId, measurement.CustomerId);
        Assert.Equal(GarmentTypes.Shirt, measurement.GarmentType);
        Assert.Equal(40, measurement.Values["Chest"]);
        Assert.Equal(34, measurement.Values["Waist"]);
    }

    [Fact]
    public void Create_WithEmptyCustomerId_Throws()
    {
        var values = new Dictionary<string, decimal> { ["Chest"] = 40 };

        Assert.Throws<ArgumentException>(() => Measurement.Create(Guid.Empty, GarmentTypes.Shirt, values));
    }

    [Fact]
    public void Create_WithNoValues_Throws()
    {
        Assert.Throws<ArgumentException>(() => Measurement.Create(Guid.NewGuid(), GarmentTypes.Shirt, new Dictionary<string, decimal>()));
    }

    [Fact]
    public void Create_WithNonPositiveValue_Throws()
    {
        var values = new Dictionary<string, decimal> { ["Chest"] = 0 };

        Assert.Throws<ArgumentOutOfRangeException>(() => Measurement.Create(Guid.NewGuid(), GarmentTypes.Shirt, values));
    }

    [Fact]
    public void Create_WithNegativeValue_Throws()
    {
        var values = new Dictionary<string, decimal> { ["Chest"] = -5 };

        Assert.Throws<ArgumentOutOfRangeException>(() => Measurement.Create(Guid.NewGuid(), GarmentTypes.Shirt, values));
    }

    [Fact]
    public void UpdateValues_ReplacesValues()
    {
        var measurement = Measurement.Create(Guid.NewGuid(), GarmentTypes.Shirt, new Dictionary<string, decimal> { ["Chest"] = 40 });

        measurement.UpdateValues(new Dictionary<string, decimal> { ["Chest"] = 42, ["Sleeve"] = 25 });

        Assert.Equal(42, measurement.Values["Chest"]);
        Assert.Equal(25, measurement.Values["Sleeve"]);
        Assert.False(measurement.Values.ContainsKey("Waist"));
    }
}
