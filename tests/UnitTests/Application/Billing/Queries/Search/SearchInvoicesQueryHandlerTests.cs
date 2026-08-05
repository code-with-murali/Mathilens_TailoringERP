using MathilensERP.Application.Billing;
using MathilensERP.Application.Billing.Queries.Search;
using MathilensERP.Domain.Billing;
using MathilensERP.Shared.Pagination;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Billing.Queries.Search;

public class SearchInvoicesQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsPagedInvoicesToDtos()
    {
        var customerId = Guid.NewGuid();
        var invoice = Invoice.Create(Guid.NewGuid(), customerId, 1000m, 0m, 0m);
        var repository = Substitute.For<IInvoiceRepository>();
        repository.SearchAsync(customerId, InvoiceStatus.Unpaid, 1, 20, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<Invoice>([invoice], 1, 20, 1));
        var handler = new SearchInvoicesQueryHandler(repository);

        var result = await handler.Handle(new SearchInvoicesQuery(customerId, InvoiceStatus.Unpaid, 1, 20), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value.Items);
        Assert.Equal(invoice.Id, result.Value.Items[0].Id);
    }
}
