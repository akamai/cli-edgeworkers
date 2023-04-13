import untildify from 'untildify';
import path from 'path';
import fs from 'fs';
import ini from 'ini';
import * as os from 'os';
import * as cliUtils from './cli-utils';

const configParams = {
  section: process.env.AKAMAI_EDGE_CLI_CONFIG_SECTION || 'default',
  path: process.env.AKAMAI_EDGE_CLI_CONFIG || path.resolve(os.homedir(), '.akamai-cli/ew-config'),
};

export const Operations = {
  List: 'list',
  Get: 'get',
  Set: 'set',
  Unset: 'unset',
  Save: 'save'
};

export class Config {
  path: string;
  section: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;

  constructor(path: string, section: string) {
    this.path = untildify(path);
    this.section = section;

    // create a config file if it doesn't exist
    try {
      if (!fs.existsSync(this.path)) {
        fs.writeFileSync(this.path, '');
      }
      this.config = ini.parse(fs.readFileSync(this.path, 'utf8'));
    } catch (e) {
      // When fail to write or read the config file, treat it as an empty config file
      console.error(`File path not found: ${this.path}`);
      this.config = {};
    }

    // initialize the section if not exist
    if (!(this.section in this.config)) {
      this.config[this.section] = {};
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  save(context: any=null) {
    try {
      if (context) {
        const context_json = JSON.parse(JSON.stringify(context));
        Object.keys(context_json).forEach(key => {
          this.config[this.section][key] = context_json[key];
        });
      }

      fs.writeFileSync(this.path, ini.stringify(this.config, {}));
    } catch(e) {
      console.error(`Failed to save context: ${e.message}`);
    }
  }

  values() {
    return JSON.stringify(this.config[this.section]);
  }

  getValue(key: string) {
    return this.config[this.section][key];
  }

  setValue(key: string, value: string) {
    this.config[this.section][key] = value;
  }

  unsetValue(key: string) {
    delete this.config[this.section][key];
  }
}

export function getEdgeCliConfig(section='') {
  try {
    if (section && section !== configParams.section) {
      configParams.section = section;
    }
    return new Config(untildify(configParams.path), configParams.section);
  } catch (e) {
    cliUtils.logAndExit(1, `ERROR: Could not open the config file ew-config, error: ${e.message}`);
  }
}

export function handleConfig(operation='', key='', value='') {
  const section = configParams.section;
  const edgeCliConfig = getEdgeCliConfig(section);

  try {
    switch (operation) {
      case Operations.List: {
        const msg = `The config [section: ${section}] is as follows:`;
        cliUtils.logWithBorder(msg);
        console.log(JSON.parse(edgeCliConfig.values()));
        break;
      }
      case Operations.Get: {
        const configValue = edgeCliConfig.getValue(key);
        const keyVal = `Config [section: ${section}]`;
        cliUtils.logWithBorder(keyVal);
        console.log(`${key} = ${configValue}`);
        break;
      }
      case Operations.Set:
        edgeCliConfig.setValue(key, value);
        edgeCliConfig.save();
        console.log('Set config property successfully.');
        break;
      case Operations.Unset:
        edgeCliConfig.unsetValue(key);
        edgeCliConfig.save();
        console.log('Unset config property successfully.');
        break;
      default:
        cliUtils.logAndExit(1, `Error: unknown operation '${operation}'`);
        break;
    }
  } catch (err) {
    cliUtils.logAndExit(1, err);
  }
}

export function saveConfig(properties: string[]) {
  const edgeCliConfig = getEdgeCliConfig(configParams.section);

  try {
    const context = {};
    properties.filter(item => item.includes('=')).forEach(item => {
      const property = item.split('=');
      if (property.length !== 2) {
        console.error(`Warning: cannot parse invalid item ['${item}'], skip it.`);
      } else {
        context[property[0].trim()] = property[1].trim();
      }
    });
    edgeCliConfig.save(context);
  } catch (err) {
    cliUtils.logAndExit(1, err);
  }
}

export function searchProperty(key: string) {
  const config = new Config(untildify(configParams.path), configParams.section);
  return config.getValue(key);
}

export function setConfigSection(section: string) {
  configParams.section = section;
}

export function getConfigSection() {
  return configParams.section;
}