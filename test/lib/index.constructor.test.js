'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const mockrequire = require('mock-require');
const _ = require('lodash');

const DbLayer = require('../../lib/index');
const logger = require('cta-logger');

const DEFAULTS = {
  'name': 'dblayer',
  'module': '../../lib/index',
  'properties': {
    'provider': 'foobar',
    'configuration': {},
  },
  'publish': [
  ],
  'subscribe': [
  ],
};
const DEFAULTLOGGER = logger();

describe('DbLayer - constructor', function() {
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    brickName: 'dblayer',
    logger: DEFAULTLOGGER,
  };

  context(`when missing/incorrect 'provider' string property in config.properties`, function() {
    const config = _.cloneDeep(DEFAULTS);
    delete config.properties.provider;
    it('should throw an error', function() {
      return expect(function() {
        return new DbLayer(mockCementHelper, config);
      }).to.throw(Error, `missing/incorrect 'provider' string property in config.properties`);
    });
  });

  context(`when missing/incorrect 'configuration' object property in config.properties`, function() {
    const config = _.cloneDeep(DEFAULTS);
    delete config.properties.configuration;
    it('should throw an error', function() {
      return expect(function() {
        return new DbLayer(mockCementHelper, config);
      }).to.throw(Error, `missing/incorrect 'configuration' object property in config.properties`);
    });
  });

  context(`when provider is not supported (e.g. nodejs require() fails)`, function() {
    const config = _.cloneDeep(DEFAULTS);
    config.properties.provider = 'some-not-supported-provider';

    before(function() {
      // todo: stub require()
    });

    it('should throw an error', function() {
      return expect(function() {
        return new DbLayer(mockCementHelper, config);
      }).to.throw(Error, `provider '${config.properties.provider}' is not supported`);
    });
  });

  context(`when provider instantiation fails`, function() {
    const config = _.cloneDeep(DEFAULTS);
    config.properties.provider = 'crashingprovider';

    const mockProviders = new Map();
    const mockProviderError = new Error('mock provider error at instantiation');
    before(function() {
      // create a mock provider that throws error on instantiation
      mockProviders.set('crashingprovider', {
        MockConstructor: function() {
          throw mockProviderError;
        },
      });
      sinon.spy(mockProviders.get('crashingprovider'), 'MockConstructor');
      mockrequire('../../lib/providers/crashingprovider', mockProviders.get('crashingprovider').MockConstructor);
    });

    after(function() {
      mockrequire.stopAll();
    });

    it('should throw a provider instantiation error', function() {
      return expect(function() {
        return new DbLayer(mockCementHelper, config);
      }).to.throw(Error, `loading provider '${config.properties.provider}' failed with: ${mockProviderError.message}`);
    });
  });

  context('when everything ok', function() {
    let dbLayer;
    const config = _.cloneDeep(DEFAULTS);
    config.properties.provider = 'providerone';
    config.properties.configuration = {
      ok: 1,
    };
    const mockProviders = new Map();
    before(function() {
      // create a mock provider
      mockProviders.set(config.properties.provider, {
        MockConstructor: function(cementHelper, opts) {
          return {
            'ok': opts.ok,
            'cementHelper': cementHelper,
            'logger': cementHelper.logger,
            'init': function() {},
            'validate': function() {},
            'process': function() {},
          };
        },
      });
      sinon.spy(mockProviders.get(config.properties.provider), 'MockConstructor');
      mockrequire('../../lib/providers/providerone', mockProviders.get(config.properties.provider).MockConstructor);
      dbLayer = new DbLayer(mockCementHelper, config);
    });

    after(function() {
      mockrequire.stopAll();
    });
    it('should return new dbLayer object', function(done) {
      expect(dbLayer).to.be.an.instanceof(DbLayer);
      expect(dbLayer).to.have.property('provider', config.properties.provider);
      expect(dbLayer).to.have.property('configuration', config.properties.configuration);
      expect(dbLayer).to.have.property('instance');
      expect(dbLayer.instance).to.have.property('ok', dbLayer.configuration.ok);
      expect(dbLayer.instance).to.have.property('cementHelper', dbLayer.cementHelper);
      expect(dbLayer.instance).to.have.property('logger', dbLayer.cementHelper.logger);
      expect(dbLayer.init).to.equal(dbLayer.instance.init);
      expect(dbLayer.validate).to.equal(dbLayer.instance.validate);
      expect(dbLayer.process).to.equal(dbLayer.instance.process);
      done();
    });
  });
});
