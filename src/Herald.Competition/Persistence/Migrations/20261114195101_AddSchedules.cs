using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Competition.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "competition");

            migrationBuilder.CreateTable(
                name: "Schedules",
                schema: "competition",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Field = table.Column<string>(type: "jsonb", nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    Draft = table.Column<string>(type: "jsonb", nullable: true),
                    Publications = table.Column<string>(type: "jsonb", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Schedules", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Schedules_OrganisationId",
                schema: "competition",
                table: "Schedules",
                column: "OrganisationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Schedules",
                schema: "competition");
        }
    }
}
