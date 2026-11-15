using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Competition.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Departures",
                schema: "competition",
                table: "Schedules",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "Players",
                schema: "competition",
                table: "Schedules",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Departures",
                schema: "competition",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "Players",
                schema: "competition",
                table: "Schedules");
        }
    }
}
