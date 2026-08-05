using MathilensERP.Application.Auth.Commands.Login;

namespace MathilensERP.UnitTests.Application.Auth.Commands.Login;

public class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidEmailAndPassword_Passes()
    {
        var result = _validator.Validate(new LoginCommand("owner@shop.example", "correct-horse-battery-staple"));

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", "password")]
    [InlineData("not-an-email", "password")]
    [InlineData("owner@shop.example", "")]
    public void Validate_WithInvalidInput_Fails(string email, string password)
    {
        var result = _validator.Validate(new LoginCommand(email, password));

        Assert.False(result.IsValid);
    }
}
