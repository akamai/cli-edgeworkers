import * as os from 'os';
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

export const ekvJsonOutput = new JsonHandler(
  EDGEKV_CLI_OUTPUT_DIR,
  EDGEKV_CLI_OUTPUT_FILENAME
);
