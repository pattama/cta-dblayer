# cta-dblayer

**Database Layer**  for Compass Test Automation, implementing CTA-OSS Framework

===

# Table of Contents
1. [Initialization](#initialization)
2. [Usage](#usage)

# Initialization
This chapter describes the configuration for a DBLayer brick.
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
            'url': 'mongodb://localhost:27017/cta',
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
### Connect to a single server using options hash
```js
const config = {
  'bricks': [
    {
      'name': 'mongodblayer',
        'module': 'cta-dblayer',
        'properties': {
          'provider': 'mongodb',
          'configuration': {
            'databaseName': 'cta',
            'servers': [
              {
                'host': 'localhost',
                'port': 27017,
              },
            ],
            'options': {},
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
Also pass custom `collectionOptions` as `options` argument to the db.collection() method
```js
const config = {
  'bricks': [
    {
      'name': 'mongodblayer',
        'module': 'cta-dblayer',
        'properties': {
          'provider': 'mongodb',
          'configuration': {
            'databaseName': 'cta',
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
            'collectionOptions': {
              'strict': false,
            }
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
Find 10 documents in the collection **user** where *name* is "John"
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
    ],
  },
};
```
#### [aggregate()](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#aggregate)
Group all **user** *name* by *country* and project the resulting docs as **result**.

**user**: `{ name:String, country:String }`

**result**: `{ country:String, users:Array<user.name> }`

```js
const job = {
  nature: {
    type: 'database',
    quality: 'query',
  },
  payload: {
    collection: 'user',
    action: 'aggregate',
    args: [
      [
        {
          $group: {
            _id: '$country',
            users: {
              $addToSet: '$name',
            },
          },
        },
        {
          $project: {
            country: '$_id',
            users: 1,
            _id: 0,
          },
        },
      ],
    ],
  },
};
```
