'use strict';
const Brick = require('cta-brick');

/**
 * DbLayer class
 * @class
 * @property {String} provider - name of Database provider
 * @property {Object} configuration - configuration Object to instantiate the Database provider
 * @property {Object} instance - instance of Database provider
 */
class DbLayer extends Brick {
  /**
   * Create a new DbLayer instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Object} config - cement configuration of the brick
   * @param {String} config.properties.provider - name of Database provider
   * @param {Object} config.properties.configuration - configuration Object to instantiate the Database provider and its driver
   */
  constructor(cementHelper, config) {
    super(cementHelper, config);
    const that = this;

    if (!('provider' in config.properties) || typeof config.properties.provider !== 'string') {
      throw (new Error(`missing/incorrect 'provider' string property in config.properties`));
    }
    that.provider = config.properties.provider;

    if (!('configuration' in config.properties) || typeof config.properties.configuration !== 'object' || config.properties.configuration === null) {
      throw (new Error(`missing/incorrect 'configuration' object property in config.properties`));
    }
    that.configuration = config.properties.configuration;

    // requiring provider module
    let ProviderConstructor;
    try {
      ProviderConstructor = require(`./providers/${that.provider}`);
    } catch (error) {
      throw (new Error(`provider '${that.provider}' is not supported. Require failed with ${error.message}.`));
    }

    // instantiating provider
    try {
      that.instance = new ProviderConstructor(that.configuration, that.cementHelper, that.logger);
    } catch (error) {
      throw (new Error(`loading provider '${that.provider}' failed with: ${error.message}`));
    }
  }

  // must be overridden in the provider implementation
  get init() {
    return this.instance.init;
  }

  /**
   * Validates Context properties
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  get validate() {
    return this.instance.validate;
  }

  /**
   * Process the context
   * @param {Context} context - a Context
   */
  get process() {
    return this.instance.process;
  }
}

exports = module.exports = DbLayer;
