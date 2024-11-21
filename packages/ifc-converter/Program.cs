using System.CommandLine;
using Speckle.Sdk.Common;
using Speckle.WebIfc.Importer;

var filePathArgument = new Argument<string>(name: "filePath");
var userIdArgument = new Argument<string>("userId");
var streamIdArgument = new Argument<string>("streamId");
var branchNameArgument = new Argument<string>("branchName");
var commitMessageArgument = new Argument<string>("commitMessage");
var fileIdArgument = new Argument<string>("fileId");
var modelIdArgument = new Argument<string>("modelId");
var regionNameArgument = new Argument<string>("regionName");

var rootCommand = new RootCommand
{
  filePathArgument,
  userIdArgument,
  streamIdArgument,
  branchNameArgument,
  commitMessageArgument,
  fileIdArgument,
  modelIdArgument,
  regionNameArgument,
};
rootCommand.SetHandler(
  async (filePath, _, streamId, _, commitMessage, _, modelId, _) =>
  {
    var token = Environment.GetEnvironmentVariable("USER_TOKEN").NotNull("USER_TOKEN is missing");
    var url = Environment.GetEnvironmentVariable("SPECKLE_SERVER_URL") ?? "http://127.0.0.1:3000";
    await Import.Ifc(url, filePath, streamId, modelId, commitMessage, token);
  },
  filePathArgument,
  userIdArgument,
  streamIdArgument,
  branchNameArgument,
  commitMessageArgument,
  fileIdArgument,
  modelIdArgument,
  regionNameArgument
);
await rootCommand.InvokeAsync(args);
