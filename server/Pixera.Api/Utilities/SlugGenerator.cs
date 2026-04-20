using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Pixera.Api.Utilities;

public static class SlugGenerator
{
    public static string Generate(string title)
    {
        var normalized = title.Normalize(NormalizationForm.FormD);

        var stripped = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                stripped.Append(c);
        }

        var slug = stripped.ToString().ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"[\s-]+", "-");
        slug = slug.Trim('-');

        return slug;
    }
}
