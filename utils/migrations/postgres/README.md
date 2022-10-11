# Migrations - Postgres

## docker-compose

### Using the provided scripts

1. Please ensure you are in a bash terminal (linux, including ubuntu for windows, \*nix, or mac), have docker and docker-compose installed.

1. Backup. This backup, when loaded, will clear any existing data.

   ```shell
   ./utils/migrations/postgres/backup.sh --output-path=./speckle-postgres-dump.sql
   ```

1. Please verify the contents of `./speckle-postgres-dump.sql`. You may wish to start a separate database (or entire speckle cluster) and load the contents into it, verifying they are complete and accurate.
1. Stop postgres and delete the postgres volume. ⚠️ **This is destructive and will result in downtime for your server**.

   ```shell
   docker-compose --file ./docker-compose-deps.yml down --timeout 30 --volumes
   ```

1. Update the docker-compose file, if necessary, and start a new postgres database using docker-compose:

   ```shell
   docker-compose --file ./docker-compose-deps.yml up --detach
   ```

1. Now load the database, this will wipe any existing data and create the data exactly as before.

   ```shell
   ./utils/migrations/postgres/restore.sh --backup-file=./speckle-postgres-dump.sql
   ```

### Using pgadmin

1. With docker-compose running, including the dependencies described in [`./docker-compose-deps.yml`](../../../docker-compose-deps.yml)
1. Open the [postgres admin dashboard](http://127.0.0.1:16543/).
1. The user name and password can be found in [`./docker-compose-deps.yml`](../../../docker-compose-deps.yml), next to `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD`.
   - At the time of writing the email is `admin@localhost.com` and the password `admin`.
1. Click `add new server`
1. In the dialog box in the `General` tab, enter the name `docker-compose` (or any other value that you wish).
1. In the dialog box in the `Connection` tab:
   - for the `Host name/addresses` enter `speckle-server-postgres-1` (you can check the container name by running `docker ps -a` in the command line, or viewing the container in the Docker dashboard.)
   - for `port`, use `5432` (you can check this is port number used for the `postgres` container in [`./docker-compose-deps.yml`](../../../docker-compose-deps.yml))
   - for `database`, `username`, and `password` use the values in the file assigned to the respective `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` keys. By default the value of these are all `speckle`.
1. Click `save`
1. You can now select the database from the browser window (typically found on the left hand side).
1. Expand `docker-compose` and `databases`, the right-click on the database you wish to backup.
1. Choose a filename
1. Stop the docker-compose dependencies with:

   ```shell
   docker-compose -f ./docker-compose-deps.yml down --volumes
   ```

1. Deploy the docker-compose file with the updated postgres version:

   ```shell
   docker-compose -f ./docker-compose-deps.yml up --detach
   ```

1. Open pgadmin and connect to the server, using the instructions above.
1. Right click `databases` from the browser window, and click `create`
1. Right click the created database and click `restore`, selecting your previously stored backup.
