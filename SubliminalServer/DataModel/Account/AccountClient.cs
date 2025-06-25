using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(Id))]
public class AccountClient
{
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public string IpAddress { get; set; }
    public string UserAgent { get; set; }
    public DateTime LastUsed { get; set; }

    public int AccountId { get; set; }
    // Navigation property to the parent AccounData
    public AccountData Account { get; set; }

    // EFCore constructor - Don't use
    public AccountClient() { }

    public AccountClient(string ipAddress, string userAgent, int accountId, DateTime? lastUsed = null)
    {
        IpAddress = ipAddress;
        UserAgent = userAgent;
        AccountId = accountId;
        LastUsed = lastUsed ?? DateTime.Now;
    }
}