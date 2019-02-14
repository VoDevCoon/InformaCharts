import chalk from 'chalk';
import _ from 'lodash';
import appRoot from 'app-root-path';
import fs from 'fs';
import util from 'util';
import config from '../config/config';

if (config.env === 'production') {
  const logFile = fs.createWriteStream(`${appRoot}/server/logs/sync.log`, { flags: 'w' });
  console.log = function (d) {
    // remove ANSI color/styles
    const dataString = String(d).replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''); // eslint-disable-line no-control-regex
    logFile.write(`${util.format(dataString)} \n`);
  };
}

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
