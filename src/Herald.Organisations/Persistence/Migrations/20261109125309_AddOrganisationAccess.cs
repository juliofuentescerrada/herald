using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Organisations.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganisationAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "organisations");

            migrationBuilder.CreateTable(
                name: "Persons",
                schema: "organisations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DirectoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Persons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IdentityRelinks",
                schema: "organisations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonId = table.Column<Guid>(type: "uuid", nullable: false),
                    Operator = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    At = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Current_DirectoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    Current_ObjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Previous_DirectoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    Previous_ObjectId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdentityRelinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IdentityRelinks_Persons_PersonId",
                        column: x => x.PersonId,
                        principalSchema: "organisations",
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Organisations",
                schema: "organisations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organisations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Organisations_Persons_CreatedBy",
                        column: x => x.CreatedBy,
                        principalSchema: "organisations",
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Memberships",
                schema: "organisations",
                columns: table => new
                {
                    PersonId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OrganisationRef = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Memberships", x => new { x.OrganisationId, x.PersonId });
                    table.CheckConstraint("CK_Membership_OrganisationRef_matches_owner", "\"OrganisationRef\" = \"OrganisationId\"");
                    table.ForeignKey(
                        name: "FK_Memberships_Organisations_OrganisationRef",
                        column: x => x.OrganisationRef,
                        principalSchema: "organisations",
                        principalTable: "Organisations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Memberships_Persons_PersonId",
                        column: x => x.PersonId,
                        principalSchema: "organisations",
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IdentityRelinks_PersonId",
                schema: "organisations",
                table: "IdentityRelinks",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_OrganisationId",
                schema: "organisations",
                table: "Memberships",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_OrganisationRef",
                schema: "organisations",
                table: "Memberships",
                column: "OrganisationRef");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_PersonId",
                schema: "organisations",
                table: "Memberships",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Organisations_CreatedBy",
                schema: "organisations",
                table: "Organisations",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Persons_DirectoryId_ObjectId",
                schema: "organisations",
                table: "Persons",
                columns: new[] { "DirectoryId", "ObjectId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IdentityRelinks",
                schema: "organisations");

            migrationBuilder.DropTable(
                name: "Memberships",
                schema: "organisations");

            migrationBuilder.DropTable(
                name: "Organisations",
                schema: "organisations");

            migrationBuilder.DropTable(
                name: "Persons",
                schema: "organisations");
        }
    }
}
