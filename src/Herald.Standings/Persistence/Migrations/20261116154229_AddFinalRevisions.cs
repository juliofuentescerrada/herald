using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Standings.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFinalRevisions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Finals",
                schema: "standings",
                table: "Results",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            // xmin is PostgreSQL's own system column: the row version needs no column of its own.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Finals",
                schema: "standings",
                table: "Results");
        }
    }
}
