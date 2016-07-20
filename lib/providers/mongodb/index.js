'use strict';
const mongodb = require('mongodb');
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
   * @param {Object} configuration - configuration object for the MongoDb connection
   * @param {String} [configuration.url] - Url connection to the Database. If provided, will discard servers and databasename properties
   * @param {String} configuration.databasename - Name of the MongoDb database
   * @param {Array<MongoDbServer>} configuration.servers - Array of MongoDb servers
   * @param {Object} configuration.options - hash of options for MongoDb. See https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Logger} logger - logger instance
   */
  constructor(configuration, cementHelper, logger) {
    this.logger = logger || defaultLogger();

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

    if (cementHelper.constructor.name !== 'CementHelper') {
      throw new Error(`missing/incorrect 'cementHelper' CementHelper argument`);
    } else {
      this.cementHelper = cementHelper;
    }
  }

  init() {
    const that = this;
    that.logger.info(`Initializing Brick ${that.cementHelper.brickName}...`);
    return new Promise((resolve) => {
      that.logger.info(`Connecting to MongoDB using native driver (${that.configuration.url})...`);
      mongodb.MongoClient.connect(that.configuration.url, that.configuration.options, function(err, db) {
        that.logger.info(`MongoDB connected successfully.`);
        that.db = db;
        that.logger.info(`Brick ${that.cementHelper.brickName} initialized successfully.`);
        resolve('ok');
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
