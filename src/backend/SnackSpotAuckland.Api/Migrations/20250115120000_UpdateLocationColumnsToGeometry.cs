using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SnackSpotAuckland.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLocationColumnsToGeometry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update Snacks table Location column from geography to geometry
            migrationBuilder.Sql("ALTER TABLE \"Snacks\" ALTER COLUMN \"Location\" TYPE geometry(Point, 4326) USING ST_Transform(\"Location\"::geometry, 4326);");

            // Update Users table Location column from geography to geometry
            migrationBuilder.Sql("ALTER TABLE \"Users\" ALTER COLUMN \"Location\" TYPE geometry(Point, 4326) USING ST_Transform(\"Location\"::geometry, 4326);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert Snacks table Location column from geometry to geography
            migrationBuilder.Sql("ALTER TABLE \"Snacks\" ALTER COLUMN \"Location\" TYPE geography(Point) USING \"Location\"::geography;");

            // Revert Users table Location column from geometry to geography
            migrationBuilder.Sql("ALTER TABLE \"Users\" ALTER COLUMN \"Location\" TYPE geography(Point) USING \"Location\"::geography;");
        }
    }
}