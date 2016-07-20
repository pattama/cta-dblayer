Database layer for Compass Test Automation
===

## Examples of Brick Configuration
### MongoDb
#### Connect to a single server using url
```js
config = {
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
#### Connect to a ReplicaSet using options hash
```js
config = {
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
