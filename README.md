Database layer for Compass Test Automation
===
# Table of Contents
1. [Initialization](#initialization)
2. [Usage](#usage)

# Initialization
This chapter describes the configuration for a DbLayer brick.
## MongoDb
### Connect to a single server using url
```js
const config = {
  'bricks': [
    {
      'name': 'mongodblayer',
        'module': 'cta-dblayer',
        'properties': {
          'provider': 'mongodb',
          'configuration': {
            'databasename': 'cta',
            'url': 'mongodb://localhost:27017',
          }
        },
        'logger': {
          'properties': {
            'level': 'info',
          },
        },
        'publish': [],
        'subscribe':[],
    },
  ],
}
```
### Connect to a ReplicaSet using options hash
```js
const config = {
  'bricks': [
    {
      'name': 'mongodblayer',
        'module': 'cta-dblayer',
        'properties': {
          'provider': 'mongodb',
          'configuration': {
            'databasename': 'cta',
            'servers': [
              {
                'host': 'localhost',
                'port': 27017,
              },
              {
                'host': 'localhost',
                'port': 27018,
              },
              {
                'host': 'localhost',
                'port': 27019,
               },
            ],
            'options': {
              'db': {
                'w': 'majority',
                'readPreference': 'primaryPreferred',
              },
              'replSet': {
                'replicaSet': 'cta',
                'poolSize': 5,
              },
            },
          }
        },
        'logger': {
          'properties': {
            'level': 'info',
          },
        },
        'publish': [],
        'subscribe':[],
    },
  ],
}
```

# Usage
Making operations to a Database is done by the DbLayer by sending a Job with a specific payload to it.
## Examples of Job
### MongoDb
#### [find()](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#find)
Find 10 documents in the collection *user* where *name* is "John"
```js
const job = {
  nature: {
    type: 'database',
    quality: 'query',
  },
  payload: {
    collection: 'user',
    action: 'find',
    args: [
      { name: 'John' },
      { limit: 10 },
      {}
    ],
  },
};
```
#### [aggregate()](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#aggregate)

```js
const job = {
  
};
```
