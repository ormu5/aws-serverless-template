-- Supports init of Docker container. There should be no need to run anything in this
-- script for AWS deployments (see `init_aws_database.sh`). Hard-coded values in here
-- should line up with `docker-compose.yml`.

create database local_db
    with
    owner = postgres
    encoding = 'UTF8'
    lc_collate = 'en_US.utf8'
    lc_ctype = 'en_US.utf8'
    connection limit = -1;

-- Configure local role for both flyway migrations and db interactions (see `docker-compose.yml`).
create role admin with login;
grant connect on database local_db to admin;
grant all privileges on database local_db to admin;
alter role admin createrole;
alter role admin with password 'admin';   -- hard-coded password for local use

-- Accommodate locally any objects expected by migrations
create role aehreaderdbruntime with login;


