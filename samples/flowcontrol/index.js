'use strict';

const config = {
  bricks: [{
    name: 'dblayer-mongodb',
    module: 'cta-dblayer',
    properties: {
      provider: 'mongodb',
      configuration: {
        databaseName: 'db-layer-tests',
        servers: [{
          host: 'localhost',
          port: 27017,
        }],
        options: {},
      },
    },
    publish: [],
    subscribe: [{
      topic: 'dblayer',
      data: [{
        nature: {
          type: 'database',
          quality: 'query',
        },
      }],
    }],
  }, {
    name: 'query',
    module: '../../cta-dblayer/samples/flowcontrol/bricks/query.js',
    publish: [{
      topic: 'dblayer',
      data: [{
        nature: {
          type: 'database',
          quality: 'query',
        },
      }],
    }],
    subscribe: [],
  }],
};

const FlowControl = require('cta-flowcontrol');
const Cement = FlowControl.Cement;
const cement = new Cement(config);
