using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace SubliminalServer.LiveEdit;

using WatsonWebsocket;

/// <summary>
/// Each draft poem has an "editors" field, which allows an editor to come on at any time, and edit live, provided the poem creator has authorised their account.
/// </summary>
public class LiveEditSocketServer
{
    private WatsonWsServer app = new("localhost", 1234, false);
    // List of draft guids that currently have clients connected
    private List<string> sessions = new();
    private Dictionary<ClientMetadata, LiveEditClient> clients = new();

    public async Task Start()
    {
        //In the server's eyes, client does not exist until it has sent a join session packet, therefore no onconnect handler.
        
        app.MessageReceived += async (sender, args) =>
        {
            switch ((LiveEditPacket) args.Data[0])
            {
                // Client is attempting to join a session, via it's draft GUID.
                case LiveEditPacket.JoinSession:
                    // First 40 bytes is the account code, for draft edit perms authorisation
                    var code = Encoding.UTF8.GetString(args.Data[1..41]);
                    // Bytes after will be draftGuid
                    var draftGuid = args.Data[42..];
                    
                    if (!await Account.CodeIsValid(code))
                    {
                        await DisconnectClient(args.Client);
                    }
                    
                    //Open up draft GUID
                    
                    //If client is authed in this draft's data, then we add them to the session
                    
                    //Add client to clients list if not already there

                    break;
            }
        };

        app.ClientDisconnected += async (sender, args) =>
        {
            //If client disconnected unexpectedly without sending disconnect packet first, safely remove them
            if (clients.ContainsKey(args.Client))
            {
                await DisconnectClient(args.Client);
            }
        };

        await app.StartAsync();
    }
    
    private async Task DisconnectClient(ClientMetadata client)
    {
        // Disconnecting client data
        var sessionClient = clients[client];
        
        //Tell all others connected this client's session has disconnected
        foreach (var other in clients.Where(c => c.Value.Session == sessionClient.Session && c.Value != sessionClient))
        {
            await app.SendAsync(other.Key, Encoding.UTF8.GetBytes((byte) LiveEditPacket.ClientLeaveSession + sessionClient.AccountGuid));
        }
        
        //Disconnect client safely from websocket
        await app.SendAsync(client, Encoding.UTF8.GetBytes((byte) LiveEditPacket.ErrorMessage + "Invalid code when attempting to join session"));
        clients.Remove(client);
        app.DisconnectClient(client);

    }
}