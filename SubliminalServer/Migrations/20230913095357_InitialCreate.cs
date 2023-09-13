using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SubliminalServer.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    AccountKey = table.Column<string>(type: "TEXT", nullable: false, defaultValueSql: "NEWID()"),
                    Token = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    PenName = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Biography = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    Location = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    Role = table.Column<string>(type: "TEXT", maxLength: 12, nullable: true),
                    AvatarUrl = table.Column<string>(type: "TEXT", nullable: true),
                    JoinDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.AccountKey);
                });

            migrationBuilder.CreateTable(
                name: "AccountBadges",
                columns: table => new
                {
                    BadgeKey = table.Column<string>(type: "TEXT", nullable: false, defaultValueSql: "NEWID()"),
                    BadgeType = table.Column<int>(type: "INTEGER", nullable: false),
                    DateAwarded = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AccountKey = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountBadges", x => x.BadgeKey);
                    table.ForeignKey(
                        name: "FK_AccountBadges_Accounts_AccountKey",
                        column: x => x.AccountKey,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AccountIps",
                columns: table => new
                {
                    AddressKey = table.Column<string>(type: "TEXT", nullable: false, defaultValueSql: "NEWID()"),
                    Address = table.Column<string>(type: "TEXT", nullable: false),
                    AccountKey = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountIps", x => x.AddressKey);
                    table.ForeignKey(
                        name: "FK_AccountIps_Accounts_AddressKey",
                        column: x => x.AddressKey,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BlockedAccounts",
                columns: table => new
                {
                    Blocked = table.Column<string>(type: "TEXT", nullable: false),
                    BlockedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockedAccounts", x => new { x.Blocked, x.BlockedBy });
                    table.ForeignKey(
                        name: "FK_BlockedAccounts_Accounts_Blocked",
                        column: x => x.Blocked,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BlockedAccounts_Accounts_BlockedBy",
                        column: x => x.BlockedBy,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FollowingAccounts",
                columns: table => new
                {
                    Followed = table.Column<string>(type: "TEXT", nullable: false),
                    FollowedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FollowingAccounts", x => new { x.Followed, x.FollowedBy });
                    table.ForeignKey(
                        name: "FK_FollowingAccounts_Accounts_Followed",
                        column: x => x.Followed,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FollowingAccounts_Accounts_FollowedBy",
                        column: x => x.FollowedBy,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PurgatoryEntries",
                columns: table => new
                {
                    EntryKey = table.Column<string>(type: "TEXT", nullable: false),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    ContentWarning = table.Column<bool>(type: "INTEGER", nullable: false),
                    PageStyle = table.Column<int>(type: "INTEGER", nullable: false),
                    PageBackgroundUrl = table.Column<string>(type: "TEXT", nullable: true),
                    PoemName = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    PoemContent = table.Column<string>(type: "TEXT", nullable: false),
                    AuthorKey = table.Column<string>(type: "TEXT", nullable: true),
                    AmendsKey = table.Column<string>(type: "TEXT", nullable: true),
                    EditsKey = table.Column<string>(type: "TEXT", nullable: false),
                    Approves = table.Column<int>(type: "INTEGER", nullable: false),
                    Vetoes = table.Column<int>(type: "INTEGER", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Pick = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurgatoryEntries", x => x.EntryKey);
                    table.ForeignKey(
                        name: "FK_PurgatoryEntries_Accounts_AuthorKey",
                        column: x => x.AuthorKey,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey");
                    table.ForeignKey(
                        name: "FK_PurgatoryEntries_PurgatoryEntries_AmendsKey",
                        column: x => x.AmendsKey,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey");
                    table.ForeignKey(
                        name: "FK_PurgatoryEntries_PurgatoryEntries_EditsKey",
                        column: x => x.EditsKey,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LikedPoems",
                columns: table => new
                {
                    LikedPoem = table.Column<string>(type: "TEXT", nullable: false),
                    LikerAccount = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LikedPoems", x => new { x.LikedPoem, x.LikerAccount });
                    table.ForeignKey(
                        name: "FK_LikedPoems_Accounts_LikerAccount",
                        column: x => x.LikerAccount,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LikedPoems_PurgatoryEntries_LikedPoem",
                        column: x => x.LikedPoem,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateTable(
                name: "PurgatoryAnnotations",
                columns: table => new
                {
                    AnnotationKey = table.Column<string>(type: "TEXT", nullable: false),
                    PoemKey = table.Column<string>(type: "TEXT", nullable: false),
                    AccountKey = table.Column<string>(type: "TEXT", nullable: false),
                    Start = table.Column<int>(type: "INTEGER", nullable: false),
                    End = table.Column<int>(type: "INTEGER", nullable: false),
                    Approves = table.Column<int>(type: "INTEGER", nullable: false),
                    Vetoes = table.Column<int>(type: "INTEGER", nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurgatoryAnnotations", x => x.AnnotationKey);
                    table.ForeignKey(
                        name: "FK_PurgatoryAnnotations_Accounts_AccountKey",
                        column: x => x.AccountKey,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurgatoryAnnotations_PurgatoryEntries_PoemKey",
                        column: x => x.PoemKey,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PurgatoryDrafts",
                columns: table => new
                {
                    DraftKey = table.Column<string>(type: "TEXT", nullable: false),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    ContentWarning = table.Column<bool>(type: "INTEGER", nullable: false),
                    PageStyle = table.Column<int>(type: "INTEGER", nullable: false),
                    PageBackgroundUrl = table.Column<string>(type: "TEXT", nullable: true),
                    PoemName = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    PoemContent = table.Column<string>(type: "TEXT", nullable: false),
                    AuthorKey = table.Column<string>(type: "TEXT", nullable: true),
                    AmendsKey = table.Column<string>(type: "TEXT", nullable: true),
                    EditsKey = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurgatoryDrafts", x => x.DraftKey);
                    table.ForeignKey(
                        name: "FK_PurgatoryDrafts_Accounts_AuthorKey",
                        column: x => x.AuthorKey,
                        principalTable: "Accounts",
                        principalColumn: "AccountKey");
                    table.ForeignKey(
                        name: "FK_PurgatoryDrafts_PurgatoryEntries_AmendsKey",
                        column: x => x.AmendsKey,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey");
                    table.ForeignKey(
                        name: "FK_PurgatoryDrafts_PurgatoryEntries_EditsKey",
                        column: x => x.EditsKey,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PurgatoryTags",
                columns: table => new
                {
                    TagKey = table.Column<string>(type: "TEXT", nullable: false),
                    TagName = table.Column<string>(type: "TEXT", nullable: false),
                    EntryKey = table.Column<string>(type: "TEXT", nullable: false),
                    PurgatoryDraftDraftKey = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurgatoryTags", x => x.TagKey);
                    table.ForeignKey(
                        name: "FK_PurgatoryTags_PurgatoryDrafts_PurgatoryDraftDraftKey",
                        column: x => x.PurgatoryDraftDraftKey,
                        principalTable: "PurgatoryDrafts",
                        principalColumn: "DraftKey");
                    table.ForeignKey(
                        name: "FK_PurgatoryTags_PurgatoryEntries_EntryKey",
                        column: x => x.EntryKey,
                        principalTable: "PurgatoryEntries",
                        principalColumn: "EntryKey",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountBadges_AccountKey",
                table: "AccountBadges",
                column: "AccountKey");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Email",
                table: "Accounts",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Username",
                table: "Accounts",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BlockedAccounts_BlockedBy",
                table: "BlockedAccounts",
                column: "BlockedBy");

            migrationBuilder.CreateIndex(
                name: "IX_FollowingAccounts_FollowedBy",
                table: "FollowingAccounts",
                column: "FollowedBy");

            migrationBuilder.CreateIndex(
                name: "IX_LikedPoems_LikerAccount",
                table: "LikedPoems",
                column: "LikerAccount");

            migrationBuilder.CreateIndex(
                name: "IX_PinnedPoems_PinnerAccount",
                table: "PinnedPoems",
                column: "PinnerAccount");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryAnnotations_AccountKey",
                table: "PurgatoryAnnotations",
                column: "AccountKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryAnnotations_PoemKey",
                table: "PurgatoryAnnotations",
                column: "PoemKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryDrafts_AmendsKey",
                table: "PurgatoryDrafts",
                column: "AmendsKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryDrafts_AuthorKey",
                table: "PurgatoryDrafts",
                column: "AuthorKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryDrafts_EditsKey",
                table: "PurgatoryDrafts",
                column: "EditsKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryEntries_AmendsKey",
                table: "PurgatoryEntries",
                column: "AmendsKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryEntries_AuthorKey",
                table: "PurgatoryEntries",
                column: "AuthorKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryEntries_EditsKey",
                table: "PurgatoryEntries",
                column: "EditsKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryTags_EntryKey",
                table: "PurgatoryTags",
                column: "EntryKey");

            migrationBuilder.CreateIndex(
                name: "IX_PurgatoryTags_PurgatoryDraftDraftKey",
                table: "PurgatoryTags",
                column: "PurgatoryDraftDraftKey");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountBadges");

            migrationBuilder.DropTable(
                name: "AccountIps");

            migrationBuilder.DropTable(
                name: "BlockedAccounts");

            migrationBuilder.DropTable(
                name: "FollowingAccounts");

            migrationBuilder.DropTable(
                name: "LikedPoems");

            migrationBuilder.DropTable(
                name: "PinnedPoems");

            migrationBuilder.DropTable(
                name: "PurgatoryAnnotations");

            migrationBuilder.DropTable(
                name: "PurgatoryTags");

            migrationBuilder.DropTable(
                name: "PurgatoryDrafts");

            migrationBuilder.DropTable(
                name: "PurgatoryEntries");

            migrationBuilder.DropTable(
                name: "Accounts");
        }
    }
}
