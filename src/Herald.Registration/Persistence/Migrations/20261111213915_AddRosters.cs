using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Registration.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRosters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Terms_MaximumRosterSize",
                schema: "registration",
                table: "Fields",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Terms_MinimumRosterSize",
                schema: "registration",
                table: "Fields",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RosterRevision",
                schema: "registration",
                table: "Entries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "RosterChanges",
                schema: "registration",
                columns: table => new
                {
                    RosterRevision = table.Column<int>(type: "integer", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    GuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ChangedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RosterChanges", x => new { x.TournamentId, x.EntryId, x.RosterRevision });
                    table.ForeignKey(
                        name: "FK_RosterChanges_Entries_TournamentId_EntryId",
                        columns: x => new { x.TournamentId, x.EntryId },
                        principalSchema: "registration",
                        principalTable: "Entries",
                        principalColumns: new[] { "TournamentId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RosterMembers",
                schema: "registration",
                columns: table => new
                {
                    GuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    AddedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    AddedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RosterMembers", x => new { x.TournamentId, x.EntryId, x.GuestId });
                    table.ForeignKey(
                        name: "FK_RosterMembers_Entries_TournamentId_EntryId",
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
                name: "RosterChanges",
                schema: "registration");

            migrationBuilder.DropTable(
                name: "RosterMembers",
                schema: "registration");

            migrationBuilder.DropColumn(
                name: "Terms_MaximumRosterSize",
                schema: "registration",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "Terms_MinimumRosterSize",
                schema: "registration",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "RosterRevision",
                schema: "registration",
                table: "Entries");
        }
    }
}
