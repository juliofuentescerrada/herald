using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Registration.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestsAndFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "registration");

            migrationBuilder.CreateTable(
                name: "Fields",
                schema: "registration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TermsRevision = table.Column<int>(type: "integer", nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    TermsReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastSequence = table.Column<long>(type: "bigint", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Terms_Admission = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Terms_Capacity = table.Column<int>(type: "integer", nullable: false),
                    Terms_EntryKind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Terms_Registration = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fields", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Guests",
                schema: "registration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NormalisedName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Guests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Entries",
                schema: "registration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TournamentId = table.Column<Guid>(type: "uuid", nullable: false),
                    GuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    GuestKind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    State = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    WaitingReason = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    WaitingSince = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Sequence = table.Column<long>(type: "bigint", nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    EnteredBy = table.Column<Guid>(type: "uuid", nullable: false),
                    EnteredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AdmissionMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AdmittedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    AdmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AdmissionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CancelledBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CancelledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Entries", x => new { x.TournamentId, x.Id });
                    table.ForeignKey(
                        name: "FK_Entries_Fields_TournamentId",
                        column: x => x.TournamentId,
                        principalSchema: "registration",
                        principalTable: "Fields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Entries_GuestId",
                schema: "registration",
                table: "Entries",
                column: "GuestId");

            migrationBuilder.CreateIndex(
                name: "IX_Fields_OrganisationId",
                schema: "registration",
                table: "Fields",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_Guests_OrganisationId",
                schema: "registration",
                table: "Guests",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_Guests_OrganisationId_Kind_NormalisedName",
                schema: "registration",
                table: "Guests",
                columns: new[] { "OrganisationId", "Kind", "NormalisedName" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Entries",
                schema: "registration");

            migrationBuilder.DropTable(
                name: "Guests",
                schema: "registration");

            migrationBuilder.DropTable(
                name: "Fields",
                schema: "registration");
        }
    }
}
