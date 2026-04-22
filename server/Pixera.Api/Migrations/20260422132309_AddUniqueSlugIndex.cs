using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pixera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueSlugIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_albums_slug",
                table: "albums",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_albums_slug",
                table: "albums");
        }
    }
}
