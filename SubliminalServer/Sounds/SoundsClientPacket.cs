namespace SubliminalServer.Sounds;

public enum SoundsClientPacket
{
    SyncHost = 0,
    SyncZombie,
    UnsyncZombie,
    Play,
    Time,
    Lyrics,
    Search,
    Purgatory,
    Approve,
    Veto,
    SearchRandom,
    SongInfo
}