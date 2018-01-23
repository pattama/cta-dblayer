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
const Context = require('cta-flowcontrol').Context;
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
    url += `/${DEFAULTCONFIG.databaseName}`;
    let mongodbStubModule;

    before(function(done) {
      // creates a mocked db connection using native driver (e.g. mongodb module)
      mongodb.MongoClient.connect(url, DEFAULTCONFIG.options, function(err, db) {
        if (err) done(err);
        mockDbConnection = db;

        // stubs the connect() method of the mongodb.MongoClient module
        // the callback will be called with err=null and db=mockDbConnection
        stubMongoClientConnect = sinon.stub().yields(null, mockDbConnection);

        // subvert the native driver with the mocked method
        mongodbStubModule = {
          'MongoClient': {
            'connect': stubMongoClientConnect,
          },
          'Cursor': mongodb.Cursor,
        };
        requireSubvert.subvert('mongodb', mongodbStubModule);

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
      const context = new Context(DEFAULTCEMENTHELPER, job);
      let mockDbCollection;
      let stubDbCollection;
      const mockQueryResponse = {doc: 1};
      before(function(done) {
        // mock a db collection object for context.payload.collection
        mockDbCollection = {};
        mockDbCollection[context.data.payload.action] = sinon.stub().yields(null, mockQueryResponse);

        // stub db.collection() method
        stubDbCollection = sinon.stub(mockDbConnection, 'collection').withArgs(context.data.payload.collection).yields(null, mockDbCollection);

        // spy context emit() method
        sinon.spy(context, 'emit');
        context.on('done', function() {
          done();
        });

        // calls MongoDbLayer process() method
        mongoDbLayer.process(context);
      });

      after(function() {
        mockDbConnection.collection.restore();
      });

      it('should retrieve collection', function() {
        const options = DEFAULTCONFIG.collectionOptions;
        expect(stubDbCollection.calledWith(context.data.payload.collection, options)).to.equal(true);
      });

      it('should call query on collection', function() {
        // todo: add more precision by using calledWith and matchers
        expect(mockDbCollection[context.data.payload.action].called).to.equal(true);
      });

      it('should emit done event with response', function() {
        return expect(context.emit.calledWith('done', mongoDbLayer.cementHelper.brickName, mockQueryResponse)).to.equal(true);
      });
    });

    context('when retrieving collection fails', function() {
      const job = _.cloneDeep(dbqueryjob);
      const context = new Context(DEFAULTCEMENTHELPER, job);
      const mockError = new Error('mock collection error');
      before(function(done) {
        // stub db.collection() method
        sinon.stub(mockDbConnection, 'collection').withArgs(context.data.payload.collection).yields(mockError, null);

        // spy context emit() method
        sinon.spy(context, 'emit');
        context.on('error', function() {
          done();
        });

        // calls MongoDbLayer process() method
        mongoDbLayer.process(context);
      });

      after(function() {
        mockDbConnection.collection.restore();
      });

      it('should emit error event with error', function() {
        return expect(context.emit.calledWith('error', mongoDbLayer.cementHelper.brickName, mockError)).to.equal(true);
      });
    });

    context('when query fails', function() {
      const job = _.cloneDeep(dbqueryjob);
      const context = new Context(DEFAULTCEMENTHELPER, job);
      let mockDbCollection;
      const mockError = new Error('mock query error');
      before(function(done) {
        // mock a db collection object for context.payload.collection
        mockDbCollection = {};
        mockDbCollection[context.data.payload.action] = sinon.stub().yields(mockError, null);

        // stub db.collection() method
        sinon.stub(mockDbConnection, 'collection').withArgs(context.data.payload.collection).yields(null, mockDbCollection);

        // spy context emit() method
        sinon.spy(context, 'emit');
        context.on('error', function() {
          done();
        });

        // calls MongoDbLayer process() method
        mongoDbLayer.process(context);
      });

      after(function() {
        mockDbConnection.collection.restore();
      });

      it('should emit error event with error', function() {
        return expect(context.emit.calledWith('error', mongoDbLayer.cementHelper.brickName, mockError)).to.equal(true);
      });
    });

    context('when response is a Cursor but cannot be converted to Array', function() {
      const job = _.cloneDeep(dbqueryjob);
      const context = new Context(DEFAULTCEMENTHELPER, job);
      let mockDbCollection;
      let mockQueryResponseCursor;
      const mockQueryResponseCursorError = new Error('mock error');
      before(function(done) {
        mockQueryResponseCursor = sinon.createStubInstance(mongodbStubModule.Cursor);
        mockQueryResponseCursor.toArray.restore();
        sinon.stub(mockQueryResponseCursor, 'toArray').rejects(mockQueryResponseCursorError);

        // mock a db collection object for context.payload.collection
        mockDbCollection = {};
        mockDbCollection[context.data.payload.action] = sinon.stub().yields(null, mockQueryResponseCursor);

        // stub db.collection() method
        sinon.stub(mockDbConnection, 'collection').withArgs(context.data.payload.collection).yields(null, mockDbCollection);

        // spy context emit() method
        sinon.spy(context, 'emit');
        context.on('error', function() {
          done();
        });

        // calls MongoDbLayer process() method
        mongoDbLayer.process(context);
      });

      after(function() {
        mockDbConnection.collection.restore();
      });

      it('should emit error event', function() {
        return expect(context.emit.calledWith('error', mongoDbLayer.cementHelper.brickName, mockQueryResponseCursorError)).to.equal(true);
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
        const context = new Context(DEFAULTCEMENTHELPER, job);
        before(function(done) {
          // spy context emit() method
          sinon.spy(context, 'emit');
          context.on('done', function() {
            done();
          });

          // calls MongoDbLayer process() method
          mongoDbLayer.process(context);
        });

        after(function() {
        });

        it('should emit done event with an Array', function() {
          return expect(context.emit.calledWith('done', mongoDbLayer.cementHelper.brickName, sinon.match.array)).to.equal(true);
        });
      });

      // context('when response is not a Cursor', function() {
      //   const job = _.cloneDeep(dbqueryjob);
      //   job.payload.action = 'findOne'; // mongodb.findOne() returns a Document
      //   job.payload.args = [
      //     { name: 'cta-openstack-emea1' },
      //   ];
      //   const context = new Context(DEFAULTCEMENTHELPER, job);
      //   before(function(done) {
      //     // spy context emit() method
      //     sinon.spy(context, 'emit');
      //     context.on('done', function() {
      //       done();
      //     });
      //
      //     // calls MongoDbLayer process() method
      //     mongoDbLayer.process(context);
      //   });
      //
      //   after(function() {
      //   });
      //
      //   it('should emit done event with a response', function() {
      //     return expect(context.emit.calledWith('done', mongoDbLayer.cementHelper.brickName, sinon.match.object)).to.equal(true);
      //   });
      // });
    });
  });
});
