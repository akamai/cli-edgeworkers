import * as cliUtils from '../utils/cli-utils';
import * as os from 'os';
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const untildify = require('untildify');
const sha256File = require('sha256-file');

const CLI_CACHE_PATH: string = process.env.AKAMAI_CLI_CACHE_DIR || process.env.AKAMAI_CLI_CACHE_PATH || path.resolve(os.homedir(), '.akamai-cli/cache');
const EDGEWORKERS_CLI_HOME: string = path.join(CLI_CACHE_PATH, '/edgeworkers-cli/');
const EDGEWORKERS_DIR: string = path.join(EDGEWORKERS_CLI_HOME, '/edgeworkers/');
const EDGEWORKERS_CLI_OUTPUT_DIR: string = path.join(EDGEWORKERS_DIR, `/cli-output/${Date.now()}/`);
const EDGEWORKERS_CLI_OUTPUT_FILENAME: string = 'ewcli_output.json';
const MAINJS_FILENAME: string = 'main.js';
const MANIFEST_FILENAME: string = 'bundle.json';
const TARBALL_VERSION_KEY: string = 'edgeworker-version';
const BUNDLE_FORMAT_VERSION_KEY: string = 'bundle-version';
const JSAPI_VERSION_KEY: string = 'api-version';
var tarballChecksum = undefined;

// set default JSON output options
const jsonOutputParams = {
  jsonOutput: false,
  jsonOutputPath: EDGEWORKERS_CLI_OUTPUT_DIR,
  jsonOutputFilename: EDGEWORKERS_CLI_OUTPUT_FILENAME
};

// Add try/catch logic incase user doesnt have permissions to write directories needed
try {
  if (!fs.existsSync(EDGEWORKERS_CLI_HOME)) {
    fs.mkdirSync(EDGEWORKERS_CLI_HOME, { recursive: true });
  }
}
catch(e) {
  cliUtils.logAndExit(1, `ERROR: Cannot create ${EDGEWORKERS_CLI_HOME}\n${e.message}`);
}

try {
  if (!fs.existsSync(EDGEWORKERS_DIR)) {
    fs.mkdirSync(EDGEWORKERS_DIR, { recursive: true });
  }
}
catch(e) {
  cliUtils.logAndExit(1, `ERROR: Cannot create ${EDGEWORKERS_DIR}\n${e.message}`);
}

export function setJSONOutputMode(output: boolean) {
  jsonOutputParams.jsonOutput = output;
}

export function setJSONOutputPath(path: string) {
  // only set path to new value if it is provided; since its optional, could be null, so leave set to default value
  if(path)
    jsonOutputParams.jsonOutputPath = untildify(path);
}

export function isJSONOutputMode() {
  return jsonOutputParams.jsonOutput;
}

export function validateTarball(ewId: string, rawTarballPath: string) {
  var tarballPath = untildify(rawTarballPath);

  // Check to make sure tarball exists
  if (!fs.existsSync(tarballPath)) {
    cliUtils.logAndExit(1, `ERROR: EdgeWorkers bundle archive (${tarballPath}) provided is not found.`);
  }

  // Check to make sure tarball contains main.js and bundle.json at root level of archive
  let files = [];

  tar.t(
    {
      file: tarballPath,
      sync: true,
      onentry: function (entry) { files.push(entry.path); }
    },
    [MAINJS_FILENAME, MANIFEST_FILENAME] //this acts as a filter to the archive listing command
  );

  //if both files are not found throw an error and stop
  if (files.length != 2) {
    cliUtils.logAndExit(1, `ERROR: EdgeWorkers ${MAINJS_FILENAME} and/or ${MANIFEST_FILENAME} is not found in provided bundle tgz!`);
  }

  /* DCT 8/19/19: Decided to punt on unpacking the tarball to check the individual files, thus letting the EdgeWorkers OPEN API validation catch those problems.
     However, if we wanted to do it via CLI, would need to update tar.t() command above to be tar.x() providing a local directory to unpack into, then run the
     validateManifest() function here.
  */


  // calculate checksum of new tarball
  tarballChecksum = calculateChecksum(tarballPath);

  return {
    tarballPath,
    tarballChecksum
  }
}

export function buildTarball(ewId: string, codePath: string) {
  var codeWorkingDirectory = untildify(codePath);
  var mainjsPath = path.join(codeWorkingDirectory, MAINJS_FILENAME);
  var manifestPath = path.join(codeWorkingDirectory, MANIFEST_FILENAME);

  if (!fs.existsSync(mainjsPath) || !fs.existsSync(manifestPath)) {
    cliUtils.logAndExit(1, `ERROR: EdgeWorkers main.js (${mainjsPath}) and/or manifest (${manifestPath}) provided is not found.`);
  }

  const edgeWorkersDir = createEdgeWorkerIdDir(ewId);

  // Build tarball file name as ew_<version>_<now-as-epoch>.tgz
  var tarballFileName: string = "ew_";
  var tarballVersion: string;

  // Validate Manifest and if valid, grab version identifier
  var manifest = fs.readFileSync(manifestPath).toString();
  var manifestValidationData = validateManifest(manifest);

  if (!manifestValidationData.isValid) {
    cliUtils.logAndExit(1, manifestValidationData.error_reason);
  }
  else {
    tarballVersion = manifestValidationData.version;
  }

  tarballFileName += tarballVersion + '_' + Date.now() + '.tgz'
  const tarballPath = path.join(edgeWorkersDir, tarballFileName);

  // tar files together with no directory structure (ie: tar czvf ../helloworld.tgz *)
  tar.c(
    {
      gzip: true,
      sync: true,
      C: codeWorkingDirectory,
      portable: true
    },
    [MAINJS_FILENAME, MANIFEST_FILENAME]
  ).pipe(fs.createWriteStream(tarballPath));

  // calculate checksum of new tarball
  tarballChecksum = calculateChecksum(tarballPath);

  return {
    tarballPath,
    tarballChecksum
  }
}

function calculateChecksum(filePath: string) {
  return sha256File(filePath);
}

function createEdgeWorkerIdDir(ewId: string) {
  const edgeWorkersDir = path.join(EDGEWORKERS_DIR, ewId);

  // Add try/catch logic incase user doesnt have permissions to write directories needed
  try {
    if (!fs.existsSync(edgeWorkersDir))
      fs.mkdirSync(edgeWorkersDir, { recursive: true });

    return edgeWorkersDir;
  }
  catch(e) {
    cliUtils.logAndExit(1, `ERROR: Cannot create ${edgeWorkersDir}\n${e.message}`);
  }
}

function validateManifest(manifest: string) {
  // is file valid JSON?
  if (!cliUtils.isJSON(manifest)) {
    return {
      isValid: false,
      version: undefined,
      error_reason: `ERROR: Manifest file (${MANIFEST_FILENAME}) is not valid JSON`
    }
  }

  manifest = JSON.parse(manifest);

  var tarballVersion = manifest[TARBALL_VERSION_KEY];
  var manifestFormat = manifest[BUNDLE_FORMAT_VERSION_KEY];
  var jsAPIVersion = manifest[JSAPI_VERSION_KEY];

  // only checks the one required field is found, ignores optional fields (for now)
  if (!tarballVersion) {
    return {
      isValid: false,
      version: undefined,
      error_reason: `ERROR: Required field is missing: ${TARBALL_VERSION_KEY}`
    }
  }

  // check formatting requirements
  // validation schema per https://git.source.akamai.com/projects/EDGEWORKERS/repos/portal-ew-validation/browse/src/main/resources/manifest-schema.json
  // edgeworker-version should be a string matching "^(?!.*?\\.{2})[.a-zA-Z0-9_~-]{1,32}$"
  if (typeof tarballVersion !== 'string' || !(/^(?!.*?\\.{2})[.a-zA-Z0-9_~-]{1,32}$/.test(tarballVersion))) {
    return {
      isValid: false,
      version: undefined,
      error_reason: `ERROR: Format for field '${TARBALL_VERSION_KEY}' is invalid`
    }
  }
  // Only validate bundle-version if provided as it is optional
  if(manifestFormat) {
    // bundle-version should be an integer >=1
    if (!Number.isInteger(manifestFormat) || manifestFormat < 1) {
      return {
        isValid: false,
        version: undefined,
        error_reason: `ERROR: Format for field '${BUNDLE_FORMAT_VERSION_KEY}' is invalid`
      }
    }
  }
  // Only validate api-version if provided as it is optional
  if(jsAPIVersion) {
    // api-version should be a string matching "^[0-9.]*$"
    if (typeof jsAPIVersion !== 'string' || !(/^[0-9.]*$/.test(jsAPIVersion))) {
      return {
        isValid: false,
        version: undefined,
        error_reason: `ERROR: Format for field '${JSAPI_VERSION_KEY}' is invalid`
      }
    }
  }

  return {
    isValid: true,
    version: tarballVersion,
    error_reason: ""
  }
}

export function determineTarballDownloadDir(ewId: string, rawDownloadPath: string) {

  // If download path option provided, try to use it
  // If not provided, default to CLI cache directory under <CLI_CACHE_PATH>/edgeworkers-cli/edgeworkers/<ewid>/
  var downloadPath = !!rawDownloadPath ? untildify(rawDownloadPath) : createEdgeWorkerIdDir(ewId);

  // Regardless of what was picked, make sure it exists - if it doesnt, attempt to create it
  // Add try/catch logic incase user doesnt have permissions to write directories needed
  try {
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }
  }
  catch(e) {
    cliUtils.logAndExit(1, `ERROR: Cannot create ${downloadPath}\n${e.message}`);
  }
  console.log(`Saving downloaded bundle file at: ${downloadPath}`);
  return downloadPath;
}

function determineJSONOutputPathAndFilename() {
  // If JSON output path option provided, try to use it
  // If not provided, default to CLI cache directory under <CLI_CACHE_PATH>/edgeworkers-cli/edgeworkers/cli-output/<Date.now()>/
  let jsonOutputPath = jsonOutputParams.jsonOutputPath;
  let jsonOutputFilename = jsonOutputParams.jsonOutputFilename;

  // check to see if path is an existing directory location, if it is not, collect directory name and filename via path
  if (fs.existsSync(jsonOutputPath)) {

    if(fs.lstatSync(jsonOutputPath).isDirectory()) {
      //leave path alone, but set filename to default
      jsonOutputFilename = jsonOutputParams.jsonOutputFilename;
    }
    else {
      jsonOutputFilename = path.basename(jsonOutputParams.jsonOutputPath);
      jsonOutputPath = path.dirname(jsonOutputParams.jsonOutputPath);
    }
  }
  else {
    // if path doesnt exist and its not the default path, break custom path into directory and path
    if (jsonOutputPath != EDGEWORKERS_CLI_OUTPUT_DIR) {
      // if path ends with slash, assume user wants it to be a directory, not a filename
      if (jsonOutputPath.endsWith('/')) {
        // leave path alone, but set filename to default
        jsonOutputFilename = jsonOutputParams.jsonOutputFilename;
      }
      else {
        jsonOutputFilename = path.basename(jsonOutputParams.jsonOutputPath);
        jsonOutputPath = path.dirname(jsonOutputParams.jsonOutputPath);
      }
    }
  }

  // Regardless of what was picked, make sure it exists - if it doesnt, attempt to create it
  // Add try/catch logic incase user doesnt have permissions to write directories needed
  try {
    if (!fs.existsSync(jsonOutputPath)) {
      fs.mkdirSync(jsonOutputPath, { recursive: true });
    }
  }
  catch(e) {
    cliUtils.logAndExit(1, `ERROR: Cannot create ${jsonOutputPath}\n${e.message}`);
  }

  console.log(`Saving JSON output at: ${path.join(jsonOutputPath, jsonOutputFilename)}`);
  return {
    path: jsonOutputPath,
    filename: jsonOutputFilename
  }
}

export function writeJSONOutput(exitCode: number, msg: string, data = {}) {

  // First, build the JSON object
  let outputMsg: string;
  let outputData;

  // Check if msg is already JSON - which would happen if OPEN API response failed for some reason
  if(cliUtils.isJSON(msg)) {
    outputMsg = 'An OPEN API error has occurred!';
    outputData = JSON.parse(msg);
  }
  else {
    outputMsg = msg;
    outputData = data
  }

  let output = {
    cliStatus: exitCode,
    msg: outputMsg,
    data: outputData
  };

  // Then, determine the path and filename to write the JSON output
  let outputDestination = determineJSONOutputPathAndFilename();
  // Last, try to write the output file synchronously
  try {
    fs.writeFileSync(path.join(outputDestination.path, outputDestination.filename), cliUtils.toJsonPretty(output));
  }
  catch(e) {
    // unset JSON mode since we cant write the file before writing out error
    setJSONOutputMode(false);
    cliUtils.logAndExit(1, `ERROR: Cannot create JSON output \n${e.message}`);
  }
}
