-- Creates both databases on first run.
-- PostgreSQL creates the default database from POSTGRES_DB automatically;
-- this script creates the second one for Keycloak.
SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec

SELECT 'CREATE DATABASE pixera'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pixera')\gexec
