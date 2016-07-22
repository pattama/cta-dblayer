'use strict';
const co = require('co');
const mongodb = require('mongodb');
const _ = require('lodash');
const defaultLogger = require('cta-logger');

/**
 * MongoDbLayer class
 * @class
 * @property {Object} options - options object to configure MongoDb driver
 * @property {CementHelper} cementHelper - cementHelper instance
 * @property {Logger} logger - logger instance
 * @property {mongodb.Db} db - a MongoDB Database instance (connection)
 */
class MongoDbLayer {
  /**
   * Create a new MongoDbLayer instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Object} configuration - configuration object for the MongoDb connection
   * @param {String} [configuration.url] - Url connection to the Database. If provided, will discard servers and databasename properties
   * @param {String} configuration.databasename - Name of the MongoDb database
   * @param {Array<MongoDbServer>} configuration.servers - Array of MongoDb servers
   * @param {Object} configuration.options - hash of options for MongoDb. See https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options
   */
  constructor(cementHelper, configuration) {
    if (cementHelper.constructor.name !== 'CementHelper') {
      throw new Error(`missing/incorrect 'cementHelper' CementHelper argument`);
    } else {
      this.cementHelper = cementHelper;
    }
    this.logger = cementHelper.logger || defaultLogger();

    if (typeof configuration !== 'object' || configuration === null) {
      throw new Error(`missing/incorrect 'configuration' object property`);
    }

    if ('url' in configuration) {
      if (typeof configuration.url !== 'string') {
        throw new Error(`incorrect 'url' string property in configuration`);
      } else {
        this.configuration = {
          url: configuration.url,
        };
      }
    } else {
      if (!('databasename' in configuration) || typeof configuration.databasename !== 'string') {
        throw new Error(`missing/incorrect 'databasename' string property in configuration`);
      }

      if (!('servers' in configuration) || !Array.isArray(configuration.servers)) {
        throw new Error(`missing/incorrect 'servers' array property in configuration`);
      } else {
        configuration.servers.forEach(function(server, index) {
          if (!('host' in server) || typeof server.host !== 'string') {
            throw new Error(`missing/incorrect 'host' string property in configuration.servers[${index}]`);
          }
          if (!('port' in server) || typeof server.port !== 'number') {
            throw new Error(`missing/incorrect 'port' number property in configuration.servers[${index}]`);
          }
        });
      }

      if (('options' in configuration) && (typeof configuration.options !== 'object' || configuration.options === null)) {
        throw new Error(`incorrect 'options' object property in configuration`);
      }

      this.configuration = configuration;
      let url;
      url = 'mongodb://';
      url += this.configuration.servers.map((elem) => `${elem.host}:${elem.port}`).join(',');
      url += `/${this.configuration.databasename}`;
      this.configuration.url = url;
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
          that.logger.info(`MongoDB connected successfully.`);
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
    return co(function* validateCoroutine() {
      if (!('collection' in job.payload) || (typeof job.payload.collection !== 'string')) {
        throw (new Error('missing/incorrect \'collection\' String property in job payload'));
      }

      if (!('action' in job.payload) || (typeof job.payload.action !== 'string')) {
        throw (new Error('missing/incorrect \'action\' String property in job payload'));
      }

      if (!('args' in job.payload) || !(Array.isArray(job.payload.args))) {
        throw (new Error('missing/incorrect \'args\' Array property in job payload'));
      }
      return {ok: 1};
    });
  }

  /**
   * Process the context, emit events, create new context and define listeners
   * @param {Context} context - a Context
   */
  process(context) {
    const job = context.data;
    const that = this;
    return new Promise((resolve, reject) => {
      that.db.collection(job.payload.collection, { strict: true }, function(collectionError, collection) {
        if (collectionError) {
          reject(collectionError);
        } else {
          const callback = function(queryError, response) {
            if (queryError) {
              reject(queryError);
            } else {
              const isCursor = response instanceof mongodb.Cursor;
              if (isCursor) {
                response.toArray().then(function(docs) {
                  resolve(docs);
                });
              } else {
                resolve(response);
              }
            }
          };
          const args = _.clone(job.payload.args);
          args.push(callback);
          collection[job.payload.action].apply(collection, args);
        }
      });
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
