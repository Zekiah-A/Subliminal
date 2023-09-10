using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(IPAddressKey))]
public class AccountIp
{
    public string IPAddressKey { get; set; }
    public string Address { get; set; }

    // Foreign key AccountData
    public string AccountKey { get; set; }
    
    // Navigation property to the parent AccounData
    public AccountData AccountData { get; set; }
}