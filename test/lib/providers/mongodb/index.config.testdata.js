'use strict';

const config = {
  databasename: 'etap',
  servers: [
    {
      host: 'dtci-ctawbmd-01.emea1.cis.trcloud',
      port: 27017,
    },
    {
      host: 'dtci-ctawbmd-02.emea1.cis.trcloud',
      port: 27017,
    },
    {
      host: 'dtci-ctawbmd-03.emea1.cis.trcloud',
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
    replSet: {
      'replicaSet': 'etap',
      'poolSize': 100,
    },
  },
};

module.exports = config;
