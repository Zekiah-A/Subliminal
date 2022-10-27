namespace SubliminalServer;

public record PurgatoryAuthenticatedAnnotation(string? Code, string PoemGuid) : PurgatoryAnnotation;