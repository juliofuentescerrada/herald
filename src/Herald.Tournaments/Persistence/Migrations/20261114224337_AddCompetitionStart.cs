using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Herald.Tournaments.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCompetitionStart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Competition",
                schema: "tournaments",
                table: "Tournaments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Preparing");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "StartedAt",
                schema: "tournaments",
                table: "Tournaments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StartedBy",
                schema: "tournaments",
                table: "Tournaments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StartedOnEligibleRevision",
                schema: "tournaments",
                table: "Tournaments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StartedOnScheduleRevision",
                schema: "tournaments",
                table: "Tournaments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Eligible",
                schema: "tournaments",
                table: "FieldCounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EligibleRevision",
                schema: "tournaments",
                table: "FieldCounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Pending",
                schema: "tournaments",
                table: "FieldCounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RostersOutsideBounds",
                schema: "tournaments",
                table: "FieldCounts",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SharedMemberNames",
                schema: "tournaments",
                table: "FieldCounts",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Competition",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "StartedBy",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "StartedOnEligibleRevision",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "StartedOnScheduleRevision",
                schema: "tournaments",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "Eligible",
                schema: "tournaments",
                table: "FieldCounts");

            migrationBuilder.DropColumn(
                name: "EligibleRevision",
                schema: "tournaments",
                table: "FieldCounts");

            migrationBuilder.DropColumn(
                name: "Pending",
                schema: "tournaments",
                table: "FieldCounts");

            migrationBuilder.DropColumn(
                name: "RostersOutsideBounds",
                schema: "tournaments",
                table: "FieldCounts");

            migrationBuilder.DropColumn(
                name: "SharedMemberNames",
                schema: "tournaments",
                table: "FieldCounts");
        }
    }
}
