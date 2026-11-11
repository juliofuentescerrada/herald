using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "tournaments");

            migrationBuilder.CreateTable(
                name: "Tournaments",
                schema: "tournaments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Publication = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ChangedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PublishedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    PublishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Configuration_ActivePlayersPerSide = table.Column<int>(type: "integer", nullable: true),
                    Configuration_Admission = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Configuration_Capacity = table.Column<int>(type: "integer", nullable: true),
                    Configuration_CheckIn = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Configuration_EntryKind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Configuration_GameVariant = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Configuration_Location = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Configuration_MaximumRosterSize = table.Column<int>(type: "integer", nullable: true),
                    Configuration_MinimumRosterSize = table.Column<int>(type: "integer", nullable: true),
                    Configuration_PlannedStartAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Configuration_RegistrationClosesAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Configuration_RegistrationOpensAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Configuration_TimeZone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Configuration_Title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Configuration_Venue = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Configuration_Visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tournaments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_OrganisationId",
                schema: "tournaments",
                table: "Tournaments",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_OrganisationId_CreatedAt",
                schema: "tournaments",
                table: "Tournaments",
                columns: new[] { "OrganisationId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tournaments",
                schema: "tournaments");
        }
    }
}
