using System.Collections;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

namespace MathilensERP.Application.Activity;

/// <summary>
/// Turns the command behind an action into the details a person can read back:
/// <c>CreateCustomerCommand("Asha Rao", "98765 43210", …)</c> becomes
/// "Full Name: Asha Rao, Phone Number: 98765 43210".
///
/// Read off the command's own properties rather than declared per command, matching how
/// <see cref="ActivityDescriptor"/> already derives screen and action — a command written next
/// month describes itself without anyone registering it.
///
/// WHAT THIS CAN AND CANNOT SAY. A command carries the values being written, so a create is
/// described in full and an edit is described by what it was changed *to*. It is not a
/// before-and-after diff: the pipeline sees the request, never the row as it stood beforehand.
/// A delete carries only an id, so it says only which record — naming the deleted customer would
/// mean the handler recording that itself, since only the handler ever loads it.
/// </summary>
public static partial class ActivityDescriptionBuilder
{
    /// <summary>Fits the Description column with room to spare; a longer entry is truncated, not dropped.</summary>
    private const int MaxLength = 2000;

    /// <summary>
    /// Property names that must never reach the trail. Matched as substrings, case-insensitively,
    /// so <c>Password</c>, <c>NewPassword</c> and <c>RefreshToken</c> are all caught — an audit
    /// record is exactly the wrong place to end up holding a credential, and it is written
    /// automatically, so this errs toward redacting too much rather than too little.
    /// </summary>
    private static readonly string[] SecretNameFragments =
        ["password", "token", "secret", "signingkey", "apikey", "credential", "otp", "pin", "hash", "resetcode"];

    public static string? Describe(object? request)
    {
        if (request is null)
        {
            return null;
        }

        var parts = new List<string>();

        foreach (var property in request.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (property.GetIndexParameters().Length > 0)
            {
                // Indexers cannot be read without an argument; records never have one anyway.
                continue;
            }

            var label = Humanize(property.Name);

            if (IsSecret(property.Name))
            {
                parts.Add($"{label}: ●●●●●");
                continue;
            }

            object? value;
            try
            {
                value = property.GetValue(request);
            }
            catch (TargetInvocationException)
            {
                // A computed property that throws must not cost the caller their audit entry.
                continue;
            }

            var formatted = Format(value);
            if (formatted is not null)
            {
                parts.Add($"{label}: {formatted}");
            }
        }

        if (parts.Count == 0)
        {
            return null;
        }

        var description = string.Join(", ", parts);
        return description.Length <= MaxLength ? description : description[..(MaxLength - 1)] + "…";
    }

    private static bool IsSecret(string propertyName) =>
        SecretNameFragments.Any(fragment => propertyName.Contains(fragment, StringComparison.OrdinalIgnoreCase));

    /// <summary>Returns null for anything not worth a line: unset values and empty collections.</summary>
    private static string? Format(object? value) => value switch
    {
        null => null,
        string s => string.IsNullOrWhiteSpace(s) ? null : s.Trim(),
        bool b => b ? "Yes" : "No",
        DateTime d => d.ToString("yyyy-MM-dd HH:mm"),
        DateOnly d => d.ToString("yyyy-MM-dd"),
        decimal m => m.ToString("0.##"),
        // Order items, measurement values and the like: summarised by count rather than dumped,
        // which would push everything else past the length limit.
        IEnumerable enumerable and not string => Count(enumerable) is var count && count == 0 ? null : $"{count} item{(count == 1 ? "" : "s")}",
        _ => value.ToString() is { Length: > 0 } text ? text : null,
    };

    private static int Count(IEnumerable enumerable)
    {
        if (enumerable is ICollection collection)
        {
            return collection.Count;
        }

        var count = 0;
        foreach (var _ in enumerable)
        {
            count++;
        }

        return count;
    }

    /// <summary><c>PhoneNumber</c> gives "Phone Number", matching how actions are already worded.</summary>
    private static string Humanize(string propertyName) =>
        PascalCaseBoundary().Replace(propertyName, " $1").Trim();

    [GeneratedRegex(@"(?<!^)([A-Z][a-z]+|[A-Z]+(?![a-z]))")]
    private static partial Regex PascalCaseBoundary();
}
