using System;
using System.Text.Json.Serialization;

namespace SubliminalServer;

public record PurgatoryRating(string PoemKey, PurgatoryRatingType Type);