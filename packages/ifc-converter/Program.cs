using System.CommandLine;
using Speckle.Converter;

var filePathArgument = new Argument<string>
(name: "filePath");
var userIdArgument = new Argument<string>
  ("userId");
var streamIdArgument = new Argument<string>
  ("streamId");
var branchNameArgument = new Argument<string>
  ("branchName");
var commitMessageArgument = new Argument<string>
  ("commitMessage");
var tokenArgument = new Argument<string>
  ("token");

var rootCommand = new RootCommand();
rootCommand.Add(filePathArgument);
rootCommand.Add(userIdArgument);
rootCommand.Add(streamIdArgument);
rootCommand.Add(branchNameArgument);
rootCommand.Add(commitMessageArgument);
rootCommand.Add(tokenArgument);
rootCommand.SetHandler( (filePath, userId, streamId, branchName, commitMessage, token) =>
{
  Speckle.Converter.Convert.Ifc(filePath, userId, streamId, branchName, commitMessage, token);
}, filePathArgument, userIdArgument, streamIdArgument, branchNameArgument, commitMessageArgument, tokenArgument);
await rootCommand.InvokeAsync(args);
