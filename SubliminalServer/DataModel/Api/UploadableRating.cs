using SubliminalServer.DataModel.Purgatory;
using SubliminalServer.DataModel.Rating;

namespace SubliminalServer.DataModel.Api;

public record UploadableRating(int EntryKey, RatingType Rating);