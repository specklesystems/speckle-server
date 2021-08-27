<h1 align="center">
  <img src="https://user-images.githubusercontent.com/2679513/131189167-18ea5fe1-c578-47f6-9785-3748178e4312.png" width="150px"/><br/>
  Speckle
</h1><br/>
<p align="center"><b>Speckle</b> is data infrastructure for the AEC industry.</p><br/>

<p align="center"><a href="https://twitter.com/SpeckleSystems"><img src="https://img.shields.io/twitter/follow/SpeckleSystems?style=social" alt="Twitter Follow"></a> <a href="https://speckle.community"><img src="https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&amp;style=flat-square&amp;logo=discourse&amp;logoColor=white" alt="Community forum users"></a> <a href="https://speckle.systems"><img src="https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square" alt="website"></a> <a href="https://speckle.guide/dev/"><img src="https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&amp;logo=read-the-docs&amp;logoColor=white" alt="docs"></a></p>
<p align="center"><a href="https://github.com/Speckle-Next/SpeckleServer/"><img src="https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&amp;circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29" alt="Speckle-Next"></a> <a href="https://codecov.io/gh/specklesystems/speckle-server"><img src="https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg" alt="codecov"></a></p>

Introduction

What is Speckle? Check our 

Features

- Object-based: say goodbye to files! Speckle is the first object based platform for the AEC industry
- Version control: Speckle is the Git & Hub for geometry and BIM data
- Collaboration: share your designs collaborate with others
- 3D Viewer: see your CAD and BIM models online, share and embed them anywhere
- Interoperability: get your CAD and BIM models into other software without exporting or importing
- Real time: get real time updates and notifications and changes
- GraphQL API: get what you need anywhere you want it
- Webhooks: the base for a automation and next-gen pipelines
- Built for developers: we are building Speckle with developers in mind and got tools for every stack
- Built for the AEC industry: Speckle connectors are plugins for the most common software used in the industry such as Revit, Rhino, Grasshopper, AutoCAD, Civil 3D, Excel, Unreal Engine, Unity, QGIS, Blender and more!

Try Speckle now!

Give Speckle a try in no time by:

- using our general availability instance at ⇒  
- deploying an instance in 1 click ⇒ 

Resources

  



Speckle Server | Repo structure

This monorepo is the home of the Speckle v2 web packages:

-  Server, a nodejs app. Core external dependencies are a Redis and Postgresql db.

- Frontend, the frontend is a static Vue app.

- Viewer, a threejs extension that allows you to display 3D data 

- Object Loader, a small js utility class that helps you stream an object and all its sub-components from the Speckle Server API.
  
- ➡️ Preview Service, generates object previews for Speckle Objects headlessly. This package is meant to be called on by the server.

Other repos

Make sure to also check and ⭐️ these other Speckle repositories:

- speckle-sharp .NET tooling, connectors and interoperability
- specklepy Python SDK 🐍
- and more connectos & tooling!



Developing and Debugging

Have you checked our dev docs?

We have a detailed section on deploying a Speckle server. To get started developing locally, you can see the run in development mode chapter.

Contributing

Please make sure you read the contribution guidelines for an overview of the best practices we try to follow.

When pushing commits to this repo, please follow the following guidelines:

- Install commitizen globally (npm i -g commitizen).
- When ready to commit, git cz & follow the prompts.
- Please use either server or frontend as the scope of your commit.

Security

For any security vulnerabilities or concerns, please contact us directly at security[at]speckle.systems.

License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via email.
