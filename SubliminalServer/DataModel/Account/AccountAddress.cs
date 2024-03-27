using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(AddressKey))]
public class AccountAddress
{
    // Unique, Primary key
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AddressKey { get; set; }
    public string IpAddress { get; set; }

    // Foreign key AccountData
    public int AccountKey { get; set; }
    
    // Navigation property to the parent AccounData
    public AccountData Account { get; set; }
}