using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Configurations;

public class PurgatoryDraftConfiguration  : IEntityTypeConfiguration<PurgatoryDraft>
{
    public void Configure(EntityTypeBuilder<PurgatoryDraft> builder)
    {
        // Define the primary key
        builder.HasKey(entry => entry.Id);
        
        // Many to one (AccountData)
        builder.HasOne(draft => draft.Author)
            .WithMany(account => account.Drafts) // Use the correct navigation property
            .HasForeignKey(draft => draft.AuthorId);
        
        // One to many PurgatoryEntry (Amends), PurgatoryEntry (AmendedBy)
        builder.HasOne(draft => draft.Amends)
            .WithMany()
            .HasForeignKey(draft => draft.AmendsId);

        // One to many PurgatoryEntry (Edits), PurgatoryEntry (AmendedBy)
        builder.HasOne(draft => draft.Edits)
            .WithMany()
            .HasForeignKey(draft => draft.EditsId);
    }
}