namespace SubliminalServer.LiveEdit;

/// <summary>
/// Packets sent by client that server may loop onto other clients
/// </summary>
public enum LiveEditClientPacket
{
    JoinSession,
    CursorPosition,
    CaretPosition,
    Insertion,
    Deletion,
    Comment,
    FormatText,
}