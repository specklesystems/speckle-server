using System.CommandLine;
using Microsoft.Extensions.DependencyInjection;
using Speckle.Converter;
using Speckle.Sdk.Common;
using Speckle.Sdk.Credentials;
using Speckle.WebIfc.Importer;


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
var fileIdArgument = new Argument<string>
  ("fileId");
var modelIdArgument = new Argument<string>
  ("modelId");
var regionNameArgument = new Argument<string>
  ("regionName");

var rootCommand = new RootCommand();
rootCommand.Add(filePathArgument);
rootCommand.Add(userIdArgument);
rootCommand.Add(streamIdArgument);
rootCommand.Add(branchNameArgument);
rootCommand.Add(commitMessageArgument);
rootCommand.Add(fileIdArgument);
rootCommand.Add(modelIdArgument);
rootCommand.Add(regionNameArgument);
rootCommand.SetHandler( async(filePath, _, streamId, _, commitMessage, _, modelId, _) =>
{
  var token = Environment.GetEnvironmentVariable("USER_TOKEN").NotNull();
  await  Import.Ifc(new Uri("asdf").ToString(), filePath, streamId, modelId, commitMessage,token);
}, filePathArgument, userIdArgument, streamIdArgument, branchNameArgument, commitMessageArgument, fileIdArgument, modelIdArgument ,regionNameArgument );
await rootCommand.InvokeAsync(args);


/*
var serviceProvider = Import.GetServiceProvider();
var  account = serviceProvider.GetRequiredService<IAccountManager>().GetDefaultAccount().NotNull();
var url = "https://latest.speckle.systems/";
var streamId = "aa44fe8d6a";
var modelId = "8f4b7fa648";
var filePath = "C:\\Users\\adam\\Git\\IFC-toolkit\\test-files\\ISSUE_068_ARK_NUS_skolebygg.ifc";

await  Import.Ifc(serviceProvider, url, filePath, streamId, modelId, "ifc test", account.token);
*/
