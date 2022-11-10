namespace SubliminalServer.AccountActions;

public enum SingleValueAccountActionType
{
    // General account actions
    BlockUser,
    UnblockUser,
    FollowUser,
    UnfollowUser,
    LikePoem,
    UnlikePoem,
    
    // Location - Account data
    UpdateEmail,
    UpdateNumber,
    
    //Location - Account profile
    UpdatePenName,
    UpdateBiography,
    UpdateLocation,
    UpdateRole,
    UpdateAvatar,
    PinPoem,
    UnpinPoem,
}