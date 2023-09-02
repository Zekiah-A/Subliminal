namespace SubliminalServer;

/// <summary>
/// Fairly useless semantic class. Will convert a given payload size in some other unit to bytes.
/// </summary>
public class PayloadSize
{
    private readonly long sizeBytes;

    public PayloadSize(long size)
    {
        sizeBytes = size;
    }
    
    public static PayloadSize FromGigabytes(int count)
    {
        return new PayloadSize(count * 1000000000);
    }

    public static PayloadSize FromMegabytes(int count)
    {
        return new PayloadSize(count * 1000000);
    }

    public static PayloadSize FromKilobytes(int count)
    {
        return new PayloadSize(count * 1000);
    }
    
    public static implicit operator long(PayloadSize payload) => payload.sizeBytes;
}