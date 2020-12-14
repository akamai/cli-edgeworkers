#!/usr/bin/env node
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as kvCliHandler from './ekv-handler';
import * as edgeWorkersClientSvc from '../edgeworkers/client-manager';
import * as httpEdge from '../cli-httpRequest';
import * as pkginfo from '../../package.json';
const commander = require('commander');
const program = new commander.Command();
const copywrite = '\nCopyright (c) 2019-2020 Akamai Technologies, Inc. Licensed under Apache 2 license.\nYour use of Akamai\'s products and services is subject to the terms and provisions outlined in Akamai\'s legal policies.\nVisit http://github.com/akamai/cli-edgeworkers for detailed documentation';
program
  .version(pkginfo.version)
  .description(pkginfo.description)
  .option('--debug', 'Show debug information.')
  .option('--edgerc <path>', 'Use edgerc file for authentication.')
  .option('--section <name>', 'Use this section in edgerc file that contains the credential set.')
  .option('--json [path]', 'Write command output to JSON file at given path, otherwise written to CLI cache directory')
  .option('--accountkey <account-id>', 'internal parameter')
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
    edgeWorkersClientSvc.setJSONOutputMode(true);
    edgeWorkersClientSvc.setJSONOutputPath(path);
  })
  .on("option:accountkey", function (key) {
    httpEdge.setAccountKey(key);
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

program
  .command("write <itemType> <environment> <namespace> <groupId> <itemId> <items>")
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

const read = program.command('read');

read
  .command("item <environment> <namespace> <groupId> <itemId>")
  .description("Read an item from an EdgeKV Namespace")
  .alias("rd")
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

const del = program.command('delete');

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
  .description("List all the namespaces or list all items with in a group");

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
  .alias("itms")
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

const create = program.command('create')
  .description("Creates a namespace or creates a token")
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

create
  .command("ns <environment> <namespace>")
  .description("Creates an EdgeKV namespace")
  .alias("createns")
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
  .option("--staging <staging>", "Token can be used in staging environment if allowed")
  .option("--production <production>", "Token can be used in production environment if allowed")
  .option("--ewids <ewIds>", "All or specific ewids for which the token can be applied")
  .option("--expiry <expiry>","Expiry date of the token in the format yyyy-mm-dd")
  .option("--namespace <namespace>","Permissions for the namespaces" )
  .option("-o, --overwrite","EdgeKV token placed inside the bundle will be overwritten")
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


const show = program.command('show')
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