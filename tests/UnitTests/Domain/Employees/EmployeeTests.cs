using MathilensERP.Domain.Employees;

namespace MathilensERP.UnitTests.Domain.Employees;

public class EmployeeTests
{
    [Fact]
    public void Create_WithValidInputs_SetsAllFields()
    {
        var employee = Employee.Create("Ravi Kumar", "Master Tailor", "+91 98765 43210", "ravi@example.com");

        Assert.NotEqual(Guid.Empty, employee.Id);
        Assert.Equal("Ravi Kumar", employee.FullName);
        Assert.Equal("Master Tailor", employee.JobTitle);
        Assert.Equal("+91 98765 43210", employee.PhoneNumber);
        Assert.Equal("ravi@example.com", employee.Email);
        Assert.Null(employee.UserId);
    }

    [Fact]
    public void Create_WithOnlyRequiredFields_LeavesOptionalFieldsNull()
    {
        var employee = Employee.Create("Ravi Kumar", null, null, null);

        Assert.Null(employee.JobTitle);
        Assert.Null(employee.PhoneNumber);
        Assert.Null(employee.Email);
    }

    [Fact]
    public void Create_WithBlankFullName_Throws()
    {
        Assert.Throws<ArgumentException>(() => Employee.Create(" ", null, null, null));
    }

    [Fact]
    public void UpdateDetails_ReplacesAllFields()
    {
        var employee = Employee.Create("Ravi Kumar", "Tailor", null, null);

        employee.UpdateDetails("Ravi K.", "Master Tailor", "+91 90000 00000", "ravi.k@example.com");

        Assert.Equal("Ravi K.", employee.FullName);
        Assert.Equal("Master Tailor", employee.JobTitle);
        Assert.Equal("+91 90000 00000", employee.PhoneNumber);
        Assert.Equal("ravi.k@example.com", employee.Email);
    }

    [Fact]
    public void UpdateDetails_WithBlankFullName_Throws()
    {
        var employee = Employee.Create("Ravi Kumar", null, null, null);

        Assert.Throws<ArgumentException>(() => employee.UpdateDetails(" ", null, null, null));
    }
}
