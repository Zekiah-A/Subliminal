using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using SubliminalServer.DataModel.Purgatory;

namespace SubliminalServer.DataModel.Api;

/// <summary>
/// Properties not included here will be ignored in poem upload POST requests,
/// such as server controlled properties not intended to be accepted to be uploaded by a user
/// This interface also includes auxiliary upload attributes, that should be marked with database
/// ignores as their values are used solely during uploading, such as substituting complex structures, like
/// List&lt;PurgatoryTag&gt; for IReadOnlyList&lt;string&gt;, to make JSON Serialization easier, 
/// these values can be applied to the database properties as needed.
/// </summary>
public class UploadableEntry
{
    public string? Summary { get; set; }
    public bool ContentWarning { get; set; }
    public PageStyle PageStyle { get; set; }
    [JsonPropertyName("Background")]
    public string? PageBackgroundUrl { get; set; }
    
    // Database ignored upload property
    [NotMapped]
    [JsonPropertyName("PoemTags")]
    public IReadOnlyList<string> UploadTags { get; set; }
    
    public string PoemName { get; set; }
    public string PoemContent { get; set; }
    
    // Database ignored upload property
    [NotMapped]
    [JsonPropertyName("Amends")]
    public string? UploadAmendsKey { get; init; }
    
    // Database ignored upload property
    [NotMapped]
    [JsonPropertyName("Edits")]
    public string? UploadEditsKey { get; init; }
}