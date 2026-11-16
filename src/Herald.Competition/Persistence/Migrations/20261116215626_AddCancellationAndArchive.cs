using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Competition.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCancellationAndArchive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ArchiveRevision",
                schema: "competition",
                table: "Schedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "Archived",
                schema: "competition",
                table: "Schedules",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CancelledAt",
                schema: "competition",
                table: "Schedules",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CancelledBy",
                schema: "competition",
                table: "Schedules",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArchiveRevision",
                schema: "competition",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "Archived",
                schema: "competition",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                schema: "competition",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                schema: "competition",
                table: "Schedules");
        }
    }
}
