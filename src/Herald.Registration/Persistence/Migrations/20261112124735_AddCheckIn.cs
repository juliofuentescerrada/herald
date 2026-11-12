using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Registration.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCheckIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CheckInRevision",
                schema: "registration",
                table: "Entries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsCheckedIn",
                schema: "registration",
                table: "Entries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "CheckInChanges",
                schema: "registration",
                columns: table => new
                {
                    CheckInRevision = table.Column<int>(type: "integer", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ChangedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckInChanges", x => new { x.TournamentId, x.EntryId, x.CheckInRevision });
                    table.ForeignKey(
                        name: "FK_CheckInChanges_Entries_TournamentId_EntryId",
                        columns: x => new { x.TournamentId, x.EntryId },
                        principalSchema: "registration",
                        principalTable: "Entries",
                        principalColumns: new[] { "TournamentId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CheckInChanges",
                schema: "registration");

            migrationBuilder.DropColumn(
                name: "CheckInRevision",
                schema: "registration",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "IsCheckedIn",
                schema: "registration",
                table: "Entries");
        }
    }
}
