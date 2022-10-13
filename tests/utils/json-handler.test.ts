// Stub out fs before other imports
const existsSyncStub = jest.fn();
const mkdirSyncStub = jest.fn();
const writeFileSyncStub = jest.fn();
const isDirectoryStub = jest.fn();

jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');

  return {
    __esModule: false,
    ...originalModule,
    existsSync: existsSyncStub,
    lstatSync: () => ({
      isDirectory: isDirectoryStub,
    }),
    mkdirSync: mkdirSyncStub,
    writeFileSync: writeFileSyncStub,
  };
});
import fs from 'fs';

// Other imports
import * as cliUtils from '../../src/utils/cli-utils';
import JsonHandler from '../../src/utils/json-handler';

const logAndExitSpy = jest
  .spyOn(cliUtils, 'logAndExit')
  .mockImplementation(() => null);

describe('json handler tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('determineJSONOutputPathAndFilename', () => {
    it('should return the path and filename if the dir already exists', () => {
      const outputPath = 'existingPath';
      const outputFilename = 'filename.json';

      existsSyncStub.mockReturnValue(true);
      isDirectoryStub.mockReturnValue(true);

      const jsonHandler = new JsonHandler(outputPath, outputFilename);
      const res = jsonHandler.determineJSONOutputPathAndFilename();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(res).toEqual({ path: outputPath, filename: outputFilename });
    });

    it('should return the path and filename and create the dir if it does not exist', () => {
      const outputPath = 'newPath/';
      const outputFilename = 'filename.json';

      existsSyncStub.mockReturnValue(false);
      isDirectoryStub.mockReturnValue(false);

      const jsonHandler = new JsonHandler(outputPath, outputFilename);
      const res = jsonHandler.determineJSONOutputPathAndFilename();

      expect(fs.mkdirSync).toHaveBeenCalledWith('newPath/', {
        recursive: true,
      });
      expect(res).toEqual({ path: outputPath, filename: outputFilename });
    });

    it('should get the dir & filename from the path', () => {
      const outputPath = 'newPath/test.json';
      const outputFilename = 'filename.json';

      existsSyncStub.mockReturnValue(false);
      isDirectoryStub.mockReturnValue(false);

      const jsonHandler = new JsonHandler(outputPath, outputFilename);
      const res = jsonHandler.determineJSONOutputPathAndFilename();

      expect(fs.mkdirSync).toHaveBeenCalledWith('newPath', { recursive: true });
      expect(res).toEqual({ path: 'newPath', filename: 'test.json' });
    });

    it('should call logAndExit if something goes wrong when creating the directory', () => {
      const outputPath = 'newPath/test.json';
      const outputFilename = 'filename.json';
      const err = new Error('kaboom');

      existsSyncStub.mockReturnValue(false);
      isDirectoryStub.mockReturnValue(false);
      mkdirSyncStub.mockImplementation(() => {
        throw err;
      });

      const jsonHandler = new JsonHandler(outputPath, outputFilename);
      jsonHandler.determineJSONOutputPathAndFilename();

      expect(logAndExitSpy).toHaveBeenCalledWith(
        1,
        `ERROR: Cannot create newPath\n${err.message}`
      );
    });

    it('should call logAndExit if the path', () => {
      const outputPath = 'newPath/test.json';
      const outputFilename = 'filename.json';
      const err = new Error('kaboom');

      existsSyncStub.mockReturnValue(false);
      isDirectoryStub.mockReturnValue(false);
      mkdirSyncStub.mockImplementation(() => {
        throw err;
      });

      const jsonHandler = new JsonHandler(outputPath, outputFilename);
      jsonHandler.determineJSONOutputPathAndFilename();

      expect(logAndExitSpy).toHaveBeenCalledWith(
        1,
        `ERROR: Cannot create newPath\n${err.message}`
      );
    });
  });

  describe('writeJSONOutput', () => {
    const outputPath = 'path/';
    const outputFilename = 'filename.json';

    const exitCode = 0;
    const msg = 'some msg';
    const data = {
      key: 'value',
    };
    const output = {
      cliStatus: exitCode,
      msg,
      data,
    };
    const outputString = cliUtils.toJsonPretty(output);

    const logSpy = jest.spyOn(console, 'log');
    let jsonHandler: JsonHandler;

    beforeEach(() => {
      existsSyncStub.mockReturnValue(true);
      isDirectoryStub.mockReturnValue(true);

      jsonHandler = new JsonHandler(outputPath, outputFilename);
      jsonHandler.setJSONOutputMode(true);
    });

    it('should write the json to the file successfully', () => {
      jsonHandler.setJSONOutputPath(outputPath);
      jsonHandler.writeJSONOutput(exitCode, msg, data);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        `Saving JSON output at: ${outputPath}${outputFilename}`
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${outputPath}${outputFilename}`,
        outputString
      );
    });

    it('should output to stdout successfully', () => {
      jsonHandler.setJSONOutputStdout(true);
      jsonHandler.writeJSONOutput(exitCode, msg, data);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(outputString);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should write to BOTH file and stdout successfully', () => {
      jsonHandler.setJSONOutputPath(outputPath);
      jsonHandler.setJSONOutputStdout(true);
      jsonHandler.writeJSONOutput(exitCode, msg, data);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(outputString);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${outputPath}${outputFilename}`,
        outputString
      );
    });

    it('should call logAndExit if something goes wrong when writing to the file', async () => {
      const err = new Error('cant write');
      writeFileSyncStub.mockImplementation(() => {
        throw err;
      });

      jsonHandler.setJSONOutputPath(outputPath);
      jsonHandler.writeJSONOutput(exitCode, msg, data);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        `Saving JSON output at: ${outputPath}${outputFilename}`
      );
      expect(logAndExitSpy).toHaveBeenCalledWith(
        1,
        `ERROR: Cannot create JSON output \n${err.message}`
      );
    });
  });
});
