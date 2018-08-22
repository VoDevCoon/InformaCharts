import chalk from 'chalk';
import _ from 'lodash';
import config from '../config/config';

const noop = function () { };
const consoleLog = config.logging
  ? console.log.bind(console) : noop; // eslint-disable-line no-console

const logger = {
  log(...args) {
    const tag = chalk.green('[ ✨ LOG ✨ ]');
    const data = _.toArray(args)
      .map((arg) => {
        if (typeof (arg) === 'object') {
          const string = JSON.stringify(arg, null, 2);
          return `${tag}  ${chalk.cyan(string)}`;
        }
        return `${tag}  ${chalk.cyan(arg)}`;
      });

    consoleLog.apply(console, data);
  },

  error(...args) {
    const data = _.toArray(args)
      .map((arg) => {
        const toArg = arg.stack || arg;
        const name = toArg.name || '[ ❌ ERROR ❌ ]';
        const log = `${chalk.yellow(name)}  ${chalk.red(toArg)}`;
        return log;
      });

    consoleLog.apply(console, data);
  },
};

module.exports = logger;
