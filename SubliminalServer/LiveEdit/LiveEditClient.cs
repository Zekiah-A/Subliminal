using WatsonWebsocket;

namespace SubliminalServer.LiveEdit;

public record LiveEditClient(string Session, string AccountGuid, LiveEditClientType ClientType);