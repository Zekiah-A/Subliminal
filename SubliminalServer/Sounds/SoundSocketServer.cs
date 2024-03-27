using DataProto;
using WatsonWebsocket;

namespace SubliminalServer.Sounds;

public class SoundsSocketServer
{
    WatsonWsServer app = new WatsonWsServer(1234);
    Dictionary<ClientMetadata, SoundsClient> clients = new();

    public void Start()
    {
        app.ClientConnected += (sender, args) =>
        {
            clients.Add(args.Client, new SoundsClient());
        };

        app.MessageReceived += (sender, args) =>
        {
            var packet = new ReadablePacket(args.Data.ToArray());
            
            switch ((SoundsClientPacket) packet.ReadByte())
            {
                case SoundsClientPacket.Play:
                    return;
                case SoundsClientPacket.SyncHost:
                    break;
                case SoundsClientPacket.SyncZombie:
                    break;
                case SoundsClientPacket.UnsyncZombie:
                    break;
                case SoundsClientPacket.Time:
                    break;
                case SoundsClientPacket.Lyrics:
                    break;
                case SoundsClientPacket.Search:
                    break;
                case SoundsClientPacket.Purgatory:
                    break;
                case SoundsClientPacket.Approve:
                    break;
                case SoundsClientPacket.Veto:
                    break;
                case SoundsClientPacket.SearchRandom:
                    break;
                case SoundsClientPacket.SongInfo:
                    break;
            }
        };

        app.ClientDisconnected += (sender, args) =>
        {
            clients.Remove(args.Client);
        };

        app.Start();
    }
}