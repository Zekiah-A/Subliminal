namespace SubliminalServer;

public static class ValidationFails
{
    public static readonly string[] InvalidUsername = { "Invalid username supplied" };
    public static readonly string[] SummaryTooLong = { "Provided summary must be less than 300 characters." };
    public static readonly string[] PoemNameTooLong = { "Provided poem name must be less than 32 characters." };
    public static readonly string[] PoemContentTooLong = { "Provided poem content must be less than 500000 characters." };
    public static readonly string[] InvalidTagProvided = { "Invalid tag provided" };

    public static readonly string[] ReportReasonTooLong = { "Provided report reason was too long" };
    public static readonly string[] ReportTargetDoesntExist = { "Provided report target does not exist" };
}