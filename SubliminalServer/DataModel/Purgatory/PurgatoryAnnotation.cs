namespace SubliminalServer.DataModel.Purgatory;

public class PurgatoryAnnotation
{
    // Unique, Primary key
    public string AnnotationKey { get; set; }
    
    // Foreign key PurgatoryEntry
    public string PoemKey { get; set; }
    
    // Foreign key Account
    public string AccountKey { get; set; }
    
    public int Start { get; set; }
    public int End { get; set; }
    
    public int Approves { get; set; }
    public int Vetoes { get; set; }
    
    public string Content { get; set; }
}