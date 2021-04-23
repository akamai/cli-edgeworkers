#!/usr/bin/env node
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as kvCliHandler from './ekv-handler';
import * as edgeWorkersClientSvc from '../edgeworkers/client-manager';
import * as httpEdge from '../cli-httpRequest';
import * as pkginfo from '../../package.json';
const commander = require('commander');
const program = new commander.Command();
const copywrite = '\nCopyright (c) 2019-2021 Akamai Technologies, Inc. Licensed under Apache 2 license.\nYour use of Akamai\'s products and services is subject to the terms and provisions outlined in Akamai\'s legal policies.\nVisit http://github.com/akamai/cli-edgeworkers for detailed documentation';
program
  .version(pkginfo.version)
  .description(pkginfo.description)
  .option('--debug', 'Show debug information.')
  .option('--edgerc <path>', 'Use edgerc file for authentication.')
  .option('--section <name>', 'Use this section in edgerc file that contains the credential set.')
  // .option('--json [path]', 'Write command output to JSON file at given path, otherwise written to CLI cache directory')
  .option('--accountkey <account-id>', 'internal parameter')
  .option('--timeout <timeout>', 'Use this for custom timeout')
  .on("option:debug", function () {
    envUtils.setDebugMode(true);
  })
  .on("option:edgerc", function (edgeRcFilePath) {
    envUtils.setEdgeRcFilePath(edgeRcFilePath);
  })
  .on("option:section", function (section) {
    envUtils.setEdgeRcSection(section);
  })
  .on("option:json", function (path) {
    edgeWorkersClientSvc.setJSONOutputMode(false); // set this to true when we enable json output mode
    edgeWorkersClientSvc.setJSONOutputPath(path);
  })
  .on("option:accountkey", function (key) {
    httpEdge.setAccountKey(key);
  })
  .on("option:timeout", function (timeout){
    httpEdge.setTimeout(timeout);
  })
  // this fires only when a command is not listed below with a custom action
  .on('command:*', function (command) {
    const firstCommand = command[0];
    if (!this.commands.find(c => c._name == firstCommand)) {
      cliUtils.logAndExit(1, `Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('help [command]')
  .description('Displays help information for the given command.')
  .action(function (arg) {
    if (!arg) {
      program.outputHelp();
      cliUtils.logAndExit(0, copywrite);
    }
    else {
      var command = (!!program.commands.find(c => c._name == arg)) ? program.commands.find(c => c._name == arg) : program.commands.find(c => c._aliases[0] == arg);
      if (!command) {
        cliUtils.logAndExit(1, `ERROR: Could not find a command for ${arg}`);
      }
      else {
        command.outputHelp();
      }
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });


program
  .command("initialize")
  .description("Initialize edgeKV for the first time")
  .alias("init")
  .action(async function () {
    try {
      await kvCliHandler.initializeEdgeKv();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

  program.command("write <itemType> <environment> <namespace> <groupId> <itemId> <items>")
  .description("Write an item to an EdgeKV Namespace")
  .action(async function (itemType, environment, namespace, groupId, itemId, items) {
    try {
      await kvCliHandler.writeItemToEdgeKV(environment, namespace, groupId, itemId, items, itemType);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

/* ========== The following are created as sub commands since commander does not support space  ========== */

const read = program.command('read')
  .description("Read an item from an EdgeKV Namespace");

read
  .command("item <environment> <namespace> <groupId> <itemId>")
  .description("Read an item from an EdgeKV Namespace")
  .action(async function (environment, namespace, groupId, itemId) {
    try {
      await kvCliHandler.readItemFromEdgeKV(environment, namespace, groupId, itemId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

const del = program.command('delete')
  .alias("del")
  .description("Delete an item from an EdgeKV Namespace");

del
  .command("item <environment> <namespace> <groupId> <itemId>")
  .description("Delete an item from an EdgeKV Namespace")
  .action(async function (environment, namespace, groupId, itemId) {
    try {
      await kvCliHandler.deleteItemFromEdgeKV(environment, namespace, groupId, itemId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });


const list = program.command('list')
  .alias("l")
  .description("List all the namespaces or list all items with in a group. Use list -h to see available options");

list
  .command("ns <environment>")
  .description("List all the namespaces")
  .action(async function (environment) {
    try {
      await kvCliHandler.listNameSpaces(environment);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

list
  .command("items <environment> <namespace> <groupId>")
  .description("List items with in a group")
  .action(async function (environment, namespace, groupId) {
    try {
      await kvCliHandler.listItemsFromGroup(environment, namespace, groupId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

list
  .command("tokens")
  .description("List all tokens for which the user has permission to download.")
  .action(async function () {
    try {
      await kvCliHandler.listTokens();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

const create = program.command('create')
  .description("Creates a namespace or creates a token")
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

create
  .command("ns <environment> <namespace>")
  .description("Creates an EdgeKV namespace")
  .action(async function (environment, namespace) {
    try {
      await kvCliHandler.createNamespace(environment, namespace);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

create
  .command("token <tokenName>")
  .description("Creates an edgekv token")
  .alias("tkn")
  .option('--save_path <save_path>', 'The path of the bundle where the token will be saved')
  .requiredOption("--staging <staging>", "Token can be used in staging environment if allowed")
  .requiredOption("--production <production>", "Token can be used in production environment if allowed")
  .requiredOption("--ewids <ewIds>", "All or specific ewids for which the token can be applied")
  .requiredOption("--expiry <expiry>", "Expiry date of the token in the format yyyy-mm-dd")
  .requiredOption("--namespace <namespace>", "Permissions for the namespaces")
  .option("-o, --overwrite", "EdgeKV token placed inside the bundle will be overwritten")
  .action(async function (tokenName, options) {
    try {
      await kvCliHandler.createToken(tokenName, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

const download = program.command('download')
  .alias("dnld")
  .description("Download an edgekv token");

download
  .command("token <tokenName>")
  .description("Download an edgekv token")
  .option('--save_path <save_path>', 'The path of the bundle where the token will be saved')
  .option("-o, --overwrite", "EdgeKV token placed inside the bundle will be overwritten")
  .action(async function (tokenName, options) {
    try {
      await kvCliHandler.retrieveToken(tokenName, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  }); 

const show = program.command('show')
  .description("Check the initialization status of the EdgeKV or Retrieve an EdgeKV namespace. Use show -h to see available options")
show
  .command("status")
  .description("Check the initialization status of the edgeKV")
  .action(async function () {
    try {
      await kvCliHandler.getInitializationStatus();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

show
  .command("ns <environment> <namespace>")
  .description("Retrieves an EdgeKV namespace")
  .action(async function (environment, namespace) {
    try {
      await kvCliHandler.getNameSpace(environment, namespace);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program.parse(process.argv);

if (envUtils.getNodeVersion() < 7) {
  cliUtils.logAndExit(1, "ERROR: The Akamai EdgeWorkers CLI requires Node 7.0.0 or newer.");
}

if (program.args.length === 0) {
  program.outputHelp(function (text) {
    console.log(text);
    console.log(copywrite);
    cliUtils.logAndExit(1, "ERROR: No commands were provided.");
  });
}