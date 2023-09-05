using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Configurations;

public class PurgatoryTagConfiguration : IEntityTypeConfiguration<PurgatoryTag>
{
    public void Configure(EntityTypeBuilder<PurgatoryTag> builder)
    {
        builder.HasNoKey();
    }
}