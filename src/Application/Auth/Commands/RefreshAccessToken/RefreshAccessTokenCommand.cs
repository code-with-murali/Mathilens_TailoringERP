using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Auth.Commands.RefreshAccessToken;

public sealed record RefreshAccessTokenCommand(string RefreshToken) : ICommand<Result<AuthTokensDto>>;
