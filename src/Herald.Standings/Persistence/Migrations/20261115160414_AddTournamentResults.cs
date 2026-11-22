using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Standings.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "standings");

            migrationBuilder.CreateTable(
                name: "Results",
                schema: "standings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Snapshot = table.Column<string>(type: "jsonb", nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Results", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Results_OrganisationId",
                schema: "standings",
                table: "Results",
                column: "OrganisationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Results",
                schema: "standings");
        }
    }
}
