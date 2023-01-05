using WatsonWebsocket;

namespace SubliminalServer.Sounds;

public class SoundsSocketServer
{
    WatsonWsServer app = new WatsonWsServer(1234);
    Dictionary<ClientMetadata, SoundsClient> clients = new();

    public async Task StartAsync()
    {
        app.ClientConnected += (object sender, ClientConnectedEventArgs args) =>
        {
            clients.Add(args.Client, new SoundsClient());
        };

        app.MessageReceived += (object sender, MessageReceivedEventArgs args) =>
        {
            switch ((SoundsClientPacket) args.Data[0])
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

        app.ClientDisconnected += (object sender, ClientDisconnectedEventArgs args) =>
        {
            clients.Remove(args.Client);
        };

        app.Start();
    }
}