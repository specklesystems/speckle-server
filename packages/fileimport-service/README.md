# File Import Service

## Description of how this works

A micro-service which polls a Postgres database table `file_uploads` for new records and processes them.

It retrieves a referenced file from an S3 bucket and stores it in a local directory for parsing.

The File Import service can parse either STL, OBJ, or IFC files using external packages, written in either .Net or Python (_note_, there is a legacy IFC parser written in Node.js). These external packages are controlled via shell commands.

The parsers are responsible for extracting the necessary data from the files and storing it in the database. They are also responsible for creating a new Speckle model if necessary.

The service is then responsible for updating the status of the `file_uploads` table, and for posting a Postgres notification.
