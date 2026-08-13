using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using MigraDoc.Rendering;

namespace MathilensERP.Api.Common.Export;

/// <summary>
/// Renders the same header-and-rows shape <see cref="Excel.ExcelSheet"/> writes, as a PDF.
///
/// Lives in the API layer for the same reason the spreadsheet writer does: PDF is a transport
/// format like JSON, so Application keeps dealing in plain row records and never references a
/// document library (01_ARCHITECTURE.md § 9.1).
///
/// Landscape by default. These are list exports, and a shop's customer table has more columns than
/// fit across a portrait page — a portrait default would silently squeeze every column to
/// illegibility rather than fail, which is the worse outcome.
/// </summary>
public static class PdfTable
{
    public const string ContentType = "application/pdf";

    public static byte[] Write(
        string title,
        IReadOnlyList<string> headers,
        IEnumerable<IReadOnlyList<object?>> rows,
        string? subtitle = null)
    {
        var document = new Document();
        document.Info.Title = title;

        var style = document.Styles[StyleNames.Normal]!;
        style.Font.Name = "Arial";
        style.Font.Size = 8;

        var section = document.AddSection();
        section.PageSetup.Orientation = Orientation.Landscape;
        section.PageSetup.PageFormat = PageFormat.A4;
        section.PageSetup.TopMargin = Unit.FromCentimeter(1.2);
        section.PageSetup.BottomMargin = Unit.FromCentimeter(1.2);
        section.PageSetup.LeftMargin = Unit.FromCentimeter(1);
        section.PageSetup.RightMargin = Unit.FromCentimeter(1);

        var heading = section.AddParagraph(title);
        heading.Format.Font.Size = 14;
        heading.Format.Font.Bold = true;
        heading.Format.SpaceAfter = Unit.FromPoint(2);

        // What the reader needs to know to trust the numbers: which period, and when it was taken.
        // A printed report with no date on it is worse than no report.
        var stamp = subtitle is null
            ? $"Generated {DateTime.UtcNow:dd MMM yyyy HH:mm} UTC"
            : $"{subtitle} · generated {DateTime.UtcNow:dd MMM yyyy HH:mm} UTC";
        var stampParagraph = section.AddParagraph(stamp);
        stampParagraph.Format.Font.Size = 7;
        stampParagraph.Format.Font.Color = Colors.Gray;
        stampParagraph.Format.SpaceAfter = Unit.FromPoint(8);

        var table = section.AddTable();
        table.Borders.Width = 0.25;
        table.Borders.Color = Colors.LightGray;

        // Even columns. Measuring content to weight them would be better and is a lot more code;
        // this at least never collapses a column to nothing.
        var usable = section.PageSetup.PageWidth.Point
            - section.PageSetup.LeftMargin.Point
            - section.PageSetup.RightMargin.Point;
        var columnWidth = Unit.FromPoint(usable / Math.Max(headers.Count, 1));

        foreach (var _ in headers)
        {
            table.AddColumn(columnWidth);
        }

        var headerRow = table.AddRow();
        headerRow.HeadingFormat = true; // Repeats on every page — a table whose second page has no headers is unreadable.
        headerRow.Shading.Color = Colors.WhiteSmoke;
        headerRow.Format.Font.Bold = true;

        for (var i = 0; i < headers.Count; i++)
        {
            headerRow.Cells[i].AddParagraph(headers[i]);
            headerRow.Cells[i].VerticalAlignment = VerticalAlignment.Center;
        }

        foreach (var row in rows)
        {
            var documentRow = table.AddRow();
            for (var i = 0; i < headers.Count; i++)
            {
                var value = i < row.Count ? row[i] : null;
                documentRow.Cells[i].AddParagraph(Format(value));
                documentRow.Cells[i].VerticalAlignment = VerticalAlignment.Center;
            }
        }

        var renderer = new PdfDocumentRenderer { Document = document };
        renderer.RenderDocument();

        using var stream = new MemoryStream();
        renderer.PdfDocument.Save(stream);
        return stream.ToArray();
    }

    /// <summary>
    /// Dates as days and numbers with two decimals, because this is read by a person rather than
    /// parsed. MigraDoc takes strings only, so nulls become an empty cell rather than "null".
    /// </summary>
    private static string Format(object? value) => value switch
    {
        null => string.Empty,
        DateOnly date => date.ToString("dd MMM yyyy"),
        DateTime dateTime => dateTime.ToString("dd MMM yyyy"),
        decimal number => number.ToString("N2"),
        bool flag => flag ? "Yes" : "No",
        _ => value.ToString() ?? string.Empty,
    };
}
