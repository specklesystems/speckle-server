using System.CommandLine;
using System.Text.Json;
using Speckle.Importers.Ifc;
using Speckle.Sdk.Common;
using Speckle.Sdk.Models.Extensions;

var filePathArgument = new Argument<string>("filePath");
var outputPathArgument = new Argument<string>("outputPath");
var projectIdArgument = new Argument<string>("projectId");
var versionMessageArgument = new Argument<string>("versionMessage");
var modelIdArgument = new Argument<string>("modelId");
var modelNameArgument = new Argument<string>("modelName");
var regionNameArgument = new Argument<string>("regionName");

var rootCommand = new RootCommand
{
  filePathArgument,
  outputPathArgument,
  projectIdArgument,
  versionMessageArgument,
  modelIdArgument,
  modelNameArgument,
  regionNameArgument,
};

rootCommand.SetHandler(
  async (filePath, outputPath, projectId, versionMessage, modelId, modelName, _) =>
  {
    try
    {
      var token = Environment.GetEnvironmentVariable("USER_TOKEN").NotNull("USER_TOKEN is missing");
      var url = Environment.GetEnvironmentVariable("SPECKLE_SERVER_URL") ?? "http://127.0.0.1:3000";
      ImporterArgs args = new()
      {
        ServerUrl = new(url),
        FilePath = filePath,
        ProjectId = projectId,
        ModelId = modelId,
        ModelName = modelName,
        VersionMessage = versionMessage,
        Token = token
      };

      var commitId = await Import.Ifc(args);
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
  projectIdArgument,
  versionMessageArgument,
  modelIdArgument,
  modelNameArgument,
  regionNameArgument
);
await rootCommand.InvokeAsync(args);
