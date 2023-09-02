using WatsonWebsocket;

namespace SubliminalServer.LiveEdit;

/// <summary>
/// Each draft poem has an "editors" field, which allows an editor to come on at any time, and edit live, provided the poem creator has authorised their account.
/// </summary>
public class LiveEditSocketServer
{
    private readonly WatsonWsServer app;
    // List of draft guids + draft poem data that currently have clients connected
    /*private readonly Dictionary<string, PurgatoryAuthenticatedEntry> sessions = new();*/
    private readonly Dictionary<ClientMetadata, LiveEditClient> clients = new();

    private readonly DirectoryInfo draftsDir = new(@"Drafts");

    public LiveEditSocketServer(int port, bool ssl)
    {
        app = new WatsonWsServer(port);
    }
    
    /*
    public async Task StartAsync()
    {
        app.MessageReceived += (sender, args) =>
        {
            if (args.Data.Array is null)
            {
                return;
            }
            
            var dataPacket = new ReadablePacket(args.Data.Array);

            switch ((LiveEditClientPacket) dataPacket.ReadByte())
            {
                // Client is attempting to join a session, via it's draft GUID.
                case LiveEditClientPacket.JoinSession:
                {
                    // First 40 bytes is the account code, for draft edit perms authorisation
                    var code = Encoding.UTF8.GetString(args.Data[1..41]);
                    // Bytes after will be draftGuid
                    var draftGuid = Encoding.UTF8.GetString(args.Data[42..]);

                    if (!await Account.Account.CodeIsValid(code))
                    {
                        await DisconnectClient(args.Client, "Unable to authorise account ownership.");
                        return;
                    }

                    //Create session if does not exist, and load poem data into mem
                    if (!sessions.ContainsKey(draftGuid))
                    {
                       // await using var openStream = File.OpenRead(Path.Join(draftsDir.Name, draftGuid));
                      //  var draftData = await JsonSerializer.DeserializeAsync<PurgatoryAuthenticatedEntry>(openStream, Utils.DefaultJsonOptions);
                        if (draftData is null)
                        {
                            //await DisconnectClient(args.Client, "Draft poem to edit does not exist.");
                            return;
                        }
                        
                        sessions.Add(draftGuid, draftData);
                    }

                    //TODO: Use database
                    var clientGuid = "";//await Account.Account.GetGuid(code);

                    //If client is authed in this draft's data, or is literally the poem owner, then we allow them into the session
                    
                    if (!sessions[draftGuid].AuthorProfileKey.Equals(clientGuid) || !sessions[draftGuid].AuthorisedEditors.Contains(clientGuid))
                    {
                        await DisconnectClient(args.Client, "You are not an authorised editor of this poem.");
                        return;
                    }

                    //Add client to clients list if not already there
                    if (!clients.ContainsKey(args.Client))
                    {
                        clients.Add
                        (
                            args.Client, new LiveEditClient
                            (
                                draftGuid,
                                clientGuid,
                                sessions[draftGuid].AuthorProfileKey == clientGuid ? LiveEditClientType.Owner : LiveEditClientType.Editor
                            )
                        );
                    }
                    else
                    {
                        clients[args.Client] = clients[args.Client] with { Session = draftGuid };
                    }
                    break;
                }
                case LiveEditClientPacket.FormatText:
                {
                    //No-op (yet)
                    break;
                }
                case LiveEditClientPacket.Insertion or LiveEditClientPacket.Deletion:
                {
                    var sessionClient = clients[args.Client];
                    var index = BinaryPrimitives.ReadUInt32BigEndian(args.Data[1..5]);

                    if ((LiveEditClientPacket) args.Data[0] == LiveEditClientPacket.Insertion)
                    {
                        var chars = Encoding.UTF8.GetString(args.Data[6..10]);

                        sessions[sessionClient.Session].PoemContent =
                            sessions[sessionClient.Session].PoemContent.Insert((int) index, chars);
                    }
                    else
                    {
                        var count = BinaryPrimitives.ReadUInt32BigEndian(args.Data[6..10]);

                        sessions[sessionClient.Session].PoemContent =
                            sessions[sessionClient.Session].PoemContent.Remove((int) index, (int) count);
                    }
                    
                    foreach (var other in ClientSessionMembers(sessionClient))
                    {
                     //   await app.SendAsync(other.Key, args.Data);
                    }
                    break;
                }
                case LiveEditClientPacket.Comment or LiveEditClientPacket.CursorPosition:
                {
                    var sessionClient = clients[args.Client];
                    foreach (var other in ClientSessionMembers(sessionClient))
                    {
                       // await app.SendAsync(other.Key, args.Data);
                    }
                    break;
                }
            }
        };

        app.ClientDisconnected += async (sender, args) =>
        {
            //If client disconnected unexpectedly without sending disconnect packet first, safely remove them
            if (clients.ContainsKey(args.Client))
            {
                await DisconnectClient(args.Client, "Unexpected disconnection");
            }
        };

        await app.StartAsync();
    }
    
    private async Task DisconnectClient(ClientMetadata client, string reason)
    {
        // Disconnecting client data
        var sessionClient = clients[client];

        //Tell all others connected this client's session has disconnected
        foreach (var other in ClientSessionMembers(sessionClient))
        {
            await app.SendAsync(other.Key, Encoding.UTF8.GetBytes((byte) LiveEditServerPacket.LeaveSession + sessionClient.AccountGuid));
        }
        
        //Remove them from the local clients list
        clients.Remove(client);
        
        //If this session now has no clients left, we can save and delete the session to conserve memory
        if (!ClientSessionMembers(sessionClient).Any() && sessions.ContainsKey(sessionClient.Session))
        {
            var sessionDraft = sessions[sessionClient.Session];
                
            await using var stream = new FileStream(Path.Join(draftsDir.Name, sessionClient.Session), FileMode.Truncate);
            await JsonSerializer.SerializeAsync(stream, sessionDraft, Utils.DefaultJsonOptions);

            sessions.Remove(sessionClient.Session);
        }

        //If the client is still a member of the websocket, finally terminate their websocket connection
        if (app.Clients.Contains(client))
        {
            //Inform the client that they have been disconnected by server
            await app.SendAsync(client, Encoding.UTF8.GetBytes((byte) LiveEditServerPacket.ErrorMessage + reason));
            await app.DisconnectClientAsync(client);
        }
    }

    private IEnumerable<KeyValuePair<ClientMetadata, LiveEditClient>> ClientSessionMembers(LiveEditClient client)
    {
        return clients.Where(c => c.Value.Session == client.Session && c.Value != client);
    }
    */
}