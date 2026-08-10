namespace MathilensERP.Api.Contracts.Users;

/// <summary><paramref name="Permissions"/> is what <paramref name="Roles"/> resolves to, sent so the client doesn't have to know the role-to-permission mapping.</summary>
public sealed record CurrentUserResponse(Guid Id, string? Email, IReadOnlyList<string> Roles, IReadOnlyList<string> Permissions);
