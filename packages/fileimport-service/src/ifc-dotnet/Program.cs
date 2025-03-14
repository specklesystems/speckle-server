using System.CommandLine;
using System.Text.Json;
using Speckle.Importers.Ifc;
using Speckle.Sdk.Common;
using Speckle.Sdk.Models.Extensions;

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
      Console.WriteLine($"IFC Importer failed with exception {e.ToFormattedString()}");

      File.WriteAllText(
        outputPath,
        JsonSerializer.Serialize(new { success = false, error = e.ToFormattedString() })
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
