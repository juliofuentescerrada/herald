using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Competition.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMatches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActivePlayersPerSide",
                schema: "competition",
                table: "Schedules",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Rosters",
                schema: "competition",
                table: "Schedules",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Matches",
                schema: "competition",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Round = table.Column<int>(type: "integer", nullable: false),
                    First = table.Column<Guid>(type: "uuid", nullable: false),
                    Second = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivePlayers = table.Column<int>(type: "integer", nullable: true),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    FirstLineups = table.Column<string>(type: "jsonb", nullable: false),
                    SecondLineups = table.Column<string>(type: "jsonb", nullable: false),
                    Start = table.Column<string>(type: "jsonb", nullable: true),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matches", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_OrganisationId",
                schema: "competition",
                table: "Matches",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_TournamentId",
                schema: "competition",
                table: "Matches",
                column: "TournamentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Matches",
                schema: "competition");

            migrationBuilder.DropColumn(
                name: "ActivePlayersPerSide",
                schema: "competition",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "Rosters",
                schema: "competition",
                table: "Schedules");
        }
    }
}
