namespace SubliminalServer.AccountActions;

public enum AccountActionType
{
    // General account actions
    BlockUser,
    UnblockUser,
    FollowUser,
    UnfollowUser,
    LikePoem,
    UnlikePoem,
    RatePoem,
    UploadDraft,
    DeleteDraft,
    GetDraft,
    Report,

    // Location - Account data
    UpdateEmail,
    
    // Location - Account profile
    UpdatePenName,
    UpdateBiography,
    UpdateLocation,
    UpdateRole,
    UpdateAvatar,
    PinPoem,
    UnpinPoem,
}