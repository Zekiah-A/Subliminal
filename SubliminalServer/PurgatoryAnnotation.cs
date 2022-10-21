using System;

namespace SubliminalServer;

public record PurgatoryAnnotation
(
    int Start,
    int End,
    string Content
)