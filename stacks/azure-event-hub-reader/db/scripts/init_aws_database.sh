#!/bin/bash
# Helper script to setup a service's database, relies heavily on the paradigm set
# forth by stacks in this repo. It should be executed by a person or process with administrative access
# (including access to master database secret). This script:
#
# - Sets up Postgres deployment role in the database, based on values in Secrets Manager (dependency)
# - Sets up Postgres runtime role in the database, based on values in Secrets Manager (dependency)
# - Creates new database in the cluster for use by the given service. `service-name` should match serverless
#   service name.
#
# Due to dependencies above, the service's stack should have already been deployed such that appropriate
# secrets are stored in Secrets Manager. With these run-once tasks accomplished the establishment of
# schema and tables to support the service can be turned over to flyway migration scripts, etc.,
# executed by the Postgres deployment role for the service.
#
# Params:
#   - service-name: should match sls service name
#   - resource-arn: ARN of the target db cluster
#   - master-secret-arn: ARN of master secret associated with db cluster
#   - stage: prod | staging | dev | etc.
#

usage() {
    echo "Usage: $0 --service-name <service_name> --resource-arn <db_resource_arn> --master-secret-arn <db_master_secret_arn> --stage <stage>"
    exit 1
}

service_name=""
db_resource_arn=""
db_master_secret_arn=""
stage=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --service-name)
            service_name="$2"
            shift 2
            ;;
        --resource-arn)
            db_resource_arn="$2"
            shift 2
            ;;
        --master-secret-arn)
            db_master_secret_arn="$2"
            shift 2
            ;;
        --stage)
            stage="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [ -z "${service_name}" ] || [ -z "${db_resource_arn}" ] || [ -z "${db_master_secret_arn}" ] || [ -z "${stage}" ]; then
    usage
fi

db_name=${service_name//-/_}  # Assume database name should match service name
echo "Setting up database $db_name for service $service_name."

# Build ARNs for deployment and runtime secrets based on expected SSM naming convention
db_deployment_param_name="/$service_name/$stage/database-deployment-secret-arn"
db_runtime_param_name="/$service_name/$stage/database-runtime-secret-arn"
db_name_param_name="/$service_name/$stage/database-name"
db_deployment_secret_arn=$(aws ssm get-parameter --name "$db_deployment_param_name" --with-decryption --query "Parameter.Value" --output text)
db_runtime_secret_arn=$(aws ssm get-parameter --name "$db_runtime_param_name" --with-decryption --query "Parameter.Value" --output text)
db_name=$(aws ssm get-parameter --name "$db_name_param_name" --with-decryption --query "Parameter.Value" --output text)

# Fetch needed values from Secrets Manager / session context
master_secret_value=$(aws secretsmanager get-secret-value --secret-id $db_master_secret_arn --query 'SecretString' --output text)
deployment_secret_value=$(aws secretsmanager get-secret-value --secret-id $db_deployment_secret_arn --query 'SecretString' --output text)
runtime_secret_value=$(aws secretsmanager get-secret-value --secret-id $db_runtime_secret_arn --query 'SecretString' --output text)
region=$(aws configure get region)
account_id=$(aws sts get-caller-identity --query "Account" --output text)

# Parse into discrete values
master_username=$(echo $master_secret_value | jq -r '.username')
master_password=$(echo $master_secret_value | jq -r '.password')
deployment_username=$(echo $deployment_secret_value | jq -r '.username')
deployment_password=$(echo $deployment_secret_value | jq -r '.password')
runtime_username=$(echo $runtime_secret_value | jq -r '.username')
runtime_password=$(echo $runtime_secret_value | jq -r '.password')

# Need initial/base database configured at the time of cluster creation
initial_database=$(aws rds describe-db-clusters \
    --db-cluster-identifier $db_resource_arn \
    --query 'DBClusters[0].DatabaseName' \
    --output text)
echo "Initial database for the cluster fetched as '$initial_database'."

echo "Secrets fetched. Setting up deployment user/role $deployment_username in database based on configuration in SSM."

aws rds-data execute-statement \
    --resource-arn $db_resource_arn \
    --secret-arn $db_master_secret_arn \
    --database $initial_database \
    --sql "create role $deployment_username with login;"

aws rds-data execute-statement \
    --resource-arn $db_resource_arn \
    --secret-arn $db_master_secret_arn \
    --database $initial_database \
    --sql "create database $db_name;"

aws rds-data execute-statement \
    --resource-arn $db_resource_arn \
    --secret-arn $db_master_secret_arn \
    --database $initial_database \
    --sql "alter role $deployment_username with password '$deployment_password';"

aws rds-data execute-statement \
    --resource-arn $db_resource_arn \
    --secret-arn $db_master_secret_arn \
    --database $initial_database \
    --sql "alter database $db_name owner to $deployment_username;"

echo "Setting up runtime user/role $runtime_username in database $db_name based on configuration in SSM."

aws rds-data execute-statement \
    --resource-arn $db_resource_arn \
    --secret-arn $db_master_secret_arn \
    --database $initial_database \
    --sql "create role $runtime_username with login;"

aws rds-data execute-statement \
    --resource-arn $db_resource_arn \
    --secret-arn $db_master_secret_arn \
    --database $initial_database \
    --sql "alter role $runtime_username with password '$runtime_password';"

aws rds-data execute-statement \
    --resource-arn $db_resource_arn \
    --secret-arn $db_master_secret_arn \
    --database $db_name \
    --sql "grant connect on database $db_name to $runtime_username;"
