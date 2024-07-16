# aws-serverless-template

Parameterized, granular stacks - based on the [serverless framework](https://serverless.com) - for doing various things [with Lambda], along with some opinions/tooling with respect to configuration patterns and local development.

# Structure

- `/stacks`: sls / CF / application code for discrete stacks.
- `/libs`: common modules available for import by stack application code.
- `/default-config`: sensible default config ***used across stacks***, overrideable within each stack.

Within each stack dir (each stack may not have every sub-dir):
- `README.md`
- `serverless.yml`
- `.env`: stack-specific configuration for local development (file must remain this name).
- `./dev-utils`: scratch assets to assist with local development; never deployed.
- `./db`: any database-related dependencies for the stack (tooling: Flyway).
- `./functions`: Lambda sls config and application code (handlers).
- `./resources`: configuration (CloudFormation) for stack resources.

# Contributing

1. Clone this repo
2. Create feature branch from 'main' with naming convention `'<your nick>-<brief description>'` (e.g., 'ormu5-some-improvements)
3. Do dev work (see below section about development environment)
4. Open PR, name it after your feature branch

# Development Environment (Local)

Local development is supported here by Docker, Flyway, and Local Data API. Local Data API is relevant to v1 of Aurora Serverless but not v2.

# Dependencies

- Serverless v3
- Python 3.11 (recommend virtualenv / pipenv)
- Node v18

## Database

Note: Docker must be installed for the local database setup to work.

#### To start the database:
```commandline
cd dev-utils
docker-compose up
# use the below command to run the docker setup in the detached mode
docker-compose up -d   
```

Flyway first runs versioned (V*) migrations located at ./db/scripts/migrations but does not load data.

The database will be available at localhost:3306 While the database can be accessed with the usual database client, the application actually interacts with it using the Local Data API container that acts as a web proxy. It accepts web service requests from the Lambdas via the SDK (just as AWS Data API will) and translates them to JDBC requests to the database. In this way, local development can be performed as if against AWS Data API.

#### To load data:
We will leverage the Flyway's repeatable migrations mechanism to load sample data from CSV files in the **local environment**. 
Note: This method truncates and reloads the data from the CSV files.
* Add *csv* files to the `/dev-utils/sample-data/` folder.
* Ensure `R__00_load_data.sql` script located in the `scripts/local-migrations/` folder is updated for desired tables.

### Node/Typescript Backend

Stacks are run locally using serverless-offline. To start a stack locally:

```
cd stacks/<stack-dir> 
npx sls offline start
```

Organized by stacks, work is generally conducted within the scope of a single stack.

```
cd <ts common dir>
npm link  # Make available globally as 'ts-common' (defined in package.json)
cd <stack folder>
npm link ts-common  # Link to current project/stack
npm ls -g  # Observe existing links
npm install
```

Imports such as `import { logger } from "opfyx-common/v1/utilities";` will now work locally.


Config management:
- Deploy-time parameters can be found in `serverless.yml:params`, as either hard-coded values or sls variables.
- Run-time parameters (no sensitive values) can be found in `serverless.yml:provider.environment`.

Stack installation:
- npm install
- rename sub-dir and service name to suit preferences
- flyway.schemas for any schemas (are these used when deployed?)

as usual: override sls fields via command line

truncation of names

- rename service directory
- rename the service (common instructions)
- rename service accordingly (keep succinct)
- adjust sls 'params'