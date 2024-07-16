- not HA by default: see serverless.yml:resources.Conditions to adjust

install ${ssm:/${self:service}/${sls:stage}/database-master-username}

sls deploy --stage prod --app thot-services --param="databaseName=thotservices"

app stack: npx sls deploy --stage prod --app thot-services

database-name in ssm