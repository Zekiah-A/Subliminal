using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SubliminalServer.DataModel.Account;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Rating;

[PrimaryKey(nameof(RatingKey))]
public class PurgatoryRating
{
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int RatingKey { get; set; }
    // This should only be Approve | Veto
    public RatingType RatingType { get; set; }
    public RatingTarget TargetType { get; set; }
    
    // Foreign key PurgatoryEntry
    [Required]
    [ForeignKey(nameof(PurgatoryEntry))]
    public int TargetKey { get; set; }
    // Navigation property PurgatoryEntry | PurgatoryAnnotation
    public object Target { get; set; }
    
    // Foreign Key PurgatoryEntry | PurgatoryAnnotation
    [Required]
    [ForeignKey(nameof(AccountData))]
    public int AccountKey { get; set; }
    // Navigation property AccountData
    public AccountData Account { get; set; }
}
