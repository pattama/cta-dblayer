'use strict';

const Brick = require('cta-brick');
const co = require('co');

class Writer extends Brick {
  constructor(cementHelper, config) {
    super(cementHelper, config);
  }

  _create() {
    const that = this;
    const docs = [{
      name: 'foo',
      properties: [{
        key: 'env', value: 'alpha',
      }, {
        key: 'env', value: 'beta',
      }],
    }, {
      name: 'bar',
      properties: [{
        key: 'env', value: 'beta',
      }, {
        key: 'env', value: 'prod',
      }],
    }];
    return new Promise((resolve, reject) => {
      that.cementHelper.createContext({
        nature: {
          type: 'database',
          quality: 'query',
        },
        payload: {
          collection: 'test',
          action: 'insertMany',
          args: [docs],
        }
      })
      .on('error', function onContextError(who, error) {
        reject();
      })
      .on('done', function onContextDone(who, result) {
        that.logger.info(`Created`, result);
        resolve();
      })
      .publish();
    });
  }

  _read() {
    const that = this;
    return new Promise((resolve, reject) => {
      that.cementHelper.createContext({
        nature: {
          type: 'database',
          quality: 'query',
        },
        payload: {
          collection: 'test',
          action: 'find',
          args: [
            {
              properties: {
                $elemMatch: {
                  key: 'env',
                  value: 'beta',
                },
              },
            },
            {limit: 10},
          ],
        }
      })
      .on('error', function onContextError(who, error) {
        reject();
      })
      .on('done', function onContextDone(who, result) {
        this.logger.info(`Found ${result.length} document(s):`, result);
        resolve();
      })
      .publish();
    });
  }

  start(context) {
    const that = this;
    return co(function * () {
      yield that._create();
      yield that._read();
    }).catch((err) => {
      throw new Error(err);
    });
  }
}

module.exports = Writer;
