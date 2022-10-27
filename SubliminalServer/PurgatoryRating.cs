using System;
using System.Text.Json.Serialization;

namespace SubliminalServer;

public record PurgatoryRating
(
   string? Guid = null,
   PurgatoryRatingType? Type = null
);