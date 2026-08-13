using System.Text.Json;
using MathilensERP.Application.Settings;
using MathilensERP.Domain.Settings;
using MathilensERP.Application.Authorization;
using MathilensERP.Shared.Authorization;
using Microsoft.Extensions.Caching.Memory;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Authorization;

public class RolePermissionServiceTests
{
    private const string KeyPrefix = "Authorization.RolePermissions.";

    private readonly ISettingRepository _settings = Substitute.For<ISettingRepository>();

    private RolePermissionService Service(params Setting[] stored)
    {
        _settings.ListByKeyPrefixAsync(KeyPrefix, Arg.Any<CancellationToken>()).Returns(stored);
        // A fresh cache per service, so one test's map can never leak into another's.
        return new RolePermissionService(_settings, new MemoryCache(new MemoryCacheOptions()));
    }

    private static Setting Stored(string role, params string[] permissions) =>
        Setting.Create(KeyPrefix + role, JsonSerializer.Serialize(permissions));

    [Fact]
    public async Task PermissionsFor_WithNothingConfigured_UsesTheBuiltInSet()
    {
        var permissions = await Service().PermissionsForAsync([AppRoles.Tailor], CancellationToken.None);

        Assert.Equal(AppRoles.PermissionsFor([AppRoles.Tailor]).OrderBy(p => p), permissions.OrderBy(p => p));
    }

    [Fact]
    public async Task PermissionsFor_WithAnOverride_UsesItInsteadOfTheDefault()
    {
        var service = Service(Stored(AppRoles.Tailor, Permissions.OrdersView, Permissions.ReportsView));

        var permissions = await service.PermissionsForAsync([AppRoles.Tailor], CancellationToken.None);

        Assert.Equal([Permissions.OrdersView, Permissions.ReportsView], permissions.OrderBy(p => p, StringComparer.Ordinal));
        // The default granted Customers.View; the override replaces the set rather than adding to it.
        Assert.DoesNotContain(Permissions.CustomersView, permissions);
    }

    [Fact]
    public async Task PermissionsFor_Owner_IsAlwaysEverythingEvenIfARowSaysOtherwise()
    {
        // Owner is the only role guaranteed to be able to grant access. A stored row must not be
        // able to take that away — including one written straight into the database.
        var service = Service(Stored(AppRoles.Owner, Permissions.OrdersView));

        var permissions = await service.PermissionsForAsync([AppRoles.Owner], CancellationToken.None);

        Assert.Equal(Permissions.All.OrderBy(p => p, StringComparer.Ordinal), permissions.OrderBy(p => p, StringComparer.Ordinal));
        Assert.Contains(Permissions.UsersManage, permissions);
    }

    [Fact]
    public async Task PermissionsFor_WithAnUnparsableRow_FallsBackToTheDefault()
    {
        // A hand-edited row must not silently lock a role out of the whole system.
        var service = Service(Setting.Create(KeyPrefix + AppRoles.FrontDesk, "not json"));

        var permissions = await service.PermissionsForAsync([AppRoles.FrontDesk], CancellationToken.None);

        Assert.Equal(AppRoles.PermissionsFor([AppRoles.FrontDesk]).OrderBy(p => p), permissions.OrderBy(p => p));
    }

    [Fact]
    public async Task SetPermissions_ForOwner_IsRefused()
    {
        var result = await Service().SetPermissionsAsync(AppRoles.Owner, [Permissions.OrdersView], CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Roles.OwnerIsFixed", result.Error.Code);
        await _settings.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SetPermissions_WithAnUnknownPermission_IsRefused()
    {
        var result = await Service().SetPermissionsAsync(AppRoles.Tailor, ["Orders.Explode"], CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Roles.UnknownPermission", result.Error.Code);
        await _settings.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SetPermissions_WithAnUnknownRole_IsRefused()
    {
        var result = await Service().SetPermissionsAsync("Caretaker", [Permissions.OrdersView], CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Roles.UnknownRole", result.Error.Code);
    }

    [Fact]
    public async Task SetPermissions_StoresTheSetAndTakesEffectImmediately()
    {
        var service = Service();
        _settings.GetByKeyAsync(KeyPrefix + AppRoles.Tailor, Arg.Any<CancellationToken>()).Returns((Setting?)null);

        // Warm the cache first, so this also proves the write invalidates it rather than leaving
        // the old answer in place — the whole point of resolving per request.
        await service.PermissionsForAsync([AppRoles.Tailor], CancellationToken.None);

        var result = await service.SetPermissionsAsync(AppRoles.Tailor, [Permissions.ReportsView], CancellationToken.None);

        Assert.True(result.IsSuccess);
        _settings.Received(1).Add(Arg.Is<Setting>(s => s != null && s.Key == KeyPrefix + AppRoles.Tailor));
        await _settings.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());

        _settings.ListByKeyPrefixAsync(KeyPrefix, Arg.Any<CancellationToken>())
            .Returns([Stored(AppRoles.Tailor, Permissions.ReportsView)]);
        var after = await service.PermissionsForAsync([AppRoles.Tailor], CancellationToken.None);
        Assert.Equal([Permissions.ReportsView], after);
    }

    [Fact]
    public async Task GetMatrix_MarksOwnerAsNotEditableAndEveryOtherRoleAsEditable()
    {
        var matrix = await Service().GetMatrixAsync(CancellationToken.None);

        Assert.False(matrix.Roles.Single(r => r.Role == AppRoles.Owner).IsEditable);
        Assert.All(matrix.Roles.Where(r => r.Role != AppRoles.Owner), r => Assert.True(r.IsEditable));
    }

    [Fact]
    public async Task GetMatrix_DerivesScreensFromTheCatalogue()
    {
        var matrix = await Service().GetMatrixAsync(CancellationToken.None);

        // Every permission is represented exactly once, so a module added later needs no edit here.
        var flattened = matrix.Screens.SelectMany(s => s.Permissions.Select(p => p.Permission)).ToList();
        Assert.Equal(Permissions.All.OrderBy(p => p, StringComparer.Ordinal), flattened.OrderBy(p => p, StringComparer.Ordinal));

        // Reports defines only View, so the grid must not offer it a Manage checkbox.
        var reports = matrix.Screens.Single(s => s.Screen == "Reports");
        Assert.DoesNotContain(reports.Permissions, p => p.Action == "Manage");
    }

    [Fact]
    public async Task ResetPermissions_ForOwner_IsRefused()
    {
        var result = await Service().ResetPermissionsAsync(AppRoles.Owner, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Roles.OwnerIsFixed", result.Error.Code);
    }

    [Fact]
    public async Task ResetPermissions_RemovesTheOverrideAndReturnsTheBuiltInSet()
    {
        var stored = Stored(AppRoles.Tailor, Permissions.ReportsView);
        var service = Service(stored);
        _settings.GetByKeyAsync(KeyPrefix + AppRoles.Tailor, Arg.Any<CancellationToken>()).Returns(stored);

        var result = await service.ResetPermissionsAsync(AppRoles.Tailor, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.IsCustomised);
        Assert.Equal(AppRoles.PermissionsFor([AppRoles.Tailor]), result.Value.Permissions);
        _settings.Received(1).Remove(stored);
    }
}
