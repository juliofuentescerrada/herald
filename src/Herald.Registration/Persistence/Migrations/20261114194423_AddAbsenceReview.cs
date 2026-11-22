using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Registration.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAbsenceReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EligibleRevision",
                schema: "registration",
                table: "Fields",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Terms_CheckIn",
                schema: "registration",
                table: "Fields",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Optional");

            migrationBuilder.AddColumn<bool>(
                name: "Terms_FieldLocked",
                schema: "registration",
                table: "Fields",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CancellationCause",
                schema: "registration",
                table: "Entries",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            // Every cancellation before the absence review was the owner's.
            migrationBuilder.Sql("""UPDATE registration."Entries" SET "CancellationCause" = 'Owner' WHERE "State" = 'Cancelled';""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EligibleRevision",
                schema: "registration",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "Terms_CheckIn",
                schema: "registration",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "Terms_FieldLocked",
                schema: "registration",
                table: "Fields");

            migrationBuilder.DropColumn(
                name: "CancellationCause",
                schema: "registration",
                table: "Entries");
        }
    }
}
