# Migrations - Postgres

## docker-compose

Backing up and restoring postgres data stored in our local development docker volumes when upgrading to new postgres versions.

### Using pgadmin

1. _If postgres is already running, you can skip this step._ To get it running, please first checkout this repository at the commit or tag used to previously deploy Speckle on docker-compose. For example, using `git` on the command line to checkout tag `2.8.0`:

   ```shell
   git fetch --all --tags
   git checkout tags/2.8.0 -b main
   ```

1. _If postgres is already running, you can skip this step._ Start the dependencies, which include postgres and pgadmin:

   ```shell
   docker-compose --file ./docker-compose-deps.yml up --detach
   ```

1. Verify that they are running:

   ```shell
   docker ps
   ```

1. Open the [postgres admin (pgadmin) dashboard](http://127.0.0.1:16543/). If you have changed the configuration of pgadmin, you can find it by running `docker ps` and making a note of the address and port it is serving.
1. The user name and password can be found in [`./docker-compose-deps.yml`](../../../docker-compose-deps.yml), next to `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD`.
   - At the time of writing the email is `admin@localhost.com` and the password `admin`.
1. Click `add new server`
1. In the dialog box in the `General` tab, enter the name `docker-compose` (or any other value that you wish).
1. In the dialog box in the `Connection` tab:
   - for the `Host name/addresses` enter `postgres` (its the name of the postgres container in the docker-compose config)
   - for `port`, use `5432` (you can check this is port number used for the `postgres` container in [`./docker-compose-deps.yml`](../../../docker-compose-deps.yml))
   - for `database`, `username`, and `password` use the values in the file assigned to the respective `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` keys. By default the value of these are all `speckle`.
1. Click `save`
1. You can now select the database from the browser window (typically found on the left hand side). Expand `docker-compose` and `databases`, the right-click on the database you wish to backup.
1. Choose a filename and start the backup process.
1. Once the backup is done, make sure you click on the "Click to open file location" button and download the backup to your host machine.
1. We recommend testing the integrity of the backup at this time. One means of doing this is to install speckle-server on another machine (or modify the name and ports in the file and install a second locally), then upload the backup per the below instructions using pgadmin. Use pgadmin or Speckle to check that the information is present.
1. Stop the docker-compose dependencies with:

   ```shell
   docker-compose -f ./docker-compose-deps.yml down
   ```

1. Find the name of the postgres database volume.

   ```shell
   docker volume ls
   ```

1. ⚠️ Delete the postgres database. This is destructive, please ensure that the backup is correct and saved securely before proceeding, see instructions above. ⚠️

   ```shell
   docker volume rm speckle-server_postgres-data
   ```

1. Check out the version of Speckle Server you wish to deploy. For example, using `git` on the command line to checkout the latest commit or a tagged version:

   ```shell
   git checkout main
   ```

   ```shell
   git checkout tags/2.9.0 -b main
   ```

1. Deploy the docker-compose file with the updated postgres version:

   ```shell
   docker-compose -f ./docker-compose-deps.yml up --detach
   ```

1. Open pgadmin and connect to the server, using the instructions above.
1. Right click `databases` from the browser window, and click `create`.
1. Right click the created database and click `restore`, selecting your previously stored backup. You will need to upload the backup you previously downloaded back into pgadmin first.
1. Deploy Speckle server, if necessary, and verify the data is correct.
