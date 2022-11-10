namespace SubliminalServer.AccountActions;

/// <summary>
/// This type is used for all account actions listed in SingleValueAccountActionType.
/// </summary>
/// <param name="ActionType"></param>
/// <param name="Code"></param>
/// <param name="Guid"></param>
public record SingleValueAccountAction(string Code, SingleValueAccountActionType ActionType, object Value) : BaseAccountAction(Code);