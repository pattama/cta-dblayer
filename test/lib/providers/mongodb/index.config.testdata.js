'use strict';

const config = {
  databaseName: 'etap',
  servers: [
    {
      host: 'localhost',
      port: 27017,
    },
  ],
  // collectionOptions: {
  //   strict: true,
  // },
  options: {
    db: {
      'w': 'majority',
      'readPreference': 'primaryPreferred',
    },
    // replSet: {
    //   'replicaSet': 'etap',
    //   'poolSize': 100,
    // },
  },
};

module.exports = config;
