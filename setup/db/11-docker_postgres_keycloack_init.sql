CREATE USER keycloak WITH
    LOGIN
    NOSUPERUSER
    INHERIT
    PASSWORD 'keycloak';

CREATE DATABASE keycloak
    WITH 
    OWNER = keycloak
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;