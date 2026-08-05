namespace MathilensERP.Domain.Orders;

/// <summary>
/// An order's lifecycle status (02_DATABASE.md § 10.7). A strict forward-only progression —
/// enforced by <see cref="Order.CanTransitionTo"/> — with cancellation allowed from any
/// non-terminal state: <c>Received → InProgress → ReadyForDelivery → Delivered</c>, or
/// any of the first three → <c>Cancelled</c>. <c>Delivered</c> and <c>Cancelled</c> are terminal.
/// </summary>
public enum OrderStatus
{
    Received,
    InProgress,
    ReadyForDelivery,
    Delivered,
    Cancelled
}
