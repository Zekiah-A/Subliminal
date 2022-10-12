using System.Text.Json.Serialization;

namespace SubliminalServer;

public record PurgatoryEntry
(
    string Summary,
    string Tags,
    bool CWarning,
    string CWarningAdditions,
    string PoemName,
    string PoemAuthor,
    string PoemContent,
    string PageStyle,
    string PageBackground,
    bool Amends
)
{
    public string Guid { get; set; }
    public int Approves { get; set; }
    public int Vetoes { get; set; }
    public int AdminApproves { get; set; }
    public long DateCreated { get; set; }
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
    "pageStyle": "centre-wide",
    "pageBackground": ""
}
 */