var EdgeGrid = require('edgegrid');
const untildify = require('untildify');
var path = require('path');
const fs = require('fs');
import * as os from 'os';
import * as cliUtils from './cli-utils';

export var timeoutVal: number = 0;

const edgeRcParams = {
  section: process.env.AKAMAI_EDGERC_SECTION || 'default',
  path: process.env.AKAMAI_EDGERC || path.resolve(os.homedir(), '.edgerc'),
  debug: false
};

export function getEdgeGrid() {

  if (!fs.existsSync(untildify(edgeRcParams.path))) {
    cliUtils.logAndExit(1,`ERROR: Could not find .edgerc to authenticate Akamai API calls. Expected at: ${edgeRcParams.path}`);
  }

  try {
    return new EdgeGrid({
      path: untildify(edgeRcParams.path),
      section: edgeRcParams.section,
      debug: edgeRcParams.debug
    });
  }
  catch(e) {
    cliUtils.logAndExit(1, `ERROR: ${e.message}`);
  }
}

export function setDebugMode(debug: boolean) {
  edgeRcParams.debug = debug;
}

export function setEdgeRcSection(section: string) {
  edgeRcParams.section = section;
}

export function setEdgeRcFilePath(path: string) {
  edgeRcParams.path = path;
}

export function isDebugMode() {
  return edgeRcParams.debug;
}

export function getNodeVersion() {
  return parseInt(process.versions["node"].split('.')[0]);
}

export function setTimeout(timeout: number) {
  timeoutVal = timeout*1000;
}

export function getTimeout() {
  return timeoutVal;
}


