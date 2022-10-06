import * as edgeWorkersClientSvc from '../edgeworkers/client-manager';
import * as envUtils from '../utils/env-utils';

import inquirer from 'inquirer';
import {Spinner} from  'cli-spinner';
const TIME_UNITS: string[] = ['ms', 's', 'min', 'h'];
const MEMORY_UNITS: string[] = ['B', 'kB', 'MB', 'GB', 'TB'];
const COUNT_UNITS: string[] = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

export const staging = 'STAGING';
export const production = 'PRODUCTION';

export function logWithBorder(str, type = 'log') {
  const t = `--- ${str} ---`;
  const border = getBorder(t);
  log(border, type);
  log(t, type);
  log(border, type);
}

export function log(txt, type = 'log') {
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

export function getFormattedValue(limit) {
  if (limit['limitUnit'] === 'MILLISECOND') {
    return formatMilliseconds(limit['limitValue']);
  } else if (limit['limitUnit']  === 'BYTE') {
    return bytesToBinarySize(limit['limitValue']);
  }

  return formatCount(limit['limitValue']);
}

export async function confirm(msg: string) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      message: msg,
      name: 'result'
    }
  ]);
  return answer.result;
}

export async function spinner(func, userMsg = '') {
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

export async function progress(func, userMsg = '') {
  console.log(userMsg);
  let written = 0;
  const interval = setInterval(function () {
    process.stdout.write('.');
    written++;
  }, 1000);
  try {
    return await func;
  } finally {
    clearInterval(interval);
    if (written > 0) {
      process.stdout.write('\n');
    }
  }
}

export function getBorder(text: string) {
  return Array(text.length).fill('-').join('');
}

export function escape(text: string) {
  return encodeURIComponent(text);
}

export function getTimeout(timeout : number) {
  const timeoutByUser = envUtils.getTimeout();
  if (timeoutByUser == 0) {
    return timeout;
  }
  return timeoutByUser;
}

/**
 * @function formatMilliseconds format number of milliseconds to readable unit of time
 * @param {number} milliseconds: Number of milliseconds
 * @param {number} decimals: Number of decimals
 * @return {string} Formatted time
 */
function formatMilliseconds(milliseconds: number, decimals = 2): string {
  const fixedValue: string = milliseconds.toFixed(2);
  let value: string = fixedValue === '-0.00' ? '0.00' : fixedValue;
  let unit: string = TIME_UNITS[0];
  decimals = decimals < 0 ? 0 : decimals;

  if (Math.abs(milliseconds / 1000) >= 1) {
    const seconds: number = milliseconds / 1000;

    if (Math.abs(seconds / 60) >= 1) {
      const minutes: number = seconds / 60;

      if (Math.abs(minutes / 60) >= 1) {
        value = (minutes / 60).toFixed(decimals);
        unit = TIME_UNITS[3];
      } else {
        value = minutes.toFixed(decimals);
        unit = TIME_UNITS[2];
      }

    } else {
      value = seconds.toFixed(decimals);
      unit = TIME_UNITS[1];
    }
  }

  return `${Number(value).toString()} ${unit}`;
}

/**
 * @function formatCount format a number to readable string
 * @param {number} count: Number to format
 * @param {number} decimals: Number of decimals
 * @return {string} Formatted count
 */
function formatCount(count: number, decimals = 2): string {
  decimals = decimals < 0 ? 0 : decimals;

  const i: number = Math.log10(count) / 3 | 0;
  if (i === 0) {
    return `${Number(count.toFixed(decimals)).toString()}`;
  }
  const scale: number = Math.pow(10, i * 3);
  const res: string = (count / scale).toFixed(decimals);

  return `${Number(res).toString()} ${COUNT_UNITS[i]}`;
}

/**
 * @function bytesToBinarySize format number of bytes to readable size in binary
 * @param {number} bytes: Number of bytes
 * @param {number} decimals: Number of decimals
 * @return {string} Formatted size
 */
function bytesToBinarySize(bytes: number, decimals = 2): string {
  return bytesToSize(bytes, decimals);
}

/**
 * @function bytesToSize format number of bytes to readable size
 * @param {number} bytes: Number of bytes
 * @param {number} decimals: Number of decimals
 * @param {number} kilobyte: Value of 1 kilobyte (1000 decimal or 1024 binary)
 * @return {string} Formatted size
 */
function bytesToSize(bytes: number, decimals = 2, kilobyte = 1024): string {
  if (bytes === null) {
    return 'N/A';
  } else if (bytes === 0) {
    return `0 ${MEMORY_UNITS[0]}`;
  }

  decimals = decimals < 0 ? 0 : decimals;

  const i: number = parseInt(String(Math.floor(Math.log(bytes) / Math.log(kilobyte))), 10);

  if (i === 0) {
    return `${Number(bytes.toFixed(decimals)).toString()} ${MEMORY_UNITS[i]}`;
  }

  const res: string = (bytes / (kilobyte ** i)).toFixed(decimals);

  return `${Number(res).toString()} ${MEMORY_UNITS[i]}`;
}

export enum sortDirections {
  ASC = 'ASC',
  DESC = 'DESC'
}

export function sortObjectArray (objArray: Array<object>, key: string, sortDirection: sortDirections) {
  objArray.sort( (a, b) => {
      let valA, valB;
      
      if (typeof a[key] === 'string' && typeof b[key] === 'string'){
          valA = a[key].toUpperCase();
          valB = b[key].toUpperCase();
      } else {
          valA = a[key];
          valB = b[key];
      }
      
      if (valA < valB) {
          return sortDirection === sortDirections.DESC ? 1 : -1;
      } else if (valA > valB) {
          return sortDirection === sortDirections.DESC ? -1 : 1;
      } else {
          return 0;
      }
    });
}