using SubliminalServer.DataModel.Rating;

namespace SubliminalServer.ApiModel;

public record UploadableRating(int EntryKey, RatingType Rating);