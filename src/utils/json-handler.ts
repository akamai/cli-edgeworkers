import untildify from 'untildify';
import fs from 'fs';
import path from 'path';
import { logAndExit, isJSON, toJsonPretty } from '../utils/cli-utils';

export default class JsonHandler {
  jsonOutput: boolean;
  jsonOutputFile: boolean;
  jsonOutputStdout: boolean;
  jsonOutputPath: string;
  readonly jsonOutputDefaultFilename: string;

  constructor(jsonOutputPath: string, defaultOutputFilename: string) {
    this.jsonOutput = false;
    this.jsonOutputFile = false;
    this.jsonOutputStdout = false;
    this.jsonOutputPath = jsonOutputPath;
    this.jsonOutputDefaultFilename = defaultOutputFilename;
  }

  setJSONOutputMode(output: boolean) {
    this.jsonOutput = output;
  }

  setJSONOutputPath(path: string | null) {
    this.jsonOutputFile = true;
    if (typeof path === 'string') {
      this.jsonOutputPath = untildify(path);
    }
  }

  setJsonOutputFile(output: boolean) {
    this.jsonOutputFile = output;
  }

  setJSONOutputStdout(output: boolean) {
    this.jsonOutputStdout = output;
  }

  isJSONOutputMode() {
    return this.jsonOutput;
  }

  isJSONOutputStdout() {
    return this.jsonOutputStdout;
  }

  isJSONOutputFile() {
    return this.jsonOutputFile;
  }

  determineJSONOutputPathAndFilename(): Record<string, string> {
    // if the path exists, check if it is a directory
    const isPathExistingDirectory =
      fs.existsSync(this.jsonOutputPath) &&
      fs.lstatSync(this.jsonOutputPath).isDirectory();

    // if the path does not exist and ends with a slash, assume the user wants to create a new dir
    const isPathNewDirectory =
      !fs.existsSync(this.jsonOutputPath) && this.jsonOutputPath.endsWith('/');

    const isPathDirectory = isPathExistingDirectory || isPathNewDirectory;

    let outputDirectory: string;
    let outputFilename: string;

    if (isPathDirectory) {
      // use provided directory and default filename
      outputDirectory = this.jsonOutputPath;
      outputFilename = this.jsonOutputDefaultFilename;
    } else {
      // get filename and directory from provided path
      outputDirectory = path.dirname(this.jsonOutputPath);
      outputFilename = path.basename(this.jsonOutputPath);
    }

    // try to create path if it does not exist
    try {
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
      }
    } catch (e) {
      this.setJSONOutputMode(false);
      logAndExit(1, `ERROR: Cannot create ${outputDirectory}\n${e.message}`);
    }

    return {
      path: outputDirectory,
      filename: outputFilename,
    };
  }

  writeJSONOutput(exitCode: number, msg: string, data = {}): void {
    // First, build the JSON object
    let outputMsg: string;
    let outputData;

    // Check if msg is already JSON - which would happen if OPEN API response failed for some reason
    if (isJSON(msg)) {
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

    const jsonResult = toJsonPretty(output);

    // Check if we should output JSON to stdout
    if (this.isJSONOutputStdout()) {
      console.log(jsonResult);
    }

    if (this.isJSONOutputFile()) {
      // Determine the path and filename to write the JSON output
      const outputDestination = this.determineJSONOutputPathAndFilename();
      // Try to write the output file synchronously
      try {
        // Support writing to both file and stdout
        // If stdout is on, don't leave a log message
        if (!this.isJSONOutputStdout()) {
          console.log(
            `Saving JSON output at: ${path.join(
              outputDestination.path,
              outputDestination.filename
            )}`
          );
        }
        fs.writeFileSync(
          path.join(outputDestination.path, outputDestination.filename),
          jsonResult
        );
      } catch (e) {
        this.setJSONOutputMode(false);
        logAndExit(1, `ERROR: Cannot create JSON output \n${e.message}`);
      }
    }
  }
}
