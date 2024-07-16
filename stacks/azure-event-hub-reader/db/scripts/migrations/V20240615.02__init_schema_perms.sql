-- Should be run as service's deployment role/user
create schema ctl;
grant usage on schema ctl to aehreaderdbruntime;
alter default privileges in schema ctl grant select, insert, update, delete on tables to aehreaderdbruntime;
alter default privileges in schema ctl grant execute on functions to aehreaderdbruntime;