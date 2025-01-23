using Speckle.Sdk.Transports;

namespace Speckle.Converter;

public class ConsoleProgress : IProgress<ProgressArgs>
{
  private readonly TimeSpan DEBOUNCE = TimeSpan.FromSeconds(1);
  private DateTime _lastTime = DateTime.UtcNow;

  private long _totalBytes;

  public void Report(ProgressArgs value)
  {
    if (value.ProgressEvent == ProgressEvent.DownloadBytes)
    {
      Interlocked.Add(ref _totalBytes, value.Count);
    }
    var now = DateTime.UtcNow;
    if (now - _lastTime >= DEBOUNCE)
    {
      if (value.ProgressEvent == ProgressEvent.DownloadBytes)
      {
        Console.WriteLine(value.ProgressEvent + " t " + _totalBytes);
      }
      else
      {
        Console.WriteLine(value.ProgressEvent + " c " + value.Count + " t " + value.Total);
      }

      _lastTime = now;
    }
  }
}
