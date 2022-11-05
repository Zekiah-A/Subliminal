namespace SubliminalServer.LiveEdit;

public enum LiveEditPacket
{
    PoemData,
    JoinSession,
    CursorPosition,
    Insertion,
    Deletion,
    Comment,
    SetText,
    FormatText,
    ClientJoinSession,
    ClientLeaveSession,
    ErrorMessage
}