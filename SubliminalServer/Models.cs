namespace SubliminalServer;

/// <summary>
/// Date should ideally be a UTC (Universal Time Zone) date
/// </summary>
public record PurgatoryBeforeAfter(DateTime Date, int Count);