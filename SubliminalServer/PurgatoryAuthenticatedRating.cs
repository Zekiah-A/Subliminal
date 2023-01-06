namespace SubliminalServer;

public record PurgatoryAuthenticatedRating(string? Code, string PoemKey, PurgatoryRatingType Type) : PurgatoryRating(PoemKey, Type);