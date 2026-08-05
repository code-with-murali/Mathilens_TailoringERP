using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Auth.Commands.Login;

public sealed record LoginCommand(string Email, string Password) : ICommand<Result<AuthTokensDto>>;
