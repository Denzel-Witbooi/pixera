using FluentAssertions;
using Pixera.Api.Utilities;

namespace Pixera.Api.Tests;

public class SlugGeneratorTests
{
    [Theory]
    [InlineData("Company Christmas 2025", "company-christmas-2025")]
    [InlineData("Wedding Day",            "wedding-day")]
    [InlineData("  Extra   Spaces  ",    "extra-spaces")]
    [InlineData("Ünïcödé Chàrs",         "unicode-chars")]
    [InlineData("Special!@#$%Chars",     "specialchars")]
    [InlineData("already-a-slug",        "already-a-slug")]
    [InlineData("UPPERCASE",             "uppercase")]
    public void Generate_ProducesUrlSafeSlug(string title, string expected)
    {
        SlugGenerator.Generate(title).Should().Be(expected);
    }

    [Fact]
    public void Generate_ReplacesMultipleHyphensWithOne()
    {
        SlugGenerator.Generate("Hello---World").Should().Be("hello-world");
    }

    [Fact]
    public void Generate_TrimsLeadingAndTrailingHyphens()
    {
        SlugGenerator.Generate("!Hello World!").Should().Be("hello-world");
    }
}
