using Microsoft.Extensions.DependencyInjection;
using Speckle.Sdk;
using Speckle.Sdk.Api;
using Speckle.Sdk.Api.GraphQL.Models;
using Speckle.Sdk.Credentials;
using Speckle.Sdk.Host;
using Speckle.Sdk.Models;
using Speckle.Sdk.Transports;

namespace Speckle.Converter;

public static class Convert
{
  public static async Task Ifc(string filePath, string userId, string streamId, string branchName, string commitMessage, string token)
  {
    var serviceCollection = new ServiceCollection();
    serviceCollection.AddSpeckleSdk(HostApplications.Other, HostAppVersion.v2025, "3.0.0");
    var serviceProvider = serviceCollection.BuildServiceProvider();

    await using var file = File.OpenWrite(filePath);
    await Task.Delay(1000);
    Console.WriteLine("Open and parse");

    var operations = serviceProvider.GetRequiredService<IOperations>();
    var transportFactory = serviceProvider.GetRequiredService<IServerTransportFactory>();

    Account account = new Account()
    {
      token = token,
      serverInfo = new ServerInfo()
      {
        url = ""
      }
    };

    using var transport = transportFactory.Create(account, streamId, 60, null);
    await operations.Send((Base)null, transport, true, null);
  }
}