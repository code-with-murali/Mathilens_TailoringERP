namespace MathilensERP.Api.Contracts.Users;

public sealed record CreateUserRequest(string Email, string Password, string Role);

public sealed record SetUserRoleRequest(string Role);
