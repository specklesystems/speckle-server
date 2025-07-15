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
