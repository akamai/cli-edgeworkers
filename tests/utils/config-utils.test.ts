// Stub out fs before other imports
const existsSyncStub = jest.fn();

import * as os from 'os';
import path from 'path';
// set the environment variables before importing config-utils
const originalEnv = process.env;
const testConfigFile = '.testEdgeCliConfig';
process.env = {
  ...originalEnv,
  AKAMAI_EDGE_CLI_CONFIG: path.resolve(os.homedir(), testConfigFile),
};

import * as cliUtils from '../../src/utils/cli-utils';
import * as configUtils from '../../src/utils/config-utils';
import fs from 'fs';
import ini from 'ini';

jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');

  return {
    __esModule: false,
    ...originalModule,
    existsSync: existsSyncStub
  };
});

const logAndExitSpy = jest
  .spyOn(cliUtils, 'logAndExit')
  .mockImplementation(() => null);

const logWithBorderSpy = jest
  .spyOn(cliUtils, 'logWithBorder')
  .mockImplementation(() => null);

const logSpy = jest
  .spyOn(console, 'log')
  .mockImplementation(() => null);

describe('config utils tests', () => {

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEdgeCliConfig', () => {
    const expectedPath = path.resolve(os.homedir(), testConfigFile);
    const accountId = 'testAccountId';
    const newAccountId = 'newTestAccountId';
    const defaultSection = 'default';
    const advancedSection = 'advanced';

    beforeEach(() => {
      // Create a config file
      fs.writeFileSync(expectedPath, '');
    });

    afterEach(() => {
      // Remove the config file
      fs.unlinkSync(expectedPath);
    });

    it('should return config if the path and file already exist', () => {
      existsSyncStub.mockReturnValue(true);

      const edgeCliConfig = configUtils.getEdgeCliConfig();

      expect(edgeCliConfig?.path).toEqual(expectedPath);
      expect(edgeCliConfig?.section).toEqual(defaultSection);
    });

    it('should save the provided context successfully', () => {
      existsSyncStub.mockReturnValue(true);

      const edgeCliConfig = configUtils.getEdgeCliConfig();
      const context = { accountKey: accountId, section: advancedSection };
      edgeCliConfig?.save(context);

      expect(edgeCliConfig?.values()).toEqual(JSON.stringify(context));
    });

    it('should set value successfully if the key does not exist', () => {
      const context = { accountKey: accountId, section: advancedSection };
      const newValue = 'newValue';
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      existsSyncStub.mockReturnValue(true);

      const edgeCliConfig = configUtils.getEdgeCliConfig();
      edgeCliConfig?.setValue('newKey', newValue);
      edgeCliConfig?.save();

      expect(edgeCliConfig?.getValue('newKey')).toEqual(newValue);
    });

    it('should update value successfully if the key exists', () => {
      const context = { accountKey: accountId, section: advancedSection };
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      existsSyncStub.mockReturnValue(true);

      const edgeCliConfig = configUtils.getEdgeCliConfig();
      edgeCliConfig?.setValue('accountKey', newAccountId);
      edgeCliConfig?.save();

      expect(edgeCliConfig?.getValue('accountKey')).toEqual(newAccountId);
    });

    it('should get value successfully if the key exists', () => {
      const context = { accountKey: accountId, section: advancedSection };
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      existsSyncStub.mockReturnValue(true);

      const edgeCliConfig = configUtils.getEdgeCliConfig();
      expect(edgeCliConfig?.getValue('accountKey')).toEqual(accountId);
      expect(edgeCliConfig?.getValue('section')).toEqual(advancedSection);
    });

    it('should not get value if the key does not exist', () => {
      const context = { };
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      existsSyncStub.mockReturnValue(true);

      try {
        const edgeCliConfig = configUtils.getEdgeCliConfig();
        expect(edgeCliConfig?.getValue('accountKey')).toBeUndefined();
      } catch (e) {
        expect(e).toBe(TypeError);
        expect(e.message).toContainEqual('TypeError: Cannot read properties of undefined');
      }
    });

    it('should unset value successfully', () => {
      const context = { accountKey: accountId, section: advancedSection };
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      existsSyncStub.mockReturnValue(true);

      const edgeCliConfig = configUtils.getEdgeCliConfig();
      edgeCliConfig?.unsetValue('accountKey');
      edgeCliConfig?.unsetValue('nonExistKey');

      const config_string = edgeCliConfig ? edgeCliConfig.values() : '';
      expect('accountKey' in JSON.parse(config_string)).toEqual(false);
      expect('nonExistKey' in JSON.parse(config_string)).toEqual(false);
    });
  });

  describe('handleConfig', () => {
    const expectedPath = path.resolve(os.homedir(), testConfigFile);
    const defaultSection = 'default';
    const key = 'testKey';
    const value = 'testValue';
    const newValue = 'newTestValue';

    beforeEach(() => {
      // Create a config file
      fs.writeFileSync(expectedPath, '');
    });

    afterEach(() => {
      // Remove the config file
      fs.unlinkSync(expectedPath);
    });

    it('should list config successfully', () => {
      configUtils.handleConfig('list');
      expect(logWithBorderSpy).toHaveBeenCalledWith(
        `The config [section: ${defaultSection}] is as follows:`
      );
      expect(logSpy).toHaveBeenCalledWith({});
    });

    it('should get config successfully', () => {
      const context = { testKey: value };
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      configUtils.handleConfig('get', key);
      expect(logWithBorderSpy).toHaveBeenCalledWith(
        `Config [section: ${defaultSection}]`
      );
      expect(logSpy).toHaveBeenCalledWith(`${key} = ${value}`);
    });

    it('should set new config successfully', () => {
      configUtils.handleConfig('set', key, value);
      expect(logSpy).toHaveBeenCalledWith(
        'Set config property successfully.'
      );

      configUtils.handleConfig('get', key);
      expect(logWithBorderSpy).toHaveBeenCalledWith(
        `Config [section: ${defaultSection}]`
      );
      expect(logSpy).toHaveBeenCalledWith(`${key} = ${value}`);
    });

    it('should update existing config successfully', () => {
      const context = { testKey: value };
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      configUtils.handleConfig('set', key, newValue);
      expect(logSpy).toHaveBeenCalledWith(
        'Set config property successfully.'
      );

      configUtils.handleConfig('get', key);
      expect(logWithBorderSpy).toHaveBeenCalledWith(
        `Config [section: ${defaultSection}]`
      );
      expect(logSpy).toHaveBeenCalledWith(`${key} = ${newValue}`);
    });

    it('should unset config successfully', () => {
      const context = { testKey: value };
      fs.writeFileSync(expectedPath, ini.stringify(context, {section: defaultSection}));

      configUtils.handleConfig('unset', key);
      expect(logSpy).toHaveBeenCalledWith(
        'Unset config property successfully.'
      );

      configUtils.handleConfig('get', key);
      expect(logWithBorderSpy).toHaveBeenCalledWith(
        `Config [section: ${defaultSection}]`
      );
      expect(logSpy).toHaveBeenCalledWith(`${key} = undefined`);
    });

    it('should log and exist with an error when the operation is unkown', () => {
      const op = 'unkown';
      configUtils.handleConfig(op);
      expect(logAndExitSpy).toHaveBeenCalledWith(
        1,
        `Error: unknown operation '${op}'`
      );
    });
  });

  describe('saveConfig', () => {
    const expectedPath = path.resolve(os.homedir(), testConfigFile);
    const defaultSection = 'default';

    beforeEach(() => {
      // Create a config file
      fs.writeFileSync(expectedPath, '');
    });

    afterEach(() => {
      // Remove the config file
      fs.unlinkSync(expectedPath);
    });

    it('should save the correct context successfully', () => {
      const configs = ['key1=value1', 'key2=value2', 'key3=value3', 'key4=value4'];
      configUtils.saveConfig(configs);
      configUtils.handleConfig('list');
      expect(logSpy).toHaveBeenCalledWith(
        {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
          key4: 'value4'
        }
      );
    });

    it('should save the correct context successfully', () => {
      const configs = ['key1=value1', 'key2=value2', 'key3:value3', 'key4=value4'];
      configUtils.saveConfig(configs);
      configUtils.handleConfig('list', defaultSection);
      expect(logSpy).toHaveBeenCalledWith(
        {
          key1: 'value1',
          key2: 'value2',
          key4: 'value4'
        }
      );
    });
  });

  describe('searchProperty', () => {
    const expectedPath = path.resolve(os.homedir(), testConfigFile);

    beforeEach(() => {
      // Create a config file
      fs.writeFileSync(expectedPath, '');
    });

    afterEach(() => {
      // Remove the config file
      fs.unlinkSync(expectedPath);
    });

    it('should get property successfully', () => {
      const configs = ['key1=value1'];
      configUtils.saveConfig(configs);
      const value = configUtils.searchProperty('key1');
      const value2 = configUtils.searchProperty('key2');
      expect(value).toEqual('value1');
      expect(value2).toBeUndefined();
    });
  });

  describe('setConfigSection', () => {
    const defaultSection = 'default';
    const anotherSection = 'another';

    it('should return `default` section by default', () => {
      const section = configUtils.getConfigSection();
      expect(section).toEqual(defaultSection);
    });

    it('should set the config section successfully', () => {
      configUtils.setConfigSection(anotherSection);
      const section = configUtils.getConfigSection();
      expect(section).toEqual(anotherSection);
    });
  });
});