namespace SubliminalServer;

public record PurgatoryAnnotation
(
    int Start = -1,
    int End = -1,
    string Content = ""
);