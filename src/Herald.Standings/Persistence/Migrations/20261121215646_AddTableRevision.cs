using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Standings.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTableRevision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TableRevision",
                schema: "standings",
                table: "Results",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TableRevision",
                schema: "standings",
                table: "Results");
        }
    }
}
