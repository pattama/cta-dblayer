'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const requireSubvert = require('require-subvert')(__dirname);
const _ = require('lodash');

const mongodb = require('mongodb');
let MongoDbLayer = require('../../../../lib/providers/mongodb');
const logger = require('cta-logger');
const DEFAULTCONFIG = require('./index.config.testdata.js');
const DEFAULTLOGGER = logger();
const DEFAULTCEMENTHELPER = {
  constructor: {
    name: 'CementHelper',
  },
  brickName: 'mongodblayer',
  dependencies: {
    logger: DEFAULTLOGGER,
  },
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

describe('MongoDbLayer - validate', function() {
  let mongoDbLayer;
  let mockDbConnection;
  let stubMongoClientConnect;
  let url;
  url = 'mongodb://';
  url += DEFAULTCONFIG.servers.map((elem) => `${elem.host}:${elem.port}`).join(',');
  url += `/${DEFAULTCONFIG.databaseName}`;
  before(function(done) {
    // creates a mocked db connection using native driver (e.g. mongodb module)
    mongodb.MongoClient.connect(url, DEFAULTCONFIG.options, function(err, db) {
      if (err) done(err);
      mockDbConnection = db;

      // stubs the connect() method of the mongodb.MongoClient module
      // the callback will be called with err=null and db=mockDbConnection
      stubMongoClientConnect = sinon.stub().yields(null, mockDbConnection);

      // subvert the native driver with the mocked method
      requireSubvert.subvert('mongodb', {
        'MongoClient': {
          'connect': stubMongoClientConnect,
        },
      });

      // reloads the native driver used in MongoDbLayer class by the subverted one
      MongoDbLayer = requireSubvert.require('../../../../lib/providers/mongodb');

      // creates a new instance of MongoDbLayer
      mongoDbLayer = new MongoDbLayer(DEFAULTCEMENTHELPER, DEFAULTCONFIG);

      // calls MongoDbLayer init() method
      mongoDbLayer.init().then(function() {
        done();
      }).catch(done);
    });
  });

  after(function() {
    requireSubvert.cleanUp();
  });

  context('when everything ok', function() {
    let validatePromise;
    const job = _.cloneDeep(dbqueryjob);
    const context = {data: job};
    before(function(done) {
      // calls MongoDbLayer validate() method
      mongoDbLayer.validate(context).then(function(res) {
        validatePromise = res;
        done();
      }).catch(done);
    });

    it('should resolve', function() {
      return expect(validatePromise).to.have.property('ok', 1);
    });
  });

  context('when missing/incorrect \'collection\' String property in job payload', function() {
    const job = _.cloneDeep(dbqueryjob);
    job.payload.collection = {};
    const context = { data: job };

    it('should reject', function() {
      const validatePromise = mongoDbLayer.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'collection\' String property in job payload');
    });
  });

  context('when missing/incorrect \'action\' String property in job payload', function() {
    const job = _.cloneDeep(dbqueryjob);
    job.payload.action = {};
    const context = { data: job };

    it('should reject', function() {
      const validatePromise = mongoDbLayer.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'action\' String property in job payload');
    });
  });

  context('when missing/incorrect \'args\' Array property in job payload', function() {
    const job = _.cloneDeep(dbqueryjob);
    job.payload.args = {};
    const context = { data: job };

    it('should reject', function() {
      const validatePromise = mongoDbLayer.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'args\' Array property in job payload');
    });
  });
});
