using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SubliminalServer.DataModel.Purgatory;

/// <summary>
/// Properties not included here will be ignored in poem upload POST requests,
/// such as server controlled properties not intended to be accepted to be uploaded by a user
/// This interface alsol includes auxillary upload attributes, that should be marked with database
/// ignores as their values are used solely during uploading, such as substituding complex structures, like
/// List<PurgatoryTag> for IReadOnlyList<string>, to make JSON Serialization easier, 
/// these values can be applid to the databse propertes as needed.
/// </summary>
public interface IUploadablePoem
{
    public string? Summary { get; set; }
    public bool ContentWarning { get; set; }
    public PageStyle PageStyle { get; set; }

    public string? PageBackgroundUrl { get; set; }
    public List<string> UploadTags { get; set; } // Upload attribute
    public string PoemName { get; set; }
    public string PoemContent { get; set; }

    public string? UploadAmendsKey { get; set; } // Upload attribute

    public string? UploadEditsKey { get; set; } // Upload attribute
}
