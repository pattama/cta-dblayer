'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const requireSubvert = require('require-subvert')(__dirname);

const mongodb = require('mongodb');
let MongoDbLayer = require('../../../../lib/providers/mongodb');
const logger = require('cta-logger');
const DEFAULTCONFIG = {
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
const DEFAULTLOGGER = logger();
const DEFAULTCEMENTHELPER = {
  constructor: {
    name: 'CementHelper',
  },
  brickName: 'mongodblayer',
  logger: DEFAULTLOGGER,
};

describe('MongoDbLayer - init', function() {
  context('when everything ok', function() {
    let mongoDbLayer;
    let initPromise;
    let mockDbConnection;
    let stubMongoClientConnect;
    let url;
    url = 'mongodb://';
    url += DEFAULTCONFIG.servers.map((elem) => `${elem.host}:${elem.port}`).join(',');
    url += `/${DEFAULTCONFIG.databasename}`;
    before(function(done) {
      // creates a mocked db connection using native driver (e.g. mongodb module)
      mongodb.MongoClient.connect(url, DEFAULTCONFIG.options, function(err, db) {
        if (err) done(err);
        mockDbConnection = db;

        // stubs the connect() method of the mongodb.MongoClient module
        // the callback will be called with err=null and db=mockDbConnection
        stubMongoClientConnect = sinon.stub().callsArgWith(2, null, mockDbConnection);

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
        mongoDbLayer.init().then(function(response) {
          initPromise = response;
          done();
        }).catch(done);
      });
    });

    after(function() {
      requireSubvert.cleanUp();
    });

    it('should create a new MongoDb connection using native driver', function() {
      return expect(stubMongoClientConnect.calledWith(url, DEFAULTCONFIG.options)).to.equal(true);
    });

    it('should set the created MongoDb connection as a property of the mongoDbLayer object', function() {
      return expect(mongoDbLayer).to.have.property('db', mockDbConnection);
    });

    it(`should resolve with String 'ok'`, function() {
      expect(initPromise).to.equal('ok');
    });
  });

  context('when connecting to MongoDb fails', function() {
    let mongoDbLayer;
    const mockMongoClientConnectError = new Error('mock error connection');
    let stubMongoClientConnect;
    let url;
    url = 'mongodb://';
    url += DEFAULTCONFIG.servers.map((elem) => `${elem.host}:${elem.port}`).join(',');
    url += `/${DEFAULTCONFIG.databasename}`;
    before(function(done) {
      // stubs the connect() method of the mongodb.MongoClient module
      // the callback will be called with err=mockMongoClientConnectError and db=null
      stubMongoClientConnect = sinon.stub().callsArgWith(2, mockMongoClientConnectError, null);

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
      done();
    });

    after(function() {
      requireSubvert.cleanUp();
    });

    it('should reject with an error', function() {
      const initPromise = mongoDbLayer.init();
      return expect(initPromise).to.eventually.be.rejectedWith(mockMongoClientConnectError);
    });
  });
});
