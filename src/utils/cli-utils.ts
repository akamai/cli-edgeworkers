import * as edgeWorkersClientSvc from '../edgeworkers/client-manager';
const inquirer = require('inquirer');
const Spinner = require('cli-spinner').Spinner;

export function logWithBorder(str, type = 'log') {
  var t: string = `--- ${str} ---`;
  var border = getBorder(t);
  log(border, type);
  log(t, type);
  log(border, type);
}

function log(txt, type = 'log') {
  if (type === 'log') {
    console.log(txt);
  } else if (type === 'err') {
    console.error(txt);
  } else {
    throw `bad args: ${type}`;
  }
}

export function logAndExit(exitCode: number, msg: string, data =[{}]) {

  if(edgeWorkersClientSvc.isJSONOutputMode())
    edgeWorkersClientSvc.writeJSONOutput(exitCode, msg, data);
  else
    console.log(msg);

  process.exit(exitCode);
}

export async function confirm(msg: string) {
  var answer = await inquirer.prompt([
    {
      type: 'confirm',
      message: msg,
      name: 'result'
    }
  ]);
  return answer.result;
}

export async function spinner(func, userMsg: string = '') {
  const spinner = new Spinner({
    text: `${userMsg} %s`,
    stream: process.stderr,
  });
  spinner.setSpinnerString('|/-\\');
  spinner.start();
  try {
    return await func;
  } finally {
    spinner.stop(true);
  }
}

export function toJsonPretty(obj) {
  return JSON.stringify(obj, undefined, 2);
}

export function parseIfJSON(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

export function isJSON(str) {
  if (typeof str !== 'string') return false;
  try {
    const result = JSON.parse(str);
    const type = Object.prototype.toString.call(result);
    return type === '[object Object]'
      || type === '[object Array]';
  } catch (err) {
    return false;
  }
}

export async function progress(func, userMsg: string = '') {
  console.log(userMsg);
  var written: number = 0;
  const interval = setInterval(function () {
    process.stdout.write(".");
    written++;
  }, 1000);
  try {
    return await func;
  } finally {
    clearInterval(interval);
    if (written > 0) {
      process.stdout.write("\n");
    }
  }
}

export function getBorder(text: string) {
  return Array(text.length).fill('-').join('');
}


