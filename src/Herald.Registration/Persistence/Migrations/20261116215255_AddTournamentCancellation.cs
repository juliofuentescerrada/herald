using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Registration.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentCancellation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TournamentCancelledAt",
                schema: "registration",
                table: "Fields",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TournamentCancelledAt",
                schema: "registration",
                table: "Fields");
        }
    }
}
