using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubliminalServer.DataModel.Rating;

namespace SubliminalServer.DataModel.Configurations;

public class PurgatoryRatingConfiguration : IEntityTypeConfiguration<PurgatoryRating>
{
    public void Configure(EntityTypeBuilder<PurgatoryRating> builder)
    {
        builder.HasKey(rating => rating.Id);
    }
}