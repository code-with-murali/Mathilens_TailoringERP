using MathilensERP.Domain.Measurements;

namespace MathilensERP.UnitTests.Domain.Measurements;

public class MeasurementHistoryTests
{
    [Fact]
    public void CaptureSnapshot_CopiesCurrentValuesFromMeasurement()
    {
        var measurement = Measurement.Create(Guid.NewGuid(), GarmentTypes.Trousers, new Dictionary<string, decimal> { ["Waist"] = 34, ["Inseam"] = 30 });

        var snapshot = MeasurementHistory.CaptureSnapshot(measurement);

        Assert.Equal(measurement.Id, snapshot.MeasurementId);
        Assert.Equal(GarmentTypes.Trousers, snapshot.GarmentType);
        Assert.Equal(34, snapshot.Values["Waist"]);
        Assert.Equal(30, snapshot.Values["Inseam"]);
    }

    [Fact]
    public void CaptureSnapshot_ReflectsValuesAtCaptureTime_NotLaterUpdates()
    {
        var measurement = Measurement.Create(Guid.NewGuid(), GarmentTypes.Trousers, new Dictionary<string, decimal> { ["Waist"] = 34 });

        var snapshot = MeasurementHistory.CaptureSnapshot(measurement);
        measurement.UpdateValues(new Dictionary<string, decimal> { ["Waist"] = 36 });

        Assert.Equal(34, snapshot.Values["Waist"]);
        Assert.Equal(36, measurement.Values["Waist"]);
    }
}
