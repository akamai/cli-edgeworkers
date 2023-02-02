#!/usr/bin/env node
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as cliHandler from './ew-handler';
import * as httpEdge from '../cli-httpRequest';
import { ewJsonOutput } from './client-manager';
import * as pkginfo from '../../package.json';
import { Command } from 'commander';
const program = new Command();
const currentYear = new Date().getFullYear();
const copywrite = '\nCopyright (c) 2019-' + currentYear + ' Akamai Technologies, Inc. Licensed under Apache 2 license.\nYour use of Akamai\'s products and services is subject to the terms and provisions outlined in Akamai\'s legal policies.\nVisit http://github.com/akamai/cli-edgeworkers for detailed documentation';

/* ========== EdgeWorkers CLI Program Commands ========== */
program
  .version(pkginfo.version)
  .description(pkginfo.description)
  .option('--debug', 'Show debug information.')
  .option('--edgerc <path>', 'Use edgerc file for authentication.')
  .option('--section <name>', 'Use this section in edgerc file that contains the credential set.')
  .option('--json [path]', 'Write command output to JSON file at given path, otherwise written to CLI cache directory')
  .option('--jsonout', 'Write command output as JSON to stdout')
  .option('--accountkey <account-id>', 'internal parameter')
  .option('--ideExtension <ideExtensionTYpe>', 'extension parameter')
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
  .on('option:json', function (path) {
    ewJsonOutput.setJSONOutputMode(true);
    ewJsonOutput.setJSONOutputPath(path);
  })
  .on('option:jsonout', function () {
    ewJsonOutput.setJSONOutputMode(true);
    ewJsonOutput.setJSONOutputStdout(true);
  })
  .on('option:accountkey', function (key) {
    httpEdge.setAccountKey(key);
  })
  .on('option:ideExtension', function (ideExtensionType) {
    httpEdge.setIdeExtension(ideExtensionType);
  })
  .on('option:timeout', function (timeout) {
    envUtils.setTimeout(timeout);
  })
  // this fires only when a command is not listed below with a custom action
  .on('command:*', function (command) {
    const firstCommand = command[0];
    if (!this.commands.find(c => c._name == firstCommand)) {
      cliUtils.logAndExit(1, `Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
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
    }
    else {
      const command = (program.commands.find(c => c.name() == arg))
      ? program.commands.find(c => c.name() == arg)
      : program.commands.find(c => c.aliases()[0] == arg);
      if (!command) {
        cliUtils.logAndExit(1, `ERROR: Could not find a command for ${arg}`);
      }
      else {
        command.outputHelp();
      }
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-groups [group-identifier]')
  .description('View a list of groups and the associated permission capabilities')
  .alias('lg')
  .action(async function (groupId) {
    try {
      await cliHandler.showGroupOverview(groupId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-ids [edgeworker-identifier]')
  .description('List EdgeWorker ids currently registered')
  .alias('li')
  .option('--groupId <groupId>', 'Filter EdgeWorker ID list by Permission Group')
  .option('-restier, --resourceTierId <resourceTierId>', 'Filter EdgeWorkers by resource tiers')
  .action(async function (ewId, options) {
    try {
     cliHandler.showEdgeWorkerIdOverview(ewId, options.groupId, options.resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('register <group-identifier> <edgeworker-name>')
  .description('Register a new EdgeWorker ID to reference in Property Manager behavior')
  .alias('create-id')
  .option('-restier, --resourceTierId <resourceTierId>', 'New resource Tier ID to associate with EdgeWorker')
  .action(async function (groupId, name, options) {
    try {
      // for automation resource tier id will be provided , hence no need for prompts
      let resourceTierId = options.resourceTierId;
      if (!resourceTierId) {
      // get contract list and get resource tier info
      resourceTierId = await cliHandler.getResourceTierInfo();
      if (resourceTierId == undefined) {
        cliUtils.logAndExit(1, 'ERROR: Please select a valid resource tier ID.');
      }
      }
      // create edgeworker for the grpid, res tier and ew name
      await cliHandler.createEdgeWorkerId(groupId, name, resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-contracts')
  .description('View the list of contracts associated with an account')
  .alias('li-contracts')
  .action(async function () {
    try {
      await cliHandler.getContracts();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-properties <edgeworkerId>')
  .description('View the list of properties associated with an EdgeWorker ID')
  .option('--activeOnly', 'Return only active properties')
  .alias('lp')
  .action(async function (edgeWorkerId, options) {
    try {
      await cliHandler.getProperties(edgeWorkerId, options.activeOnly);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-restiers')
  .description('View the list of resource tiers available for a specified contract')
  .option('--contractId <contractId>', 'Contract ID for the resource tiers')
  .alias('li-restiers')
  .action(async function (options) {
    try {
      await cliHandler.getResourceTiers(options.contractId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-limits')
  .description('List the various limits EdgeWorkers imposes on the number of activations, EdgeWorkers IDs, and versions you can deploy')
  .alias('li-limits')
  .action(async function () {
    try {
      await cliHandler.getLimits();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('show-restier <edgeworkerId>')
  .description('View the resource tier associated with an EdgeWorker ID')
  .action(async function (edgeworkerId) {
    try {
      await cliHandler.getResourceTierForEwid(edgeworkerId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('update-id <edgeworker-identifier> <group-identifier> <edgeworker-name>')
  .description('Update an existing EdgeWorker Identifier\'s Luna ACG or Name attributes')
  .option('-restier, --resourceTierId <resourceTierId>', 'New resource Tier ID to associate with EdgeWorker')
  .alias('ui')
  .action(async function (ewId, groupId, name, options) {
    try {
      await cliHandler.updateEdgeWorkerInfo(ewId, groupId, name, options.resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('delete-id <edgeworker-identifier>')
  .description('Permanently delete an existing EdgeWorker ID')
  .option('--noPrompt', 'Skip the deletion confirmation prompt')
  .action(async function (ewId, options) {
    try {
      await cliHandler.deleteEdgeWorkerId(ewId, options.noPrompt);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-versions <edgeworker-identifier> [version-identifier]')
  .description('List Version information of a given EdgeWorker ID')
  .alias('lv')
  .action(async function (ewId, versionId) {
    try {
      await cliHandler.showEdgeWorkerIdVersionOverview(ewId, { versionId: versionId, showResult: true });
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('upload <edgeworker-identifier>')
  .description('Creates a new version of a given EdgeWorker ID which includes the code bundle')
  .alias('create-version')
  .option('--bundle <bundlePath>', 'Path to bundle file in tgz format')
  .option('--codeDir <workingDirectory>', 'Working directory that includes main.js and bundle.json files')
  .action(async function (ewId, options) {

    //either bundle or code working directory must be provided or fail
    if ((!options.bundle && !options.codeDir) || (options.bundle && options.codeDir))
      cliUtils.logAndExit(1, 'ERROR: You must provide the EdgeWorkers bundle tgz (--bundle) OR the working directory for mainjs and manifest file (--codeDir) to create a new version!');

    try {
      await cliHandler.createNewVersion(ewId, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('delete-version <edgeworker-identifier> <version-identifier>')
  .description('Permanently delete an existing version of a given EdgeWorker ID')
  .option('--noPrompt', 'Skip the deletion confirmation prompt')
  .action(async function (ewId, versionId, options) {
    try {
      await cliHandler.deleteVersion(ewId, versionId, options.noPrompt);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('download <edgeworker-identifier> <version-identifier>')
  .description('Download the code bundle of an EdgeWorker version')
  .alias('download-version')
  .option('--downloadPath <downloadPath>', 'Path to store downloaded bundle file; defaults to CLI home directory if not provided')
  .action(async function (ewId, versionId, options) {
    try {
      await cliHandler.downloadTarball(ewId, versionId, options.downloadPath);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('status <edgeworker-identifier>')
  .description('List Activation status of a given EdgeWorker ID')
  .alias('list-activations')
  .option('--versionId <versionId>', 'Version Identifier')
  .option('--activationId <activationId>', 'Activation Identifier')
  .action(async function (ewId, options) {

    // Do not provide both versionId and activationId
    if (options.versionId && options.activationId)
      cliUtils.logAndExit(1, 'ERROR: You may not provide both the Version and the Activation identifiers!');
    try {
      await cliHandler.showEdgeWorkerActivationOverview(ewId, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('activate <edgeworker-identifier> <network> <version-identifier>')
  .description('Activate a Version for a given EdgeWorker ID on an Akamai Network')
  .alias('av')
  .action(async function (ewId, network, versionId) {

    // Network must use correct keyword STAGING|PRODUCTION
    if (network.toUpperCase() !== cliUtils.staging && network.toUpperCase() !== cliUtils.production)
      cliUtils.logAndExit(1, `ERROR: Network parameter must be either staging or production - was: ${network}`);
    try {
      await cliHandler.createNewActivation(ewId, network.toUpperCase(), versionId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('clone <edgeworker-identifier> <resourceTierId>')
  .description('Clone the given EdgeWorker ID on an Akamai network')
  .option('--ewName <name>', 'Name of the EdgeWorker')
  .option('--groupId <groupId>', 'GroupId in which EdgeWorker will be cloned')
  .action(async function (ewId, resourceTierId, options) {
    try {
      await cliHandler.cloneEdgeworker(ewId, options.groupId, options.ewName, resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
})
.on('--help', function () {
  cliUtils.logAndExit(0, copywrite);
});

program
  .command('deactivate <edgeworker-identifier> <network> <version-identifier>')
  .description('De-activate a version for a given EdgeWorker ID on an Akamai Network')
  .alias('deact')
  .action(async function (ewId, network, versionId) {

    // Network must use correct keyword STAGING|PRODUCTION
    if (network.toUpperCase() !== cliUtils.staging && network.toUpperCase() !== cliUtils.production)
      cliUtils.logAndExit(1, `ERROR: Network parameter must be either staging or production - was: ${network}`);
    try {
      await cliHandler.deactivateEdgeworker(ewId, network.toUpperCase(), versionId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('validate <bundlePath>')
  .description('Validates a code bundle version without uploading the code bundle')
  .alias('vv')
  .action(async function (bundlePath) {

    try {
      await cliHandler.validateNewVersion(bundlePath);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('generate-secret')
  .description('Generates a random secret key that can be used in the variable PMUSER_EW_DEBUG_KEY in their property')
  .alias('secret')
  .action(async function () {
    const length = 32;
    try {
      await cliHandler.generateRandomSecretKey(length);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('create-auth-token [hostName]')
  .description('Generates an authentication token that can be used to get detailed EdgeWorker debug response headers. ')
  .alias('auth')
  .option('--expiry <expiry>', 'The number of minutes during which the token is valid, after which it expires. Max value is 720 minutes(12 hours); default value is 15 minutes.')
  .option('--format <format>', 'Format in which the output will be printed to console')
  .action(async function (hostName, options) {
    try {
      await cliHandler.createAuthToken(hostName, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

  const get = program
  .command('get')
  .description(
    'Get an EdgeWorkers report or get available report types.'
  );

get
  .command('reports')
  .description('Get all available reports')
  .action(async function () {
    try {
      await cliHandler.getAvailableReports();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

get
  .command('report [reportId] [edgeworker-identifier]')
  .description('Get an EdgeWorkers report')
  .requiredOption('-s, --startDate <startDate>', 'ISO 8601 timestamp indicating the start time of the EdgeWorkers report (REQUIRED).')
  .option('-e, --endDate <endDate>', 'ISO 8601 timestamp indicating the end time of the EdgeWorkers report. If not specified, the end time defaults to the current time.')
  .option('--status, <status>', 'Comma-separated string to filter by EdgeWorker status. Values: success, genericError, unknownEdgeWorkerId, unimplementedEventHandler, runtimeError, executionError, timeoutError, resourceLimitHit, cpuTimeoutError, wallTimeoutError, initCpuTimeoutError, initWallTimeoutError.')
  .option('--ev, --eventHandlers <eventHandlers>', 'Comma-separated string to filter EdgeWorkers by the event that triggers them. Values: onClientRequest, onOriginRequest, onOriginResponse, onClientResponse, responseProvider.')
  .action(async function (reportId: number, edgeworkerId: string, options) {
    if (!reportId){
      cliUtils.logAndExit(1, 'ERROR: Please specify a reportId. To obtain the available report ID run "akamai edgeworkers get reports".');
    }
    const {startDate, endDate, status, eventHandlers} = options;

    const statusArray = status ? status.split(',') : [];
    const eventHandlersArray = eventHandlers ? eventHandlers.split(',') : [];

    try {
      await cliHandler.getReport(reportId, startDate, endDate, edgeworkerId, statusArray, eventHandlersArray);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });


program.parse(process.argv);

if (envUtils.getNodeVersion() < 7) {
  cliUtils.logAndExit(1, 'ERROR: The Akamai EdgeWorkers CLI requires Node 7.0.0 or newer.');
}
