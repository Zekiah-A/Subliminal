namespace SubliminalServer;

public record PurgatoryAnnotation
(
    int? Start = null,
    int? End = null,
    string? Content = null
);