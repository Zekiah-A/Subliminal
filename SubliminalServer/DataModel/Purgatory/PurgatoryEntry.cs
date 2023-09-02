using System.Text.Json.Serialization;

namespace SubliminalServer.DataModel.Purgatory;

public class PurgatoryEntry
{
    // Unique, Primary key
    public string EntryKey { get; set; }

    // Client submitted
    // Navigation property to PurgatoryTag
    public List<PurgatoryTag> Tags { get; set; }
    public string Summary { get; set; }
    public bool CWarning { get; set; }
    public string CWarningAdditions { get; set; }
    public string? PageStyle { get; set; }
    public string? PageBackground { get; set; }
    public string PoemName { get; set; }
    public string PoemContent { get; set; }

    // Foreign key AccountData
    public string? AuthorKey { get; set; }
    // Foreign key PurgatoryEntry
    public string? AmendsKey { get; set; }
    // Foreign key PurgatoryEntry
    public string? EditsKey { get; set; }
    
    // Server managed
    public int Approves { get; set; }
    public int Vetoes { get; set; }
    public DateTime DateCreated { get; set; }
    public bool Pick { get; set; }
}

/*
Never modified by client, only used internally
{
    "guid": "1234-5678-9101-1234",
    "approves": "0",
    "vetoes": "0",
    "adminApproves": "0",
    "dateCreated": "12784897318685410675"
    ...
*/

/*
Uploaded by client
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