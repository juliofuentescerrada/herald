using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCancellationArchiveAndDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Archived",
                schema: "tournaments",
                table: "Tournaments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                schema: "tournaments",
                table: "Tournaments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CancelledAt",
                schema: "tournaments",
                table: "Tournaments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CancelledBy",
                schema: "tournaments",
                table: "Tournaments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledByName",
                schema: "tournaments",
                table: "Tournaments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DateChanges",
                schema: "tournaments",
                table: "Tournaments",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'[]'::jsonb");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Archived",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "CancelledByName",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "DateChanges",
                schema: "tournaments",
                table: "Tournaments");
        }
    }
}
