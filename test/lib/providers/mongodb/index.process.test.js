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
  logger: DEFAULTLOGGER,
};
const dbqueryjob = {
  nature: {
    type: 'database',
    quality: 'query',
  },
  payload: {
    collection: 'cloud',
    action: 'findOne',
    args: [],
  },
};

describe('MongoDbLayer - process', function() {
  context('when stubbing native driver', function() {
    let mongoDbLayer;
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
        stubMongoClientConnect = sinon.stub().yields(null, mockDbConnection);

        // subvert the native driver with the mocked method
        requireSubvert.subvert('mongodb', {
          'MongoClient': {
            'connect': stubMongoClientConnect,
          },
          'Cursor': mongodb.Cursor,
        });

        // reloads the native driver used in MongoDbLayer class by the subverted one
        MongoDbLayer = requireSubvert.require('../../../../lib/providers/mongodb');

        // creates a new instance of MongoDbLayer
        mongoDbLayer = new MongoDbLayer(DEFAULTCEMENTHELPER, DEFAULTCONFIG);

        // calls MongoDbLayer init() method
        mongoDbLayer.init().then(function() {
          done();
        });
      });
    });

    after(function() {
      requireSubvert.cleanUp();
    });

    context('when everything ok', function() {
      const job = _.cloneDeep(dbqueryjob);
      const context = {data: job};
      let mockDbCollection;
      let stubDbCollection;
      const mockQueryResponse = {doc: 1};
      let processPromise;
      before(function(done) {
        // mock a db collection object for context.payload.collection
        mockDbCollection = {};
        mockDbCollection[context.data.payload.action] = sinon.stub().yields(null, mockQueryResponse);

        // stub db.collection() method
        stubDbCollection = sinon.stub(mockDbConnection, 'collection').withArgs(context.data.payload.collection).yields(null, mockDbCollection);

        // calls MongoDbLayer process() method
        mongoDbLayer.process(context).then(function(res) {
          processPromise = res;
          done();
        }).catch(done);
      });

      after(function() {
        mockDbConnection.collection.restore();
      });

      it('should retrieve collection', function() {
        const options = {
          strict: true,
        };
        expect(stubDbCollection.calledWith(context.data.payload.collection, options)).to.equal(true);
      });

      it('should call query on collection', function() {
        // todo: add more precision by using calledWith and matchers
        expect(mockDbCollection[context.data.payload.action].called).to.equal(true);
      });

      it('should resolve with response from query', function() {
        return expect(processPromise).to.equal(mockQueryResponse);
      });
    });

    context('when retrieving collection fails', function() {
      const job = _.cloneDeep(dbqueryjob);
      const context = {data: job};
      const mockError = new Error('mock collection error');
      before(function() {
        // stub db.collection() method
        sinon.stub(mockDbConnection, 'collection').withArgs(context.data.payload.collection).yields(mockError, null);
      });

      after(function() {
        mockDbConnection.collection.restore();
      });

      it('should reject', function() {
        return expect(mongoDbLayer.process(context)).to.eventually.be.rejectedWith(mockError);
      });
    });

    context('when query fails', function() {
      const job = _.cloneDeep(dbqueryjob);
      const context = {data: job};
      let mockDbCollection;
      const mockError = new Error('mock query error');
      before(function() {
        // mock a db collection object for context.payload.collection
        mockDbCollection = {};
        mockDbCollection[context.data.payload.action] = sinon.stub().yields(mockError, null);

        // stub db.collection() method
        sinon.stub(mockDbConnection, 'collection').withArgs(context.data.payload.collection).yields(null, mockDbCollection);
      });

      after(function() {
        mockDbConnection.collection.restore();
      });

      it('should reject', function() {
        return expect(mongoDbLayer.process(context)).to.eventually.be.rejectedWith(mockError);
      });
    });
  });

  context('when not stubbing native driver', function() {
    let mongoDbLayer;
    before(function(done) {
      // creates a new instance of MongoDbLayer
      mongoDbLayer = new MongoDbLayer(DEFAULTCEMENTHELPER, DEFAULTCONFIG);
      // calls MongoDbLayer init() method
      mongoDbLayer.init().then(function() {
        done();
      }).catch(done);
    });
    context('when everything ok', function() {
      context('when response is a Cursor', function() {
        const job = _.cloneDeep(dbqueryjob);
        job.payload.action = 'find'; // mongodb.find() returns a Cursor
        job.payload.args = [
          { region: 'emea1' },
          { limit: 1},
        ];
        const context = {data: job};
        let processPromise;
        before(function(done) {
          // calls MongoDbLayer process() method
          mongoDbLayer.process(context).then(function(res) {
            processPromise = res;
            done();
          }).catch(done);
        });

        after(function() {
        });

        it('should resolve with an Array', function() {
          return expect(processPromise).to.be.an('Array');
        });
      });

      context('when response is not a Cursor', function() {
        const job = _.cloneDeep(dbqueryjob);
        job.payload.action = 'findOne'; // mongodb.findOne() returns a Document
        job.payload.args = [
          { name: 'cta-openstack-emea1' },
        ];
        const context = {data: job};
        let processPromise;
        before(function(done) {
          // calls MongoDbLayer process() method
          mongoDbLayer.process(context).then(function(res) {
            processPromise = res;
            done();
          }).catch(done);
        });

        after(function() {
        });

        it('should resolve with an Array', function() {
          return expect(processPromise).to.exist;
        });
      });
    });
  });
});
