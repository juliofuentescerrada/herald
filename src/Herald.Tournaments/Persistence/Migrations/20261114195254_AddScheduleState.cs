using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduleState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TermsRevision",
                schema: "tournaments",
                table: "Tournaments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Schedules",
                schema: "tournaments",
                columns: table => new
                {
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    PublishedRevision = table.Column<int>(type: "integer", nullable: true),
                    EligibleRevision = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Schedules", x => x.TournamentId);
                });

            // Terms already sent carried the tournament's revision; the new sequence continues above it.
            migrationBuilder.Sql("""UPDATE tournaments."Tournaments" SET "TermsRevision" = "Revision";""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Schedules",
                schema: "tournaments");

            migrationBuilder.DropColumn(
                name: "TermsRevision",
                schema: "tournaments",
                table: "Tournaments");
        }
    }
}
