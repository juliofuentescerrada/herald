using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Organisations.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationGrants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApplicationGrants",
                schema: "organisations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DirectoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tournaments = table.Column<Guid[]>(type: "uuid[]", nullable: true),
                    Groups = table.Column<string[]>(type: "text[]", nullable: false),
                    GrantedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    GrantedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RevokedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OrganisationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationGrants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApplicationGrants_Persons_GrantedBy",
                        column: x => x.GrantedBy,
                        principalSchema: "organisations",
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationGrants_GrantedBy",
                schema: "organisations",
                table: "ApplicationGrants",
                column: "GrantedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationGrants_OrganisationId",
                schema: "organisations",
                table: "ApplicationGrants",
                column: "OrganisationId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationGrants_OrganisationId_DirectoryId_ObjectId",
                schema: "organisations",
                table: "ApplicationGrants",
                columns: new[] { "OrganisationId", "DirectoryId", "ObjectId" },
                unique: true,
                filter: "\"RevokedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApplicationGrants",
                schema: "organisations");
        }
    }
}
