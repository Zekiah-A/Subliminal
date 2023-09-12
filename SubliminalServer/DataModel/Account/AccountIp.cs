using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(AccountIpKey))]
public class AccountIp
{
    public string AccountIpKey { get; set; }
    public string Address { get; set; }

    // Foreign key AccountData
    public string AccountKey { get; set; }
    
    // Navigation property to the parent AccounData
    public AccountData AccountData { get; set; }
}