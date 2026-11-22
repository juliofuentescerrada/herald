using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCancelledAtRevision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CancelledAtRevision",
                schema: "tournaments",
                table: "Tournaments",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelledAtRevision",
                schema: "tournaments",
                table: "Tournaments");
        }
    }
}
