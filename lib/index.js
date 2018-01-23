/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';
const co = require('co');
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

    if (!config.properties.hasOwnProperty('provider') || typeof config.properties.provider !== 'string') {
      throw (new Error('missing/incorrect \'provider\' string property in config.properties'));
    }
    that.provider = config.properties.provider;

    if (!config.properties.hasOwnProperty('configuration') || typeof config.properties.configuration !== 'object' || config.properties.configuration === null) {
      throw (new Error('missing/incorrect \'configuration\' object property in config.properties'));
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
      that.instance = new ProviderConstructor(that.cementHelper, that.configuration);
    } catch (error) {
      throw (new Error(`loading provider '${that.provider}' failed with: ${error.message}`));
    }
  }

  // must be overridden by the provider implementation
  get init() {
    return this.instance.init;
  }

  /**
   * Validates Context properties
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  validate(context) {
    const job = context.data;
    const that = this;
    const superValidate = super.validate.bind(this);
    return co(function* validateCoroutine() {
      yield superValidate(context);

      const type = job.nature.type.trim().toLowerCase();
      if (type !== 'database') {
        throw (new Error(`type ${job.nature.type} not supported`));
      }

      const quality = job.nature.quality.trim().toLowerCase();
      if (quality !== 'query') {
        throw (new Error(`quality ${job.nature.quality} not supported`));
      }

      yield that.instance.validate(context);

      return {ok: 1};
    });
  }

  // must be overridden by the provider implementation
  get process() {
    return this.instance.process;
  }
}

exports = module.exports = DbLayer;
