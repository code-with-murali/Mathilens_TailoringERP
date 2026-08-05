using MathilensERP.Domain.Billing;
using MathilensERP.Domain.Orders;

namespace MathilensERP.Application.Reports;

public sealed record RevenueReportDto(
    DateTime FromUtc,
    DateTime ToUtc,
    int InvoiceCount,
    decimal TotalInvoiced,
    decimal TotalCollected,
    decimal TotalOutstanding);

public sealed record OrderStatusCountDto(OrderStatus Status, int Count);

public sealed record OrderStatusSummaryReportDto(DateTime FromUtc, DateTime ToUtc, IReadOnlyList<OrderStatusCountDto> StatusCounts);

public sealed record OutstandingInvoiceDto(
    Guid Id,
    Guid CustomerId,
    decimal TotalAmount,
    decimal AmountPaid,
    decimal RemainingBalance,
    InvoiceStatus Status,
    DateTime CreatedAtUtc);
