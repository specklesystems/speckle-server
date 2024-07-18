using System.Diagnostics;
using Objects.BuiltElements;
using Speckle.Core.Api;
using Speckle.Core.Credentials;
using Speckle.Core.Transports;

var sourceServer = "https://latest.speckle.systems";
var sourceToken = "";
var targetServer = "https://testing3.speckle.dev";
var targetToken = "";

var sourceAccount = new Account
  {
    token = sourceToken,
    serverInfo = new ServerInfo { url = sourceServer }
  };
var sourceProjectId = "ecb4a794dd";
var sourceVersionId = "0bd6f92a13";
var receiveTransport = new ServerTransport(
  sourceAccount,
  sourceProjectId,
  6000 //timeout
);

var sourceClient = new Client(sourceAccount);
var sourceVersion = await sourceClient.CommitGet(sourceProjectId, sourceVersionId);
var sourceObjectId = sourceVersion.referencedObject;

var retrievedObject = await Operations.Receive(sourceObjectId, receiveTransport).ConfigureAwait(false);

Console.WriteLine($"Successfully retrieved an object with ID: '{retrievedObject.id}'");

var targetAccount = new Account
{
  token = targetToken,
  serverInfo = new ServerInfo { url = targetServer }
};
var targetClient = new Client(targetAccount);

var now = DateTime.Now;
var targetProjectId = await targetClient
  .StreamCreate(new StreamCreateInput { name = $"test @ {now}" })
  .ConfigureAwait(false);

if (targetProjectId is null)
{
  throw new Exception("failed to create project");
}

var targetServerTransport = new ServerTransport(targetAccount, targetProjectId, 6000);

var stopwatch = new Stopwatch();
stopwatch.Start();
var objId = await Operations.Send(retrievedObject, new[] { targetServerTransport }).ConfigureAwait(false);
stopwatch.Stop();
Console.WriteLine($"Sending the object to the target server took {stopwatch.ElapsedMilliseconds}");

var targetBranchName = $"test branch @ {now}";
var branch = await targetClient.BranchCreate(new BranchCreateInput {
  streamId = targetProjectId,
  name = targetBranchName
});
if (branch is null) {
  throw new Exception("Failed to create branch.");
}

var commit = await targetClient.CommitCreate(
new CommitCreateInput
{
  streamId = targetProjectId,
  branchName = targetBranchName,
  objectId = objId,
  message = "A large test commit"
});
if (commit is null) {
  throw new Exception("Failed to create commit.");
}

sourceClient.Dispose();
targetClient.Dispose();