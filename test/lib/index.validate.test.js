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
const Brick = require('cta-brick');
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
const DEFAULTCEMENTHELPER = {
  constructor: {
    name: 'CementHelper',
  },
  brickName: 'dblayer',
  logger: DEFAULTLOGGER,
};
const dbqueryjob = {
  nature: {
    type: 'database',
    quality: 'query',
  },
  payload: {
    collection: 'foobar',
    action: 'find',
    args: [],
  },
};

describe('DbLayer - validate', function() {
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
    dbLayer = new DbLayer(DEFAULTCEMENTHELPER, config);
  });

  after(function() {
  });

  context('when everything ok', function() {
    let validatePromise;
    const job = _.cloneDeep(dbqueryjob);
    const context = { data: job};
    before(function(done) {
      sinon.stub(Brick.prototype, 'validate').resolves();
      sinon.stub(dbLayer.instance, 'validate').resolves();
      dbLayer.validate(context).then(function(res) {
        validatePromise = res;
        done();
      }).catch(done);
    });
    after(function() {
      Brick.prototype.validate.restore();
      dbLayer.instance.validate.restore();
    });

    it('should call super validate()', function() {
      return expect(Brick.prototype.validate.calledOnce).to.be.true;
    });

    it('should call provider validate()', function() {
      return expect(dbLayer.instance.validate.calledOnce).to.be.true;
    });

    it('should resolve', function() {
      return expect(validatePromise).to.have.property('ok', 1);
    });
  });

  context('when super validate rejects', function() {
    const mockError = new Error('mock error');
    const job = _.cloneDeep(dbqueryjob);
    const context = { data: job};
    before(function() {
      sinon.stub(Brick.prototype, 'validate').rejects(mockError);
      sinon.stub(dbLayer.instance, 'validate').resolves();
    });

    after(function() {
      Brick.prototype.validate.restore();
      dbLayer.instance.validate.restore();
    });

    it('should reject', function() {
      const validatePromise = dbLayer.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(mockError);
    });
  });

  context('when job type is not supported', function() {
    const job = _.cloneDeep(dbqueryjob);
    job.nature.type = 'not-database';
    const context = { data: job };
    before(function() {
      sinon.stub(Brick.prototype, 'validate').resolves();
      sinon.stub(dbLayer.instance, 'validate').resolves();
    });
    after(function() {
      Brick.prototype.validate.restore();
      dbLayer.instance.validate.restore();
    });

    it('should reject', function() {
      const validatePromise = dbLayer.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'type ' + job.nature.type + ' not supported');
    });
  });

  context('when job quality is not supported', function() {
    const job = _.cloneDeep(dbqueryjob);
    job.nature.quality = 'not-query';
    const context = { data: job };
    before(function() {
      sinon.stub(Brick.prototype, 'validate').resolves();
      sinon.stub(dbLayer.instance, 'validate').resolves();
    });
    after(function() {
      Brick.prototype.validate.restore();
      dbLayer.instance.validate.restore();
    });

    it('should reject', function() {
      const validatePromise = dbLayer.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'quality ' + job.nature.quality + ' not supported');
    });
  });

  context('when provider validate rejects', function() {
    const mockError = new Error('mock error');
    const job = _.cloneDeep(dbqueryjob);
    const context = { data: job};
    before(function() {
      sinon.stub(Brick.prototype, 'validate').resolves();
      sinon.stub(dbLayer.instance, 'validate').rejects(mockError);
    });

    after(function() {
      Brick.prototype.validate.restore();
      dbLayer.instance.validate.restore();
    });

    it('should reject', function() {
      const validatePromise = dbLayer.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(mockError);
    });
  });
});
