using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(AddressKey))]
public class AccountAddress
{
    // Unique, Primary key
    [Required]
    public int AddressKey { get; set; }
    public string Address { get; set; }

    // Foreign key AccountData
    public int AccountKey { get; set; }
    
    // Navigation property to the parent AccounData
    public AccountData Account { get; set; }
}