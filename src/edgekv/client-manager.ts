import * as cliUtils from '../utils/cli-utils';
import * as os from 'os';
import fs from 'fs';
import path from 'path';
import JsonHandler from '../utils/json-handler';

const CLI_CACHE_PATH: string =
  process.env.AKAMAI_CLI_CACHE_DIR ||
  process.env.AKAMAI_CLI_CACHE_PATH ||
  path.resolve(os.homedir(), '.akamai-cli/cache');

const EDGEKV_CLI_HOME: string = path.join(CLI_CACHE_PATH, '/edgekv-cli/');
const EDGEKV_DIR: string = path.join(EDGEKV_CLI_HOME, '/edgekv/');
const EDGEKV_CLI_OUTPUT_DIR: string = path.join(
  EDGEKV_DIR,
  `/cli-output/${Date.now()}/`
);

const EDGEKV_CLI_OUTPUT_FILENAME = 'ekvcli_output.json';
// Add try/catch logic incase user doesnt have permissions to write directories needed
try {
  if (!fs.existsSync(EDGEKV_DIR)) {
    fs.mkdirSync(EDGEKV_DIR, { recursive: true });
  }
} catch (e) {
  cliUtils.logAndExit(
    1,
    `ERROR: Cannot create ${EDGEKV_DIR}\n${e.message}`
  );
}

export const ekvJsonOutput = new JsonHandler(
  EDGEKV_CLI_OUTPUT_DIR,
  EDGEKV_CLI_OUTPUT_FILENAME
);
