namespace SubliminalServer;

public record PurgatoryDraftEntry(
    List<string> AuthorisedEditors,
    string? Code
) : PurgatoryAuthenticatedEntry(Code);