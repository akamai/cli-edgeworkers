var EdgeGrid = require('edgegrid');
const untildify = require('untildify');
var path = require('path');
import * as os from 'os';

const edgeRcParams = {
  section: process.env.AKAMAI_EDGERC_SECTION || 'default',
  path: process.env.AKAMAI_EDGERC || path.resolve(os.homedir(), '.edgerc'),
  debug: false
};

export function getEdgeGrid() {
    return new EdgeGrid({
      path: untildify(edgeRcParams.path),
      section: edgeRcParams.section,
      debug: edgeRcParams.debug
    });
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
