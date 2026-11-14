using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Registration.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRosterFreeze : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Terms_CompetitionStarted",
                schema: "registration",
                table: "Fields",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "FrozenRosterRevision",
                schema: "registration",
                table: "Entries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RosterFrozenAt",
                schema: "registration",
                table: "Entries",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Terms_CompetitionStarted",
                schema: "registration",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "FrozenRosterRevision",
                schema: "registration",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "RosterFrozenAt",
                schema: "registration",
                table: "Entries");
        }
    }
}
