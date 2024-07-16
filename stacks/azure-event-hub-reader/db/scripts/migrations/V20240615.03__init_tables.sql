-- Function for use in triggering refresh of 'updated_at'
create or replace function ctl.update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = current_timestamp;
   return new;
end;
$$ language 'plpgsql';

drop table if exists ctl.event_hub_partition_ownership;
create table ctl.event_hub_partition_ownership (
    fully_qualified_namespace varchar(84) not null,
    event_hub_name varchar(50) not null,
    consumer_group varchar(50) not null,
    partition_id varchar(8) not null,
    owner_id varchar(36),
    updated_at timestamp default current_timestamp,
    e_tag uuid,
    last_modified_time_in_ms bigint,
    primary key (fully_qualified_namespace, event_hub_name, consumer_group, partition_id)
);

create trigger event_hub_partition_ownership_updated_at_tr
before update on ctl.event_hub_partition_ownership
for each row
execute procedure ctl.update_updated_at_column();

drop table if exists ctl.event_hub_checkpoint;
create table ctl.event_hub_checkpoint (
    fully_qualified_namespace varchar(84) not null,
    event_hub_name varchar(50) not null,
    consumer_group varchar(50) not null,
    partition_id varchar(8) not null,
    sequence_number bigint,
    "offset" varchar(255),
    updated_at timestamp default current_timestamp,
    e_tag uuid,
    primary key (fully_qualified_namespace, event_hub_name, consumer_group, partition_id),
    foreign key (fully_qualified_namespace, event_hub_name, consumer_group, partition_id)
        references ctl.event_hub_partition_ownership (fully_qualified_namespace, event_hub_name, consumer_group, partition_id)
);

create trigger event_hub_checkpoint_updated_at_tr
before update on ctl.event_hub_checkpoint
for each row
execute procedure ctl.update_updated_at_column();

