using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Competition.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchResolution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Resolution",
                schema: "competition",
                table: "Matches",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Resolution",
                schema: "competition",
                table: "Matches");
        }
    }
}
