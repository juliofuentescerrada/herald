using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Competition.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddResultsRevision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ResultsRevision",
                schema: "competition",
                table: "Schedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResultsRevision",
                schema: "competition",
                table: "Schedules");
        }
    }
}
