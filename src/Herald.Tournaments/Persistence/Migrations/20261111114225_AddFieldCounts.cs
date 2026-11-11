using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFieldCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FieldCounts",
                schema: "tournaments",
                columns: table => new
                {
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    Admitted = table.Column<int>(type: "integer", nullable: false),
                    Waiting = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldCounts", x => x.TournamentId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FieldCounts",
                schema: "tournaments");
        }
    }
}
