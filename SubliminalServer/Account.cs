using System.Security.Cryptography;
using System.Text;

namespace SubliminalServer;

public static class Account
{
    private static readonly DirectoryInfo accountsDir = new ("Accounts");
    private static readonly FileInfo codeHashGuidFile = new (Path.Join(accountsDir.Name, "code-hash-guid.txt"));
    
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
        var map = await File.ReadAllLinesAsync(codeHashGuidFile.FullName);
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
        var map = await File.ReadAllLinesAsync(codeHashGuidFile.FullName);
        var codeHash = HashSha256String(code);

        foreach (var line in map)
        {
            var split = line.Split(" ");
            if (split.Length < 2) continue;
        
            var accountCode = split[0];
            if (accountCode.Equals(codeHash)) return true;
        }

        return false;
    }
}