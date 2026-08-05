namespace MathilensERP.Api.Contracts.Users;

public sealed record CurrentUserResponse(Guid Id, string? Email, IReadOnlyList<string> Roles);
