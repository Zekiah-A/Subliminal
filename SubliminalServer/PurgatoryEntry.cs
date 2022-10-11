using System.Text.Json.Serialization;

namespace SubliminalServer;

public abstract record PurgatoryEntry
(
    string Author,
    string Summary,
    string Tags,
    bool CWarning,
    string CWarningAdditions,
    string PoemName,
    string PoemAuthor,
    string PoemContent,
    string PageStyle,
    string PageBackground
)
{
    public string Guid;
    public int Approves;
    public int Vetoes;
    public int AdminApproves;
    public long DateCreated;
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