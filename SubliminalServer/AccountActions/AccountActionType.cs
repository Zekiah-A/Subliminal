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

    // Location - Account data
    UpdateEmail,
    UpdateNumber,
    
    // Location - Account profile
    UpdatePenName,
    UpdateBiography,
    UpdateLocation,
    UpdateRole,
    UpdateAvatar,
    PinPoem,
    UnpinPoem,
}