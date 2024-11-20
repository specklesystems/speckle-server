using System.CommandLine;
using Microsoft.Extensions.DependencyInjection;
using Speckle.Converter;
using Speckle.Sdk.Common;
using Speckle.Sdk.Credentials;
using Speckle.WebIfc.Importer;

/*
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
await rootCommand.InvokeAsync(args);*/



var serviceProvider = Import.GetServiceProvider();
var  account = serviceProvider.GetRequiredService<IAccountManager>().GetDefaultAccount().NotNull();
var url = "https://latest.speckle.systems/";
var streamId = "aa44fe8d6a";
var modelId = "8f4b7fa648";
var filePath = "C:\\Users\\adam\\Git\\IFC-toolkit\\test-files\\ISSUE_068_ARK_NUS_skolebygg.ifc";

await  Import.Ifc(serviceProvider, url, filePath, streamId, modelId, "ifc test", account.token);
