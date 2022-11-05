namespace SubliminalServer.LiveEdit;

/// <summary>
/// Packet only sent from server -> Client
/// </summary>
public enum LiveEditServerPacket
{
    PoemData,
    JoinSession,
    LeaveSession,
    ErrorMessage
}