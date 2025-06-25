using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Rating;

[PrimaryKey(nameof(Id))]
public class PurgatoryRating
{
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    // This should only be Approve | Veto
    public RatingType RatingType { get; set; }
    
    // Foreign key PurgatoryEntry
    [Required]
    [ForeignKey(nameof(PurgatoryEntry))]
    public int EntryKey { get; set; }
    public PurgatoryEntry Entry { get; set; }
    
    // Foreign Key PurgatoryEntry | PurgatoryAnnotation
    [Required]
    [ForeignKey(nameof(AccountData))]
    public int AccountKey { get; set; }
    // Navigation property AccountData
    public AccountData Account { get; set; }
}
