using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SubliminalServer.Account;

public static class Account
{
    private static readonly DirectoryInfo AccountsDir = new ("Accounts");
    private static readonly FileInfo CodeHashGuidFile = new (Path.Join(AccountsDir.Name, "code-hash-guid.txt"));
    
    /// <summary>
    /// Uses SHA256 hashing to convert a code into a unique hash, that can not be read by someone who somehow gains access to raw account data.
    /// </summary>
    public static string HashSha256String(string text)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
        return bytes.Aggregate("", (current, b) => current + b.ToString("x2"));
    }

    /// <summary>
    /// Gets the public account GUID from a supplied account code. Technically this also verifies that an account code is valid/exists, but it is not recommended.
    /// </summary>
    public static async Task<string> GetGuid(string code)
    {
        var map = await File.ReadAllLinesAsync(CodeHashGuidFile.FullName);
        var codeHash = HashSha256String(code);

        foreach (var line in map)
        {
            var split = line.Split(" ");
            if (split.Length < 2) continue;
        
            var accountCode = split[0];
            var accountGuid = split[1];
            
            if (accountCode.Equals(codeHash)) return accountGuid;
        }

        throw new Exception("Account code was invalid, or could not find a GUID for this account code.");
    }

    /// <summary>
    /// Checks if the supplied code is valid and maps to an account, allowing us to authorise an action. 
    /// </summary>
    /// <param name="code"></param>
    public static async Task<bool> CodeIsValid(string code)
    {
        var codeHashMap = await File.ReadAllLinesAsync(CodeHashGuidFile.FullName);
        var codeHash = HashSha256String(code);

        return codeHashMap
            .Select(line => line.Split(" "))
            .Where(split => split.Length >= 2)
            .Select(split => split[0])
            .Any(accountCode => accountCode.Equals(codeHash));
    }

    public static bool GuidIsValid(string guid)
    {
        return File.Exists(Path.Join(AccountsDir.Name, guid));
    }

    public static async Task<AccountData> GetAccountData(string guid)
    {
        await using var openStream = File.OpenRead(Path.Join(AccountsDir.Name, guid));
        var accountData = await JsonSerializer.DeserializeAsync<AccountData>(openStream, Utils.DefaultJsonOptions);
        if (accountData is null) throw new NullReferenceException(nameof(accountData));
        
        return accountData;
    }

    public static async Task SaveAccountData(AccountData data)
    {
        await using var stream = new FileStream(Path.Join(AccountsDir.Name, data.Guid), FileMode.Truncate);
        await JsonSerializer.SerializeAsync(stream, data, Utils.DefaultJsonOptions);
    }
}