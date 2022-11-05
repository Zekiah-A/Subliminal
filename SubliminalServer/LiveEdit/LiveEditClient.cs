using WatsonWebsocket;

namespace SubliminalServer.LiveEdit;


public record LiveEditClient(ClientMetadata Metadata, string Session, string AccountGuid, LiveEditClientType ClientType);