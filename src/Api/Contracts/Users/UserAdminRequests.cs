namespace MathilensERP.Api.Contracts.Users;

public sealed record CreateUserRequest(string Email, string Password, string Role);

public sealed record SetUserRoleRequest(string Role);

/// <summary>No current password: an Owner resetting someone else's has no reason to know it.</summary>
public sealed record ResetUserPasswordRequest(string NewPassword);

/// <summary>The complete set the role should hold — sent whole, so unticking is expressible.</summary>
public sealed record SetRolePermissionsRequest(IReadOnlyList<string> Permissions);

/// <summary>Changing your own password: proving you know the current one is what stands in for an Owner being present.</summary>
public sealed record ChangeOwnPasswordRequest(string CurrentPassword, string NewPassword);

/// <summary>Adding or renaming a role. A role is only its name here — its rights live on User Rights.</summary>
public sealed record SaveRoleRequest(string Name);
