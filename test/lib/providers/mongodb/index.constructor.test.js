'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
require('sinon-as-promised');
const _ = require('lodash');

const MongoDbLayer = require('../../../../lib/providers/mongodb');
const logger = require('cta-logger');
const DEFAULTCONFIG = {
  databasename: 'cta',
  servers: [
    {
      host: 'localhost',
      port: 27017,
    },
    {
      host: 'localhost',
      port: 27018,
    },
  ],
  options: {
    db: {
      'w': 'majority',
      'readPreference': 'primaryPreferred',
    },
    replSet: {
      'replicaSet': 'cta',
      'poolSize': 100,
    },
  },
};
const DEFAULTCEMENTHELPER = {
  constructor: {
    name: 'CementHelper',
  },
};
const DEFAULTLOGGER = logger();

describe('MongoDbLayer - constructor', function() {
  context('when everything ok', function() {
    let mongoDbLayer;
    let url;
    before(function() {
      url = 'mongodb://';
      url += DEFAULTCONFIG.servers.map((elem) => `${elem.host}:${elem.port}`).join(',');
      url += `/${DEFAULTCONFIG.databasename}`;
      mongoDbLayer = new MongoDbLayer(DEFAULTCONFIG, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
    });

    it('should return new MongoDbLayer object', function(done) {
      expect(mongoDbLayer).to.have.property('configuration');
      Object.keys(DEFAULTCONFIG).forEach(function(key) {
        expect(mongoDbLayer.configuration).to.have.property(key, DEFAULTCONFIG[key]);
      });
      expect(mongoDbLayer.configuration).to.have.property('url', url);
      expect(mongoDbLayer).to.have.property('cementHelper', DEFAULTCEMENTHELPER);
      expect(mongoDbLayer).to.have.property('logger', DEFAULTLOGGER);
      done();
    });
  });

  context(`when missing/incorrect 'configuration' object property`, function() {
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(null, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
      }).to.throw(Error, `missing/incorrect 'configuration' object property`);
    });
  });

  context(`when incorrect 'url' string property in configuration`, function() {
    const configuration = _.cloneDeep(DEFAULTCONFIG);
    configuration.url = {};
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(configuration, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
      }).to.throw(Error, `incorrect 'url' string property in configuration`);
    });
  });

  context(`when missing/incorrect 'databasename' string property in configuration`, function() {
    const configuration = _.cloneDeep(DEFAULTCONFIG);
    configuration.databasename = {};
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(configuration, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
      }).to.throw(Error, `missing/incorrect 'databasename' string property in configuration`);
    });
  });

  context(`when missing/incorrect 'servers' array property in configuration`, function() {
    const configuration = _.cloneDeep(DEFAULTCONFIG);
    configuration.servers = {};
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(configuration, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
      }).to.throw(Error, `missing/incorrect 'servers' array property in configuration`);
    });
  });

  context(`when missing/incorrect 'host' string property in element of configuration.servers`, function() {
    const configuration = _.cloneDeep(DEFAULTCONFIG);
    configuration.servers[0].host = {};
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(configuration, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
      }).to.throw(Error, `missing/incorrect 'host' string property in configuration.servers[0]`);
    });
  });

  context(`when missing/incorrect 'port' number property in element of configuration.servers`, function() {
    const configuration = _.cloneDeep(DEFAULTCONFIG);
    configuration.servers[1].port = {};
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(configuration, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
      }).to.throw(Error, `missing/incorrect 'port' number property in configuration.servers[1]`);
    });
  });

  context(`when incorrect 'options' object property in configuration`, function() {
    const configuration = _.cloneDeep(DEFAULTCONFIG);
    configuration.options = null;
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(configuration, DEFAULTCEMENTHELPER, DEFAULTLOGGER);
      }).to.throw(Error, `incorrect 'options' object property in configuration`);
    });
  });

  context(`when missing/incorrect 'cementHelper' CementHelper argument`, function() {
    it('should throw an error', function() {
      return expect(function() {
        return new MongoDbLayer(DEFAULTCONFIG, {}, DEFAULTLOGGER);
      }).to.throw(Error, `missing/incorrect 'cementHelper' CementHelper argument`);
    });
  });
});
