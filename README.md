# aws-es-credentials
## Elasticsearch credentials manager for AWS

A wrapper around the elasticsearch JS client that keeps the AWS session token updated automatically.
The client defaults to using the metadata service, but can also use a provided credentials object or environment variables.
Using the credentials or environment variables is handy for local development, where as your instance will have the metadata service to use.

Useage
```
// The client returns a promise as an async request is made to get the session token values

// Automatically use metadata service
(async () => {
    const options = {
        hosts: 'localhost:9200'
    };

    const client = await awsEsCredentials(options);
    client.seach(// search json goes here);
});

// Turn metadata service off, will attempt to use environment variables
(async () => {
    const options = {
        hosts: 'localhost:9200',
        useMetadataService: false
    };

    const client = await awsEsCredentials(options);
    client.seach(// search json goes here);
});

// Pass credentials manually
(async () => {
    const options = {
        hosts: 'localhost:9200',
        useMetadataService: false,
        credentials: new AWS.Credentials('x', 'xx', 'xxx')
    };

    const client = await awsEsCredentials(options);
    client.seach(// search json goes here);
});
```