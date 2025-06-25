using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SubliminalServer.DataModel.Account;

namespace SubliminalServer.DataModel.Report;

public class AccountReport : Report
{
    [Required]
    [ForeignKey(nameof(Account))]
    public int AccountId { get; set; }
    // Navigation property to reported account
    public AccountData Account { get; set; }

}