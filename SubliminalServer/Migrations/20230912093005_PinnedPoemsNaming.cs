using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SubliminalServer.Migrations
{
    /// <inheritdoc />
    public partial class PinnedPoemsNaming : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PinnedPoem");

            migrationBuilder.CreateTable(
                name: "PinnedPoems",
                columns: table => new
                {
                    PinnedPoem = table.Column<string>(type: "TEXT", nullable: false),
                    PinnerAccount = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PinnedPoems", x => new { x.PinnedPoem, x.PinnerAccount });
                    table.ForeignKey(
                        name: "FK_PinnedPoems_Accounts_PinnerAccount",
                        column: x => x.PinnerAccount,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PinnedPoems_PurgatoryEntries_PinnedPoem",
                        column: x => x.PinnedPoem,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PinnedPoems_PinnerAccount",
                table: "PinnedPoems",
                column: "PinnerAccount");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PinnedPoems");

            migrationBuilder.CreateTable(
                name: "PinnedPoem",
                columns: table => new
                {
                    PinnedPoem = table.Column<string>(type: "TEXT", nullable: false),
                    PinnerAccount = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PinnedPoem", x => new { x.PinnedPoem, x.PinnerAccount });
                    table.ForeignKey(
                        name: "FK_PinnedPoem_Accounts_PinnerAccount",
                        column: x => x.PinnerAccount,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PinnedPoem_PurgatoryEntries_PinnedPoem",
                        column: x => x.PinnedPoem,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PinnedPoem_PinnerAccount",
                table: "PinnedPoem",
                column: "PinnerAccount");
        }
    }
}
