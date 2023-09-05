using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Purgatory;

[PrimaryKey(nameof(AnnotationKey))]
public class PurgatoryAnnotation
{
    // Unique, Primary key
    [Required]
    public string AnnotationKey { get; set; }
    
    // Foreign key PurgatoryEntry
    [Required]
    [ForeignKey(nameof(Poem))]
    public string PoemKey { get; set; }
    public PurgatoryEntry Poem { get; set; }
    
    // Foreign key AccountData
    [Required]
    [ForeignKey(nameof(Account))]
    public string AccountKey { get; set; }
    public AccountData Account { get; set; }
    
    public int Start { get; set; }
    public int End { get; set; }
    
    public int Approves { get; set; }
    public int Vetoes { get; set; }
    
    public string Content { get; set; }
}