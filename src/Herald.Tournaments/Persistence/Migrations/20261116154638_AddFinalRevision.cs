using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFinalRevision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FinalRevision",
                schema: "tournaments",
                table: "Tournaments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FinalRevision",
                schema: "tournaments",
                table: "Tournaments");
        }
    }
}
