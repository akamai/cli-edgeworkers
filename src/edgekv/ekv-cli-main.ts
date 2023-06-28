#!/usr/bin/env node
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as configUtils from '../utils/config-utils';
import {
  ORDER_BY,
  MAX_ITEMS,
  GROUP_ID,
  RETENTION,
  GEO_LOCATION,
  STAGING,
  PRODUCTION,
  EW_IDS,
  EXPIRY,
  NAMESPACE,
  SAVE_PATH } from './../utils/constants';
import { SANDBOX_ID } from '../utils/constants';
import * as kvCliHandler from './ekv-handler';
import { ekvJsonOutput } from './client-manager';
import * as httpEdge from '../cli-httpRequest';
import * as pkginfo from '../../package.json';
import { Command } from 'commander';

const program = new Command();
const currentYear = new Date().getFullYear();
const copywrite =
  '\nCopyright (c) 2019-' + currentYear + ' Akamai Technologies, Inc. Licensed under Apache 2 license.\nYour use of Akamai\'s products and services is subject to the terms and provisions outlined in Akamai\'s legal policies.\nVisit http://github.com/akamai/cli-edgeworkers for detailed documentation';
program
  .version(pkginfo.version)
  .description(pkginfo.description)
  .option('--debug', 'Show debug information.')
  .option('--edgerc <path>', 'Use edgerc file for authentication.')
  .option(
    '--section <name>',
    'Use this section in edgerc file that contains the credential set.'
  )
  .option('--configSection <configSection>', 'Use this section in ew-config file that contains the default config properties set.')
  .option('--json [path]', 'Write command output to JSON file at given path, otherwise written to CLI cache directory')
  .option('--jsonout', 'Write command output as JSON to stdout')
  // .option('--json [path]', 'Write command output to JSON file at given path, otherwise written to CLI cache directory')
  .option('--accountkey <account-id>', 'internal parameter')
  .option('--timeout <timeout>', 'Use this for custom timeout')
  .on('option:debug', function () {
    envUtils.setDebugMode(true);
  })
  .on('option:edgerc', function (edgeRcFilePath) {
    envUtils.setEdgeRcFilePath(edgeRcFilePath);
  })
  .on('option:section', function (section) {
    envUtils.setEdgeRcSection(section);
  })
  .on('option:configSection', function (configSection) {
    configUtils.setConfigSection(configSection);
  })
  .on('option:json', function (path) {
    ekvJsonOutput.setJSONOutputMode(true);
    ekvJsonOutput.setJSONOutputPath(path);
  })
  .on('option:jsonout', function () {
    ekvJsonOutput.setJSONOutputMode(true);
    ekvJsonOutput.setJSONOutputStdout(true);
  })
  .on('option:accountkey', function (key) {
    httpEdge.setAccountKey(key);
  })
  .on('option:timeout', function (timeout) {
    envUtils.setTimeout(timeout);
  })
  // this fires only when a command is not listed below with a custom action
  .on('command:*', function (command) {
    const firstCommand = command[0];
    if (!this.commands.find((c) => c._name == firstCommand)) {
      cliUtils.logAndExit(
        1,
        `Invalid command: ${program.args.join(
          ' '
        )}\nSee --help for a list of available commands.`
      );
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

  const helper = program.createHelp();
  program.configureHelp({
    optionDescription: () => '',
    optionTerm: (cmd) =>
      helper.optionTerm(cmd) + '\n\t' + helper.optionDescription(cmd),

    subcommandDescription: () => '' ,
    subcommandTerm: (cmd) =>
      helper.subcommandTerm(cmd) + '\n\t' + helper.subcommandDescription(cmd),
  });

program
  .command('help [command]')
  .description('Displays help information for the given command')
  .action(function (arg) {
    if (!arg) {
      program.outputHelp();
      cliUtils.logAndExit(0, copywrite);
    } else {
      const command = program.commands.find((c) => c.name() == arg)
        ? program.commands.find((c) => c.name() == arg)
        : program.commands.find((c) => c.aliases()[0] == arg);
      if (!command) {
        cliUtils.logAndExit(1, `ERROR: Could not find a command for ${arg}`);
      } else {
        command.outputHelp();
      }
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('initialize')
  .description('Initialize EdgeKV for the first time')
  .requiredOption(
    '--dataAccessPolicy <database_data_access_policy>',
    '`dataAccessPolicy` option must be of the form `restrictDataAccess=<bool>,allowNamespacePolicyOverride=<bool>` where <bool> can be true or false.'
  )
  .alias('init')
  .action(async function (options) {
    try {
      await kvCliHandler.initializeEdgeKv(options['dataAccessPolicy']);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command(
    'write <itemType> <environment> <namespace> <groupId> <itemId> <items>'
  )
  .description('Write an item to an EdgeKV Namespace')
  .option(
    '--sandboxId <sandboxId>',
    '`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.'
  )
  .action(async function (
    itemType,
    environment,
    namespace,
    groupId,
    itemId,
    items,
    options
  ) {
    options['sandboxId'] = options.sandboxId || configUtils.searchProperty(SANDBOX_ID);

    try {
      await kvCliHandler.writeItemToEdgeKV(
        environment,
        namespace,
        groupId,
        itemId,
        items,
        itemType,
        options.sandboxId
      );
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

/* ========== The following are created as sub commands since commander does not support space  ========== */

const read = program
  .command('read')
  .description('Read an item from an EdgeKV Namespace');

read
  .command('item <environment> <namespace> <groupId> <itemId>')
  .description('Read an item from an EdgeKV Namespace')
  .option(
    '--sandboxId <sandboxId>',
    '`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.'
  )
  .action(async function (environment, namespace, groupId, itemId, options) {
    options['sandboxId'] = options.sandboxId || configUtils.searchProperty(SANDBOX_ID);

    try {
      await kvCliHandler.readItemFromEdgeKV(
        environment,
        namespace,
        groupId,
        itemId,
        options.sandboxId
      );
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const del = program
  .command('delete')
  .alias('del')
  .description('Delete an item from an EdgeKV Namespace');

del
  .command('item <environment> <namespace> <groupId> <itemId>')
  .description('Delete an item from an EdgeKV Namespace')
  .option(
    '--sandboxId <sandboxId>',
    '`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.'
  )
  .action(async function (environment, namespace, groupId, itemId, options) {
    options['sandboxId'] = options.sandboxId || configUtils.searchProperty(SANDBOX_ID);

    try {
      await kvCliHandler.deleteItemFromEdgeKV(
        environment,
        namespace,
        groupId,
        itemId,
        options.sandboxId
      );
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const list = program
  .command('list')
  .alias('l')
  .description(
    'List all the namespaces or the data groups for a given namespace in an Akamai environment'
  );

list
  .command('ns <environment>')
  .option(
    '-d, --details',
    'Setting this option will provide the namespace details'
  )
  .option(
    '--order-by <columnName>',
    'Specify the column to order the list of namespaces by'
  )
  .option(
    '--asc, --ascending',
    'Set the sort direction to ascending order'
  )
  .option(
    '--desc, --descending',
    'Set the sort direction to descending order'
  )
  .description('List all namespaces')
  .action(async function (environment, options) {
    options['orderBy'] = options.orderBy || configUtils.searchProperty(ORDER_BY);

    let sortDirection: cliUtils.sortDirections, orderBy: string;

    if (options.ascending && options.descending) {
      cliUtils.logAndExit(1, 'ERROR: Cannot set both ascending and descending sort together.');
    } else if (options.descending) {
      sortDirection = cliUtils.sortDirections.DESC;
    } else {
      sortDirection = cliUtils.sortDirections.ASC;
    }

    // map sort column to object properties
    if (options.orderBy) {
      if (!options.details){
        cliUtils.logAndExit(1, 'ERROR: Cannot use order-by without using detailed list.');
      }
      switch(options.orderBy.toLowerCase()){
        case 'namespaceid':
        case 'namespace':
          orderBy = 'namespace';
          break;
        case 'retentionperiod':
        case 'retention':
          orderBy = 'retentionInSeconds';
          break;
        case 'geolocation':
          orderBy = 'geoLocation';
          break;
        case 'accessgroupid':
        case 'groupid':
          orderBy = 'groupId';
          break;
        default:
          cliUtils.logAndExit(1, `ERROR: Column ${options.orderBy} is not a valid column name.`);
          break;
      }
    } else {
      orderBy = 'namespace';
    }

    try {
      await kvCliHandler.listNameSpaces(environment, options.details, sortDirection, orderBy);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

list
  .command('groups <environment> <namespace>')
  .description(
    'List the data groups for a given namespace in an Akamai environment.'
  )
  .action(async function (environment, namespace) {
    try {
      await kvCliHandler.listGroups(environment, namespace);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

list
  .command('items <environment> <namespace> <groupId>')
  .option(
    '--maxItems <maxItems>',
    'Maximum number of items to return per request'
  )
  .option(
    '--sandboxId <sandboxId>',
    '`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.'
  )
  .description('List items within a group')
  .action(async function (environment, namespace, groupId, options) {
    options['maxItems'] = options.maxItems || configUtils.searchProperty(MAX_ITEMS);
    options['sandboxId'] = options.sandboxId || configUtils.searchProperty(SANDBOX_ID);

    try {
      await kvCliHandler.listItemsFromGroup(
        environment,
        namespace,
        groupId,
        options.maxItems,
        options.sandboxId
      );
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

list
  .command('tokens')
  .option('--include-expired', 'Returns expired tokens in the response')
  .description('List all tokens for which the user has permission to download')
  .action(async function (options) {
    try {
      await kvCliHandler.listTokens(options.includeExpired);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

list
  .command('auth-groups')
  .option(
    '--groupIds <groupIds>',
    'Lists the EdgeKV access capabilities for the specified permission groups'
  )
  .option(
    '-incewg, --include_ew_groups',
    'Returns expired tokens in the response'
  )
  .description('List group identifiers created when writing items to a namespace')
  .action(async function (options) {
    options['groupId'] = options.groupdId || configUtils.searchProperty(GROUP_ID);

    try {
      await kvCliHandler.listAuthGroups(options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const create = program
  .command('create')
  .description('Creates a namespace or creates a token')
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

create
  .command('ns <environment> <namespace>')
  .requiredOption(
    '--retention <retention>',
    'Retention period of the namespace in days'
  )
  .option('--groupId <groupId>', 'Authentication Group Identifier')
  .option(
    '--geoLocation <geolocation>',
    'Specifies the persistent storage location for data when creating a namespace on the production network. This can help optimize performance by storing data where most or all of your users are located. The value defaults to `US` on the `STAGING` and `PRODUCTION` networks.'
  )
  .description('Creates an EdgeKV namespace')
  .action(async function (environment, namespace, options) {
    options['retention'] = options.retention || configUtils.searchProperty(RETENTION);
    options['groupId'] = options.groupId || configUtils.searchProperty(GROUP_ID);
    options['geolocation'] = options.geolocation || configUtils.searchProperty(GEO_LOCATION);

    try {
      await kvCliHandler.createNamespace(
        environment,
        namespace,
        options.retention,
        options.groupId,
        options.geoLocation
      );
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

create
  .command('token <tokenName>')
  .description('Creates an EdgeKV token')
  .alias('tkn')
  .option(
    '--staging <staging>',
    'Specifies whether the token will be allowed or denied in the staging environment. Values: "allow", "deny" (REQUIRED)'
  )
  .option(
    '--production <production>',
    'Specifies whether the token will be allowed or denied in the production environment. Values: "allow", "deny" (REQUIRED)'
  )
  .option(
    '--ewids <ewIds>',
    'A comma separated list of up to a maximum of 8 EdgeWorker IDs. Use "all" to allow all EdgeWorkers. (REQUIRED)'
  )
  .option(
    '--expiry <expiry>',
    'Expiration date of the token. Format of the expiry date is ISO 8601 format: yyyy-mm-dd. (REQUIRED)'
  )
  .option(
    '--namespace <namespace>',
    'A comma separated list of up to a maximum of 20 namespace identifier and permission combinations. Use the namespace name combined with "+rwd" (read, write, delete) to set permissions. Ex: "namespace1+rwd,namespace2+rw" (REQUIRED)'
  )
  .option(
    '--save_path <save_path>',
    'Path specifying where to save the edgekv_tokens.js token file.'
  )
  .option(
    '-o, --overwrite',
    'This option is used in conjunction with the --save_path option to overwrite the value of an existing token with the same name in the edgekv_tokens.js file.'
  )
  .action(async function (tokenName, options) {
    options['staging'] = options.staging || configUtils.searchProperty(STAGING);
    options['production'] = options.production || configUtils.searchProperty(PRODUCTION);
    options['ewIds'] = options.ewIds || configUtils.searchProperty(EW_IDS);
    options['expiry'] = options.expiry || configUtils.searchProperty(EXPIRY);
    options['namespace'] = options.namespace || configUtils.searchProperty(NAMESPACE);
    options['save_path'] = options.save_path || configUtils.searchProperty(SAVE_PATH);

    try {
      // implement our own option checking here since we want the help msg to appear
      // when no options are specified instead of a missing option error
      if (Object.keys(options).length === 0) {
        create.commands[1].help();
        cliUtils.logAndExit(0, copywrite);
      } else {
        const requiredOptions = [
          'staging',
          'production',
          'ewids',
          'expiry',
          'namespace',
        ];
        cliUtils.checkOptions(options, requiredOptions);

        if (options.staging == 'deny' && options.production == 'deny') {
          cliUtils.logAndExit(
            1,
            'ERROR: Unable to create token. At least one of the staging or production options must be set to "allow".'
          );
        }
        await kvCliHandler.createToken(tokenName, options);
      }
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const revoke = program.command('revoke')
  .description('Revoke an EdgeKV token');
revoke
  .command('token <tokenName>')
  .description('Revoke an EdgeKV token')
  .action(async function (tokenName) {
    try {
      await kvCliHandler.revokeToken(tokenName);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const modify = program.command('modify')
  .description('Modify EdgeKV namespace or permission group');
modify
  .command('ns <environment> <namespace>')
  .requiredOption(
    '--retention <retention>',
    'Retention period of the namespace in days'
  )
  .description('Modify an EdgeKV namespace')
  .action(async function (environment, namespace, options) {
    options['retention'] = options.retention || configUtils.searchProperty(RETENTION);

    try {
      await kvCliHandler.updateNameSpace(environment, namespace, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

modify
  .command('auth-group <namespaceId> <groupId>')
  .description('Modify the permissions group associated with the namespace')
  .action(async function (namespaceId, groupId) {
    try {
      await kvCliHandler.modifyAuthGroupPermission(namespaceId, groupId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

modify
  .command('db')
  .requiredOption(
    '--dataAccessPolicy <database_data_access_policy>',
    '`dataAccessPolicy` option must be of the form `restrictDataAccess=<bool>,allowNamespacePolicyOverride=<bool>` where <bool> can be true or false.'
  )
  .description('Modify the database data access policy')
  .action(async function (options) {
    try {
      await kvCliHandler.updateDatabase(options['dataAccessPolicy']);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const download = program
  .command('download')
  .alias('dnld')
  .description('Download an EdgeKV token');

download
  .command('token <tokenName>')
  .description('Download an EdgeKV token')
  .option(
    '--save_path <save_path>',
    'The path of the bundle where the token will be saved'
  )
  .option(
    '-o, --overwrite',
    'EdgeKV token placed inside the bundle will be overwritten'
  )
  .action(async function (tokenName, options) {
    options['save_path'] = options.save_path || configUtils.searchProperty(SAVE_PATH);

    try {
      await kvCliHandler.retrieveToken(tokenName, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const show = program
  .command('show')
  .description('Check the initialization status of the EdgeKV or Retrieve an EdgeKV namespace');
show
  .command('status')
  .description('Check the EdgeKV initialization status')
  .action(async function () {
    try {
      await kvCliHandler.getInitializationStatus();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

show
  .command('ns <environment> <namespace>')
  .description('Retrieves an EdgeKV namespace')
  .action(async function (environment, namespace) {
    try {
      await kvCliHandler.getNameSpace(environment, namespace);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

const config = program
  .command('config')
  .description('Set default values to CLI in a config file.');

config
  .command('list')
  .description('Get all values in the config file.')
  .action(async function () {
    configUtils.handleConfig(configUtils.Operations.List);
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

config
  .command('get <key>')
  .description('Get a config value from a section in the config file.')
  .action(async function (key: string) {
    configUtils.handleConfig(configUtils.Operations.Get, key);
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

config
  .command('set <key> <value>')
  .description('Set a config value in a section.')
  .action(async function (key: string, value: string) {
    configUtils.handleConfig(configUtils.Operations.Set, key, value);
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

config
  .command('save')
  .description('Save config properties in a section.')
  .requiredOption('-p, --properties <properties...>', 'Save config properties in bulk. Use format \'key=value\' to set a property and white space to split them.')
  .action(async function (options) {
    configUtils.saveConfig(options.properties);
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

config
  .command('unset <key>')
  .description('Unset a config value in a section.')
  .action(async function (key: string) {
    configUtils.handleConfig(configUtils.Operations.Unset, key);
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program.parse(process.argv);

if (envUtils.getNodeVersion() < 7) {
  cliUtils.logAndExit(
    1,
    'ERROR: The Akamai EdgeWorkers CLI requires Node 7.0.0 or newer.'
  );
}
