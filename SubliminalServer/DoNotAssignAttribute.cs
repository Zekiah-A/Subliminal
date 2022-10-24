namespace SubliminalServer;

/// <summary>
/// Indicates that when replacing the whole instance of something, such as a profile, with new profile data, such as
/// from the user modifying their profile in account settings, these are things that the user should never be able to
/// change, meaning subsequenctly that they should not be assigned.
/// </summary>

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public sealed class DoNotAssignAttribute : Attribute
{
    public DoNotAssignAttribute() { }
}