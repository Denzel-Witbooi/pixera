using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pixera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSlugToAlbums : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "slug",
                table: "albums",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "slug",
                table: "albums");
        }
    }
}
