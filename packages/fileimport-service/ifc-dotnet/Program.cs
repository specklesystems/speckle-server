using System.CommandLine;
using System.Diagnostics;
using System.Text.Json;
using Ara3D.Utils;
using Microsoft.Extensions.DependencyInjection;
using Speckle.Converter;
using Speckle.Importers.Ifc;
using Speckle.Importers.Ifc.Ara3D.IfcParser;
using Speckle.Importers.Ifc.Converters;
using Speckle.Importers.Ifc.Types;
using Speckle.Sdk.Common;
using Speckle.Sdk.Serialisation.V2.Send;
using Speckle.Sdk.SQLite;

async Task RunTest()
{
  var serviceProvider = Import.GetServiceProvider();

  var filePath = new FilePath(
    "ifcs/231110ADT-FZK-Haus-2005-2006.ifc"
  );

  var ifcFactory = serviceProvider.GetRequiredService<IIfcFactory>();
  var stopwatch = Stopwatch.StartNew();

  Console.WriteLine($"Opening with WebIFC: {filePath}");
  var model = ifcFactory.Open(filePath);
  var ms = stopwatch.ElapsedMilliseconds;
  Console.WriteLine($"Opened with WebIFC: {ms} ms");

  var graph = IfcGraph.Load(new FilePath(filePath));
  var ms2 = stopwatch.ElapsedMilliseconds;
  Console.WriteLine($"Loaded with StepParser: {ms2 - ms} ms");

  var converter = serviceProvider.GetRequiredService<IGraphConverter>();
  var b = converter.Convert(model, graph);
  ms = ms2;
  ms2 = stopwatch.ElapsedMilliseconds;
  Console.WriteLine($"Converted to Speckle Bases: {ms2 - ms} ms");

  var cache = $"{Guid.NewGuid()}.db";
  using var sqlite = new SqLiteJsonCacheManager($"Data Source={cache};", 2);
  using var process2 = new SerializeProcess(
    new ConsoleProgress(),
    sqlite,
    new DummyServerObjectManager(),
    new BaseChildFinder(new BasePropertyGatherer()),
    new ObjectSerializerFactory(new BasePropertyGatherer()),
    new SerializeProcessOptions(SkipServer: true)
  );
  Console.WriteLine($"Caching to Speckle: {cache}");

  var (rootId, _) = await process2.Serialize(b, default).ConfigureAwait(false);
  Console.WriteLine(rootId);
  ms2 = stopwatch.ElapsedMilliseconds;
  Console.WriteLine($"Converted to JSON: {ms2 - ms} ms");
#pragma warning restore CA1506
}

var filePathArgument = new Argument<string>(name: "filePath");
var outputPathArgument = new Argument<string>("outputPath");
var streamIdArgument = new Argument<string>("streamId");
var commitMessageArgument = new Argument<string>("commitMessage");
var modelIdArgument = new Argument<string>("modelId");
var regionNameArgument = new Argument<string>("regionName");

var rootCommand = new RootCommand
{
  filePathArgument,
  outputPathArgument,
  streamIdArgument,
  commitMessageArgument,
  modelIdArgument,
  regionNameArgument,
};
rootCommand.SetHandler(
  async (filePath, outputPath, streamId, commitMessage, modelId, _) =>
  {
    try
    {
      var token = Environment.GetEnvironmentVariable("USER_TOKEN").NotNull("USER_TOKEN is missing");
      var url = Environment.GetEnvironmentVariable("SPECKLE_SERVER_URL") ?? "http://127.0.0.1:3000";
      var commitId = await Import.Ifc(url, filePath, streamId, modelId, commitMessage, token);
      File.WriteAllText(outputPath, JsonSerializer.Serialize(new { success = true, commitId }));
    }
    catch (Exception e)
    {
      File.WriteAllText(
        outputPath,
        JsonSerializer.Serialize(new { success = false, error = e.ToString() })
      );
    }
  },
  filePathArgument,
  outputPathArgument,
  streamIdArgument,
  commitMessageArgument,
  modelIdArgument,
  regionNameArgument
);
await rootCommand.InvokeAsync(args);
