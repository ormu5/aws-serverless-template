# aws-serverless-template

Parameterized, granular stacks - based on the [Serverless Framework](https://serverless.com) - for doing various things on AWS
[with Lambda], along with some opinions/tooling with respect to configuration patterns and local development.

In the process of fleshing out this documentation....

# Principles

- **Discrete services**. Stacks are set up to maximize modularity, minimize/eliminate hard dependencies on one another,
  where they can be worked and updated independently while employing semantic versioning methodology.
- **Opinionated Naming**. By default, there is an 'app' prefix to every resource, propagated as an inclusion to each
  service's name. Most resource names also include a resource type (e.g., 'lambda') and version. I version 
  just about everything. Naming conventions underpin some of the loose coupling enabling automation. I use
  kebab-case in part so that I can discern resources-I-create from resourcesAWSCreates. Convention generally goes
  `<app>-<service>-<desc>-<resource-type>-<version>-<stage>`. '<desc>' may be abbreviated as needed to meet resource
  name character limits.
- **Local development**. Via Docker and `sls offline`, I still find a functional _local_ development environment convenient.

# Folder Structure

- `/stacks`: sls / CF / application code for discrete stacks.
- `/lib`: common modules (Python and TS) available for import by stack application code.
- `/default-config`: sensible default config ***used across stacks***, overrideable within each stack.

Within each stack dir (each stack may not have every sub-dir):

- `./README.md`
- `./serverless.yml`
- `.env`: stack-specific configuration for local development (file must remain this name).
- `./dev-utils`: scratch assets to assist with local development; never deployed.
- `./db`: any database-related dependencies for the stack (tooling: Flyway).
- `./functions`: Lambda sls config and application code (handlers).
- `./resources`: configuration (CloudFormation) for stack resources.

# Stack Use

This section applies to all stacks. Functional stacks depend on 'infra' stack having been already
deployed (see [Infrastructure](https://github.com/ormu5/aws-serverless-template?tab=readme-ov-file#infrastructure)
if you plan on bypassng use of 'infra' stack).

See stack-specific README for additional context for the given stack.

## Local

Local development is supported here by Docker, Flyway, and Local Data API.

1. Add missing values to `.env`
2. In `dev-utils`: `docker-compose up`
3. Authenticate with _some_ AWS account
4. \[Python: Setup/activate virtual environment, then `pip install -r requirements.txt`]
5. In base stack dir:
    - `npm install`
    - `npx sls offline`

## Deployment

1. Update service name, if desired (succinct)
2. Update service folder name, if desired
3. `npx sls deploy --stage <stage> --app <app_name>`

'app' CLI param is incorporated into service name as a prefix.

# Infrastructure

The 'infra' stack contains configuration for managed services (VPC, database, etc.) leveraged
by each of the other functional stacks. See [Configuration Management](https://github.com/ormu5/aws-serverless-template?tab=readme-ov-file#configuration-management) for details, but if you wish
to bring your own 'infra' (i.e., leverage it in situ), either:

- Familiarize, adopt or tweak `./default-config` paradigm to suit your needs.
- Abandon the paradigm entirely by, per stack, replacing with your own approach any instances of:
  - 'infraService'
  - '${self:custom.defaults*'
  - SSM placeholders in `.env` to support local development
  - adjust construction of values of any SSM::Parameter resources created by the stack to reflect your paradigm

# Configuration Management

Stacks are envisioned as independent and modular. The only hard dependencies between stacks are between each
functional stack and the 'infra' stack (or other infrastructure accommodations).

## SSM Parameter Store

Sits at the heart of configuration given robust support by Serverless Framework, enabling parameters that are:

- Manual: entered manually by a user prior to stack deployment, leveraged by that stack during deployment/run.
- Automated: populated by stack during deployment, where a stack's config can be found at
  `/<service-name>/<stage>/<param-name>`.

Opinionated naming conventions (e.g., SSM) serve to loosely associate configuration between stacks.

## Secrets Manager

For sensitive values that require more nuanced management.

## Default Config

This was intended to strike the balance between efficiency across stacks with stack independence. Think of
`/default-config/*` as just that: \[hopefully-sensible] defaults to get out of the gate, easily overrideable within
each stack. They are meant to flex within the opinionated naming and organizational conventions in this repo; stray
from those conventions and pieces of default config still apply but will need to be adjusted (or thrown out).

## Stack Exports

Not used.

## AppConfig

Not yet used. Keen to see where Serverless Framework goes with it.

## .env

Found in each stack folder, used to support local development via Serverless Framework (`sls offline`). It does,
however, generally represent a snapshot of all deployment and runtime config dependencies for a given stack
since `sls offline` will fail if a value is not found.

# Python vs TypeScript

Both can be found in this repo and can run side-by-side. Expect more maturation of Python libs.

# Contributing

1. Clone this repo
2. Create feature branch from 'main' with naming convention `'<your nick>-<brief description>'` (e.g., 'ormu5-some-improvements)
3. Do dev work (see below section about development environment)
4. Open PR, name it after your feature branch
