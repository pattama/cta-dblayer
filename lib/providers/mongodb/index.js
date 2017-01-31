'use strict';

const mongodb = require('mongodb');
const _ = require('lodash');
const defaultLogger = require('cta-logger');

/**
 * MongoDbLayer class
 * @class
 * @property {Object} configuration - configuration object for the MongoDb connection
 * @property {CementHelper} cementHelper - cementHelper instance
 * @property {Logger} logger - logger instance
 * @property {mongodb.Db} db - a MongoDB Database instance (connection)
 */
class MongoDbLayer {
  /**
   * Create a new MongoDbLayer instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Object} configuration - configuration object for the MongoDb connection
   * @param {String} [configuration.url] - Url connection to the Database. If provided, will discard servers and databaseName properties
   * @param {String} configuration.databaseName - Name of the MongoDb database
   * @param {Array<MongoDbServer>} configuration.servers - Array of MongoDb servers
   * @param {Object} configuration.options - hash of options for creating a new MongoDb connection. See https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options
   * @param {Object} configuration.collectionOptions - hash of options for the db.collection() method. See http://mongodb.github.io/node-mongodb-native/2.2/api/Db.html#collection
   */
  constructor(cementHelper, configuration) {
    if (cementHelper.constructor.name !== 'CementHelper') {
      throw new Error('missing/incorrect \'cementHelper\' CementHelper argument');
    } else {
      this.cementHelper = cementHelper;
    }
    this.logger = cementHelper.dependencies.logger || defaultLogger();

    if (typeof configuration !== 'object' || configuration === null) {
      throw new Error('missing/incorrect \'configuration\' object property');
    }

    this.configuration = configuration;
    if (configuration.hasOwnProperty('url')) {
      if (typeof configuration.url !== 'string') {
        throw new Error('incorrect \'url\' string property in configuration');
      } else {
        this.configuration = {
          url: configuration.url,
        };
      }
    } else {
      if (!configuration.hasOwnProperty('databaseName') || typeof configuration.databaseName !== 'string') {
        throw new Error('missing/incorrect \'databaseName\' string property in configuration');
      }

      if (!configuration.hasOwnProperty('servers') || !Array.isArray(configuration.servers)) {
        throw new Error('missing/incorrect \'servers\' array property in configuration');
      } else {
        configuration.servers.forEach(function(server, index) {
          if (!server.hasOwnProperty('host') || typeof server.host !== 'string') {
            throw new Error(`missing/incorrect 'host' string property in configuration.servers[${index}]`);
          }
          if (!server.hasOwnProperty('port') || typeof server.port !== 'number') {
            throw new Error(`missing/incorrect 'port' number property in configuration.servers[${index}]`);
          }
        });
      }
      let url;
      url = 'mongodb://';
      url += this.configuration.servers.map((elem) => `${elem.host}:${elem.port}`).join(',');
      url += `/${this.configuration.databaseName}`;
      this.configuration.url = url;
    }

    if (configuration.hasOwnProperty('options')
      && (typeof configuration.options !== 'object' || configuration.options === null)) {
      throw new Error('incorrect \'options\' object property in configuration');
    }

    if (configuration.hasOwnProperty('collectionOptions')
      && (typeof configuration.collectionOptions !== 'object' || configuration.collectionOptions === null)) {
      throw new Error('incorrect \'collectionOptions\' object property in configuration');
    }
  }

  init() {
    const that = this;
    that.logger.info(`Initializing Brick ${that.cementHelper.brickName}...`);
    return new Promise((resolve, reject) => {
      that.logger.info(`Connecting to MongoDB using native driver (${that.configuration.url})...`);
      mongodb.MongoClient.connect(that.configuration.url, that.configuration.options, function(err, db) {
        if (err) {
          reject(err);
        } else {
          that.logger.info('MongoDB connected successfully.');
          that.db = db;
          that.logger.info(`Brick ${that.cementHelper.brickName} initialized successfully.`);
          resolve('ok');
        }
      });
    });
  }

  /**
   * Validates Job properties specific to MongoDbLayer
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  validate(context) {
    const job = context.data;
    if (!job.payload.hasOwnProperty('collection') || (typeof job.payload.collection !== 'string')) {
      return Promise.reject(new Error('missing/incorrect \'collection\' String property in job payload'));
    }
    if (!job.payload.hasOwnProperty('action') || (typeof job.payload.action !== 'string')) {
      return Promise.reject(new Error('missing/incorrect \'action\' String property in job payload'));
    }
    if (!job.payload.hasOwnProperty('args') || !(Array.isArray(job.payload.args))) {
      return Promise.reject(new Error('missing/incorrect \'args\' Array property in job payload'));
    }
    return Promise.resolve({ok: 1});
  }

  /**
   * Process the context, emit events, create new context and define listeners
   * @param {Context} context - a Context
   */
  process(context) {
    const job = context.data;
    const that = this;
    that.db.collection(job.payload.collection, that.configuration.collectionOptions, function(collectionError, collection) {
      if (collectionError) {
        context.emit('error', that.cementHelper.brickName, collectionError);
      } else {
        const callback = function(queryError, response) {
          if (queryError) {
            context.emit('error', that.cementHelper.brickName, queryError);
          } else {
            const isCursor = response instanceof mongodb.Cursor;
            if (isCursor) {
              response.toArray().then(function(docs) {
                context.emit('done', that.cementHelper.brickName, docs);
              }).catch(function(cursorError) {
                context.emit('error', that.cementHelper.brickName, cursorError);
              });
            } else {
              context.emit('done', that.cementHelper.brickName, response);
            }
          }
        };
        const args = _.clone(job.payload.args);
        that.logger.silly('executing query on collection "' + job.payload.collection + '" with arguments: ', args);
        args.push(callback);
        collection[job.payload.action].apply(collection, args);
      }
    });
  }

  /**
   * MongoDbServer
   * @memberof MongoDbLayer
   * @typedef {Object} MongoDbServer
   * @property {String} host - A hostname, an IP address or an unix domain socket
   * @property {Number} port - A port
   */
}

module.exports = MongoDbLayer;
