import * as cliUtils from '../utils/cli-utils';
import * as os from 'os';
import fs from 'fs';
import path from 'path';
import tar from 'tar';
import untildify from 'untildify';
import sha256File from 'sha256-file';
import { glob } from 'glob';

const CLI_CACHE_PATH: string =
  process.env.AKAMAI_CLI_CACHE_DIR ||
  process.env.AKAMAI_CLI_CACHE_PATH ||
  path.resolve(os.homedir(), '.akamai-cli/cache');
const EDGEWORKERS_CLI_HOME: string = path.join(
  CLI_CACHE_PATH,
  '/edgeworkers-cli/'
);
const EDGEWORKERS_DIR: string = path.join(
  EDGEWORKERS_CLI_HOME,
  '/edgeworkers/'
);
const EDGEWORKERS_CLI_OUTPUT_DIR: string = path.join(
  EDGEWORKERS_DIR,
  `/cli-output/${Date.now()}/`
);
const EDGEWORKERS_CLI_OUTPUT_FILENAME = 'ewcli_output.json';
const MAINJS_FILENAME = 'main.js';
const MANIFEST_FILENAME = 'bundle.json';
const TARBALL_VERSION_KEY = 'edgeworker-version';
const BUNDLE_FORMAT_VERSION_KEY = 'bundle-version';
const JSAPI_VERSION_KEY = 'api-version';
let tarballChecksum;

// set default JSON output options
const jsonOutputParams = {
  jsonOutput: false,
  jsonOutputPath: EDGEWORKERS_CLI_OUTPUT_DIR,
  jsonOutputFilename: EDGEWORKERS_CLI_OUTPUT_FILENAME,
  jsonOutputFile: false,
  jsonOutputStdout: false
};

// Add try/catch logic incase user doesnt have permissions to write directories needed
try {
  if (!fs.existsSync(EDGEWORKERS_CLI_HOME)) {
    fs.mkdirSync(EDGEWORKERS_CLI_HOME, { recursive: true });
  }
} catch (e) {
  cliUtils.logAndExit(
    1,
    `ERROR: Cannot create ${EDGEWORKERS_CLI_HOME}\n${e.message}`
  );
}

try {
  if (!fs.existsSync(EDGEWORKERS_DIR)) {
    fs.mkdirSync(EDGEWORKERS_DIR, { recursive: true });
  }
} catch (e) {
  cliUtils.logAndExit(
    1,
    `ERROR: Cannot create ${EDGEWORKERS_DIR}\n${e.message}`
  );
}

export function setJSONOutputMode(output: boolean) {
  jsonOutputParams.jsonOutput = output;
}

export function setJSONOutputPath(path: string) {
  jsonOutputParams.jsonOutputFile = true;
  // only set path to new value if it is provided; since its optional, could be null, so leave set to default value
  if (path) { 
    jsonOutputParams.jsonOutputPath = untildify(path);
  }
}

export function setJSONOutputStdout(output: boolean) {
  jsonOutputParams.jsonOutputStdout = output;
}

export function isJSONOutputMode() {
  return jsonOutputParams.jsonOutput;
}

export function isJSONOutputStdout() {
  return jsonOutputParams.jsonOutputStdout;
}

export function isJSONOutputFile() {
  return jsonOutputParams.jsonOutputFile;
}

/**
 * validateTarballLocally() function is used to validate the tarball file in local system
 * @param {string} rawTarballPath the path to the tarball file
 * @param {boolean} isValidate an optional flag parameter that indicates whether it is called by the `validate` command
 * @returns {{tarballPath: any, tarballChecksum: any}}
 */
export function validateTarballLocally(
  rawTarballPath: string,
  isValidate?: boolean
) {
  const tarballPath = untildify(rawTarballPath);

  // Check to make sure tarball exists
  if (!fs.existsSync(tarballPath)) {
    const errMsgPart = isValidate
      ? 'Validation Errors for:'
      : 'ERROR: EdgeWorkers bundle archive';
    cliUtils.logAndExit(
      1,
      `${errMsgPart} (${tarballPath}) provided is not found.`
    );
  }

  // calculate checksum of new tarball
  tarballChecksum = calculateChecksum(tarballPath);

  return {
    tarballPath,
    tarballChecksum,
  };
}

export function buildTarball(ewId: string, codePath: string, edgeWorkersDir: string = createEdgeWorkerIdDir(ewId)) {
  const codeWorkingDirectory = path.resolve(untildify(codePath));
  const mainjsPath = path.join(codeWorkingDirectory, MAINJS_FILENAME);
  const manifestPath = path.join(codeWorkingDirectory, MANIFEST_FILENAME);

  if (!fs.existsSync(mainjsPath) || !fs.existsSync(manifestPath)) {
    cliUtils.logAndExit(
      1,
      `ERROR: EdgeWorkers main.js (${mainjsPath}) and/or manifest (${manifestPath}) provided is not found.`
    );
  }

  // Build tarball file name as ew_<version>_<now-as-epoch>.tgz
  let tarballFileName = 'ew_';
  let tarballVersion: string;

  // Validate Manifest and if valid, grab version identifier
  const manifest = fs.readFileSync(manifestPath).toString();
  const manifestValidationData = validateManifest(manifest);

  if (!manifestValidationData.isValid) {
    cliUtils.logAndExit(1, manifestValidationData.error_reason);
  } else {
    tarballVersion = manifestValidationData.version;
  }

  tarballFileName += tarballVersion + '_' + Date.now() + '.tgz';
  const tarballPath = path.join(edgeWorkersDir, tarballFileName);

  // get the list of files that we will add to the tarball.  While ['.'] works to create a tarball, it will fail validation
  // when uploaded.  The validation server will not be able to find the bundle.json/main.js when it lists the files inside.
  const files = glob.sync('**/*', { cwd: codeWorkingDirectory });

  // tar files together with no directory structure (ie: tar czvf ../helloworld.tgz *)
  tar
    .c(
      {
        gzip: true,
        portable: true,
        file: tarballPath,
        cwd: codeWorkingDirectory,
        sync: true
      },
      files
    );

  // calculate checksum of new tarball
  tarballChecksum = calculateChecksum(tarballPath);

  cliUtils.log(`Created tarball at ${tarballPath}`);
  return {
    tarballPath,
    tarballChecksum,
  };
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
  } catch (e) {
    cliUtils.logAndExit(
      1,
      `ERROR: Cannot create ${edgeWorkersDir}\n${e.message}`
    );
  }
}

function validateManifest(manifest: string) {
  // is file valid JSON?
  if (!cliUtils.isJSON(manifest)) {
    return {
      isValid: false,
      version: undefined,
      error_reason: `ERROR: Manifest file (${MANIFEST_FILENAME}) is not valid JSON`,
    };
  }

  manifest = JSON.parse(manifest);

  const tarballVersion = manifest[TARBALL_VERSION_KEY];
  const manifestFormat = manifest[BUNDLE_FORMAT_VERSION_KEY];
  const jsAPIVersion = manifest[JSAPI_VERSION_KEY];

  // only checks the one required field is found, ignores optional fields (for now)
  if (!tarballVersion) {
    return {
      isValid: false,
      version: undefined,
      error_reason: `ERROR: Required field is missing: ${TARBALL_VERSION_KEY}`,
    };
  }

  // check formatting requirements
  // validation schema per https://git.source.akamai.com/projects/EDGEWORKERS/repos/portal-ew-validation/browse/src/main/resources/manifest-schema.json
  // edgeworker-version should be a string matching "^(?!.*?\\.{2})[.a-zA-Z0-9_~-]{1,32}$"
  if (
    typeof tarballVersion !== 'string' ||
    !/^(?!.*?\\.{2})[.a-zA-Z0-9_~-]{1,32}$/.test(tarballVersion)
  ) {
    return {
      isValid: false,
      version: undefined,
      error_reason: `ERROR: Format for field '${TARBALL_VERSION_KEY}' is invalid`,
    };
  }
  // Only validate bundle-version if provided as it is optional
  if (manifestFormat) {
    // bundle-version should be an integer >=1
    if (!Number.isInteger(manifestFormat) || manifestFormat < 1) {
      return {
        isValid: false,
        version: undefined,
        error_reason: `ERROR: Format for field '${BUNDLE_FORMAT_VERSION_KEY}' is invalid`,
      };
    }
  }
  // Only validate api-version if provided as it is optional
  if (jsAPIVersion) {
    // api-version should be a string matching "^[0-9.]*$"
    if (typeof jsAPIVersion !== 'string' || !/^[0-9.]*$/.test(jsAPIVersion)) {
      return {
        isValid: false,
        version: undefined,
        error_reason: `ERROR: Format for field '${JSAPI_VERSION_KEY}' is invalid`,
      };
    }
  }

  return {
    isValid: true,
    version: tarballVersion,
    error_reason: '',
  };
}

export function determineTarballDownloadDir(
  ewId: string,
  rawDownloadPath: string
) {
  // If download path option provided, try to use it
  // If not provided, default to CLI cache directory under <CLI_CACHE_PATH>/edgeworkers-cli/edgeworkers/<ewid>/
  const downloadPath = rawDownloadPath
    ? untildify(rawDownloadPath)
    : createEdgeWorkerIdDir(ewId);

  // Regardless of what was picked, make sure it exists - if it doesnt, attempt to create it
  // Add try/catch logic incase user doesnt have permissions to write directories needed
  try {
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }
  } catch (e) {
    cliUtils.logAndExit(
      1,
      `ERROR: Cannot create ${downloadPath}\n${e.message}`
    );
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
    if (fs.lstatSync(jsonOutputPath).isDirectory()) {
      //leave path alone, but set filename to default
      jsonOutputFilename = jsonOutputParams.jsonOutputFilename;
    } else {
      jsonOutputFilename = path.basename(jsonOutputParams.jsonOutputPath);
      jsonOutputPath = path.dirname(jsonOutputParams.jsonOutputPath);
    }
  } else {
    // if path doesnt exist and its not the default path, break custom path into directory and path
    if (jsonOutputPath != EDGEWORKERS_CLI_OUTPUT_DIR) {
      // if path ends with slash, assume user wants it to be a directory, not a filename
      if (jsonOutputPath.endsWith('/')) {
        // leave path alone, but set filename to default
        jsonOutputFilename = jsonOutputParams.jsonOutputFilename;
      } else {
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
  } catch (e) {
    cliUtils.logAndExit(
      1,
      `ERROR: Cannot create ${jsonOutputPath}\n${e.message}`
    );
  }

  return {
    path: jsonOutputPath,
    filename: jsonOutputFilename,
  };
}

export function writeJSONOutput(exitCode: number, msg: string, data = {}) {
  // First, build the JSON object
  let outputMsg: string;
  let outputData;

  // Check if msg is already JSON - which would happen if OPEN API response failed for some reason
  if (cliUtils.isJSON(msg)) {
    outputMsg = 'An OPEN API error has occurred!';
    outputData = [JSON.parse(msg)];
  } else {
    outputMsg = msg;
    outputData = data;
  }

  const output = {
    cliStatus: exitCode,
    msg: outputMsg,
    data: outputData,
  };

  const jsonResult = cliUtils.toJsonPretty(output);

  // Check if we should output JSON to stdout
  if (isJSONOutputStdout()) {
    console.log(jsonResult);
  }

  if (isJSONOutputFile()) {
    // Determine the path and filename to write the JSON output
    const outputDestination = determineJSONOutputPathAndFilename();
    // Last, try to write the output file synchronously
    try {
      // support writing to both file and stdout; if stdout is on, don't leave a log message
      if (!isJSONOutputStdout()) {
        console.log(`Saving JSON output at: ${path.join(outputDestination.path, outputDestination.filename)}`);
      }
      fs.writeFileSync(
        path.join(outputDestination.path, outputDestination.filename),
        jsonResult
      );
    } catch (e) {
      // unset JSON mode since we cant write the file before writing out error
      setJSONOutputMode(false);
      cliUtils.logAndExit(1, `ERROR: Cannot create JSON output \n${e.message}`);
    }
  }
}
