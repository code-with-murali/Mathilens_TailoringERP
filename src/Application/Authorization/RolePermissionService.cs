using System.Text.Json;
using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Settings;
using MathilensERP.Domain.Settings;
using MathilensERP.Shared.Authorization;
using MathilensERP.Shared.Results;
using Microsoft.Extensions.Caching.Memory;

namespace MathilensERP.Application.Authorization;

/// <summary>
/// Resolves role permissions from the shop's own configuration, falling back to the built-in sets
/// in <see cref="AppRoles"/> for any role never edited.
///
/// Stored in the shop-level settings store, one row per role holding a JSON array — the same
/// mechanism as measurement templates, and for the same reason: this is configuration, it is tiny,
/// and it needs no schema of its own.
///
/// CACHED, deliberately. <c>PermissionsForAsync</c> runs on the authorization path of every
/// request, so reading a settings row each time would add a database round trip to the whole API.
/// The whole map is held as one cache entry and dropped on write, which is why an edit takes
/// effect on the very next request rather than when a token expires.
/// </summary>
public sealed class RolePermissionService : IRolePermissionService
{
    private const string KeyPrefix = "Authorization.RolePermissions.";
    private const string CacheKey = "Authorization.RolePermissions.All";

    /// <summary>Bounds how long a stale map could survive a write made by another instance.</summary>
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(5);

    private readonly ISettingRepository _settingRepository;
    private readonly IMemoryCache _cache;

    public RolePermissionService(ISettingRepository settingRepository, IMemoryCache cache)
    {
        _settingRepository = settingRepository;
        _cache = cache;
    }

    public async Task<IReadOnlyList<string>> PermissionsForAsync(IEnumerable<string> roles, CancellationToken cancellationToken)
    {
        var overrides = await GetOverridesAsync(cancellationToken);

        return roles
            .Where(AppRoles.IsKnownRole)
            .SelectMany(role => Resolve(role, overrides))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(permission => permission, StringComparer.Ordinal)
            .ToList();
    }

    public async Task<RolePermissionMatrixDto> GetMatrixAsync(CancellationToken cancellationToken)
    {
        var overrides = await GetOverridesAsync(cancellationToken);

        // Screens and their actions come from the permission catalogue, so a module added later
        // shows up here on its own — and one that only supports viewing offers no Manage box.
        var screens = Permissions.All
            .Select(permission => new { Permission = permission, Parts = permission.Split('.') })
            .Where(x => x.Parts.Length == 2)
            .GroupBy(x => x.Parts[0], StringComparer.Ordinal)
            .Select(group => new ScreenPermissionsDto(
                group.Key,
                group.Select(x => new ScreenPermissionDto(x.Permission, x.Parts[1])).ToList()))
            .ToList();

        var roles = AppRoles.All
            .Select(role => new RolePermissionsDto(
                role,
                Resolve(role, overrides),
                IsEditable: !IsOwner(role),
                IsCustomised: !IsOwner(role) && overrides.ContainsKey(role)))
            .ToList();

        return new RolePermissionMatrixDto(screens, roles);
    }

    public async Task<Result<RolePermissionsDto>> SetPermissionsAsync(
        string role,
        IReadOnlyList<string> permissions,
        CancellationToken cancellationToken)
    {
        var failure = Validate(role, permissions);
        if (failure is not null)
        {
            return Result.Failure<RolePermissionsDto>(failure);
        }

        // Ordered and de-duplicated on the way in, so the stored value is comparable and the grid
        // reads back the same regardless of the order boxes were ticked.
        var normalized = permissions
            .Distinct(StringComparer.Ordinal)
            .OrderBy(p => p, StringComparer.Ordinal)
            .ToList();

        var key = KeyPrefix + role;
        var setting = await _settingRepository.GetByKeyAsync(key, cancellationToken);
        if (setting is null)
        {
            _settingRepository.Add(Setting.Create(key, JsonSerializer.Serialize(normalized)));
        }
        else
        {
            setting.UpdateValue(JsonSerializer.Serialize(normalized));
        }

        await _settingRepository.SaveChangesAsync(cancellationToken);
        _cache.Remove(CacheKey);

        return new RolePermissionsDto(role, normalized, IsEditable: true, IsCustomised: true);
    }

    public async Task<Result<RolePermissionsDto>> ResetPermissionsAsync(string role, CancellationToken cancellationToken)
    {
        if (!AppRoles.IsKnownRole(role))
        {
            return Result.Failure<RolePermissionsDto>(
                Error.Validation("Roles.UnknownRole", $"'{role}' is not a role in this system."));
        }

        if (IsOwner(role))
        {
            return Result.Failure<RolePermissionsDto>(OwnerIsFixed());
        }

        var setting = await _settingRepository.GetByKeyAsync(KeyPrefix + role, cancellationToken);
        if (setting is not null)
        {
            _settingRepository.Remove(setting);
            await _settingRepository.SaveChangesAsync(cancellationToken);
            _cache.Remove(CacheKey);
        }

        return new RolePermissionsDto(role, AppRoles.PermissionsFor([role]), IsEditable: true, IsCustomised: false);
    }

    private static Error? Validate(string role, IReadOnlyList<string> permissions)
    {
        if (!AppRoles.IsKnownRole(role))
        {
            return Error.Validation("Roles.UnknownRole", $"'{role}' is not a role in this system.");
        }

        if (IsOwner(role))
        {
            return OwnerIsFixed();
        }

        var unknown = permissions.Where(p => !Permissions.All.Contains(p, StringComparer.Ordinal)).ToList();
        return unknown.Count > 0
            ? Error.Validation("Roles.UnknownPermission", $"Not a permission in this system: {string.Join(", ", unknown)}.")
            : null;
    }

    /// <summary>
    /// Owner is fixed at every permission and cannot be edited. It is the only role guaranteed to
    /// carry <c>Users.Manage</c>; a shop that removed it would have nobody left able to grant
    /// access to anyone — including to undo that very change.
    /// </summary>
    private static Error OwnerIsFixed() => Error.Validation(
        "Roles.OwnerIsFixed",
        "Owner always has every permission and cannot be changed — otherwise nobody would be left able to grant access.");

    private static bool IsOwner(string role) => string.Equals(role, AppRoles.Owner, StringComparison.OrdinalIgnoreCase);

    private static IReadOnlyList<string> Resolve(string role, IReadOnlyDictionary<string, IReadOnlyList<string>> overrides) =>
        IsOwner(role) ? Permissions.All
        : overrides.TryGetValue(role, out var configured) ? configured
        : AppRoles.PermissionsFor([role]);

    private async Task<IReadOnlyDictionary<string, IReadOnlyList<string>>> GetOverridesAsync(CancellationToken cancellationToken)
    {
        if (_cache.TryGetValue(CacheKey, out IReadOnlyDictionary<string, IReadOnlyList<string>>? cached) && cached is not null)
        {
            return cached;
        }

        var stored = await _settingRepository.ListByKeyPrefixAsync(KeyPrefix, cancellationToken);
        var overrides = new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var setting in stored)
        {
            var role = setting.Key[KeyPrefix.Length..];
            if (!AppRoles.IsKnownRole(role) || IsOwner(role))
            {
                continue;
            }

            // A row that no longer parses (hand-edited in the database) falls back to the built-in
            // set rather than silently granting nothing and locking that role out of everything.
            try
            {
                if (JsonSerializer.Deserialize<List<string>>(setting.Value) is { } permissions)
                {
                    overrides[role] = permissions;
                }
            }
            catch (JsonException)
            {
                // Intentionally skipped — Resolve falls back to the default for this role.
            }
        }

        _cache.Set(CacheKey, (IReadOnlyDictionary<string, IReadOnlyList<string>>)overrides, CacheLifetime);
        return overrides;
    }
}
