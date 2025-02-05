-- setup for replication
ALTER SYSTEM SET wal_level = logical;

CREATE DATABASE speckle2_test
    WITH
    OWNER = speckle
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
CREATE USER preview_service_test WITH PASSWORD 'preview_service_test';
CREATE DATABASE preview_service_test
    WITH
    OWNER = preview_service_test
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
GRANT CREATE ON TABLESPACE pg_default TO preview_service_test; -- required to create databases
ALTER USER preview_service_test CREATEDB; -- Allow user to create databases
GRANT pg_write_all_data TO preview_service_test;
