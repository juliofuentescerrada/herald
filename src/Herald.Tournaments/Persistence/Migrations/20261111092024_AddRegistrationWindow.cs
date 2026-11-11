using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationWindow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Registration",
                schema: "tournaments",
                table: "Tournaments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                // Tournaments that already exist have never opened registration.
                defaultValue: "NotOpen");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RegistrationChangedAt",
                schema: "tournaments",
                table: "Tournaments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RegistrationChangedBy",
                schema: "tournaments",
                table: "Tournaments",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Registration",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "RegistrationChangedAt",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "RegistrationChangedBy",
                schema: "tournaments",
                table: "Tournaments");
        }
    }
}
