namespace MathilensERP.Shared.Authorization;

/// <summary>
/// What a user is allowed to do, as a flat set of "Module.Action" strings.
///
/// Deliberately two actions per module rather than one per endpoint: "can they see this screen"
/// and "can they change things on it" is the distinction a shop owner actually makes when handing
/// out access, and a permission list nobody can hold in their head is one that gets granted
/// wholesale to make the complaints stop.
/// </summary>
public static class Permissions
{
    public const string View = nameof(View);
    public const string Manage = nameof(Manage);

    public static class Modules
    {
        public const string Customers = nameof(Customers);
        public const string Measurements = nameof(Measurements);
        public const string Employees = nameof(Employees);
        public const string Orders = nameof(Orders);
        public const string Invoices = nameof(Invoices);
        public const string WhatsApp = nameof(WhatsApp);
        public const string Reports = nameof(Reports);
        public const string Pricing = nameof(Pricing);
        public const string Settings = nameof(Settings);
        public const string Activity = nameof(Activity);
        public const string Users = nameof(Users);
    }

    public const string CustomersView = $"{Modules.Customers}.{View}";
    public const string CustomersManage = $"{Modules.Customers}.{Manage}";
    public const string MeasurementsView = $"{Modules.Measurements}.{View}";
    public const string MeasurementsManage = $"{Modules.Measurements}.{Manage}";
    public const string EmployeesView = $"{Modules.Employees}.{View}";
    public const string EmployeesManage = $"{Modules.Employees}.{Manage}";
    public const string OrdersView = $"{Modules.Orders}.{View}";
    public const string OrdersManage = $"{Modules.Orders}.{Manage}";
    public const string InvoicesView = $"{Modules.Invoices}.{View}";
    public const string InvoicesManage = $"{Modules.Invoices}.{Manage}";
    public const string WhatsAppView = $"{Modules.WhatsApp}.{View}";
    public const string WhatsAppManage = $"{Modules.WhatsApp}.{Manage}";
    public const string ReportsView = $"{Modules.Reports}.{View}";
    public const string PricingView = $"{Modules.Pricing}.{View}";
    public const string PricingManage = $"{Modules.Pricing}.{Manage}";
    public const string SettingsView = $"{Modules.Settings}.{View}";
    public const string SettingsManage = $"{Modules.Settings}.{Manage}";
    public const string ActivityView = $"{Modules.Activity}.{View}";
    public const string UsersView = $"{Modules.Users}.{View}";
    public const string UsersManage = $"{Modules.Users}.{Manage}";

    /// <summary>Every permission, used to register one authorization policy each at startup.</summary>
    public static readonly IReadOnlyList<string> All =
    [
        CustomersView, CustomersManage,
        MeasurementsView, MeasurementsManage,
        EmployeesView, EmployeesManage,
        OrdersView, OrdersManage,
        InvoicesView, InvoicesManage,
        WhatsAppView, WhatsAppManage,
        ReportsView,
        PricingView, PricingManage,
        SettingsView, SettingsManage,
        ActivityView,
        UsersView, UsersManage,
    ];
}
