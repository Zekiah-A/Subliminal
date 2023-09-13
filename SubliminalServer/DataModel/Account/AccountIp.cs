using Microsoft.EntityFrameworkCore;

namespace SubliminalServer.DataModel.Account;

[PrimaryKey(nameof(AddressKey))]
public class AccountIp
{
    public string AddressKey { get; set; }
    public string Address { get; set; }

    // Foreign key AccountData
    public string AccountKey { get; set; }
    
    // Navigation property to the parent AccounData
    public AccountData Account { get; set; }
}