using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChangeLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChangeLog",
                schema: "tournaments",
                columns: table => new
                {
                    Kind = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Subject = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectRevision = table.Column<int>(type: "integer", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    At = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Changes = table.Column<string>(type: "jsonb", nullable: false),
                    TimeZone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Alias = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Cause = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Public = table.Column<bool>(type: "boolean", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChangeLog", x => new { x.Kind, x.Subject, x.SubjectRevision });
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChangeLog_OrganisationId",
                schema: "tournaments",
                table: "ChangeLog",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChangeLog_TournamentId_At",
                schema: "tournaments",
                table: "ChangeLog",
                columns: new[] { "TournamentId", "At" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChangeLog",
                schema: "tournaments");
        }
    }
}
