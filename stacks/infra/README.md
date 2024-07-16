# Overview

Contains base managed resources (infrastructure) to support functional stacks. Database cluster is by default
managed centrally by this stack, where each stack then configures its own database within. Consideration might
be given to a `database.yml` per stack to separate concerns into separate clusters or provisioned instances.

# Quick Start

1. Manually add SSM Params
   - `/<service>/<stage>/database-master-username`
   - `/<service>/<stage>/database-name`
2. `npm install`
3. Check/adjust HA settings at `serverless.yml:resources.Conditions`
4. `sls deploy --stage <stage> --app <app>`

# Additional Configuration

# Non Functional

HA in the context of this stack means two availability zones as opposed to one. As configured (single AZ) this
stack costs approximately $35/mo. (TODO: confirm) before data transfer charges are applied.
