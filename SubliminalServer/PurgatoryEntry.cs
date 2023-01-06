using System.Text.Json.Serialization;

namespace SubliminalServer;

public record PurgatoryEntry
(
    string? Summary = null,
    string? Tags  = null,
    bool? CWarning  = null,
    string? CWarningAdditions  = null,
    string? PageStyle  = null,
    string? PageBackground  = null,
    string? Amends = null,
    string? Edits = null,
    string? Signature = null
)
{
    // Parts of an entry that is modifiable & necessary, serialiseable
    [JsonInclude] public string PoemName { get; set; }
    [JsonInclude] public string PoemContent { get; set; }
    [JsonInclude] public string PoemAuthor { get; set; }

    // Server only changeable - does not need to be serialisable
    public string AuthorProfileKey { get; set; }
    public string Guid { get; set; }
    public int Approves { get; set; }
    public int Vetoes { get; set; }
    public int AdminApproves { get; set; }
    public string DateCreated { get; set; }
    
    public List<PurgatoryAnnotation> Annotations { get; set; }
    
    public List<string> AuthorisedEditors { get; set; }
}

/* Never modified by client, only used internally
{
    "guid": "1234-5678-9101-1234",
    "approves": "0",
    "vetoes": "0",
    "adminApproves": "0",
    "dateCreated": "12784897318685410675"
    ...
*/

/* Uploaded by client
{
    "author": "author"
    "summary": "This is an example poem",
    "tags": "Example, Poem, Test, Subliminal, Anthology",
    "cWarning": false,
    "cWarningAdditions": "",
    "poemName": "Test",
    "poemAuthor": "Zekiah",
    "poemContent": "Example",
    "pageStyle": "poem-centre-wide",
    "pageBackground": ""
}
 */