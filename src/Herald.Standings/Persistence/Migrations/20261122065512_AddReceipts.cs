using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Standings.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReceipts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Receipt",
                schema: "standings",
                columns: table => new
                {
                    OperationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: true),
                    Operation = table.Column<string>(type: "text", nullable: false),
                    ContentHash = table.Column<string>(type: "text", nullable: false),
                    Outcome = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Response = table.Column<string>(type: "text", nullable: true),
                    Revision = table.Column<int>(type: "integer", nullable: true),
                    Resource = table.Column<string>(type: "text", nullable: false),
                    ProblemType = table.Column<string>(type: "text", nullable: true),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: true),
                    At = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receipt", x => x.OperationId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_OrganisationId",
                schema: "standings",
                table: "Receipt",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipt_TournamentId",
                schema: "standings",
                table: "Receipt",
                column: "TournamentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Receipt",
                schema: "standings");
        }
    }
}
