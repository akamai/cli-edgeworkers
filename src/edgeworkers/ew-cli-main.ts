#!/usr/bin/env node
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as configUtils from '../utils/config-utils';
import {
  GROUP_ID,
  RESOURCE_TIER_ID,
  CONTRACT_ID,
  BUNDLE_PATH,
  WORKING_DIRECTORY,
  DOWNLOAD_PATH,
  VERSION_ID,
  ACTIVATION_ID,
  ACTIVE,
  NETWORK,
  EDGEWORKER_NAME,
  EXPIRY,
  FORMAT,
  REPORT_ID,
  END_DATE,
  STATUS,
  EVENT_HANDLERS,
  PINNED_ONLY,
  CURRENTLY_PINNED,
  NOTE,
  ACTIVE_VERSIONS,
  CURRENTLY_PINNED_REVISIONS
} from './../utils/constants';
import * as cliHandler from './ew-handler';
import * as httpEdge from '../cli-httpRequest';
import { ewJsonOutput } from './client-manager';
import * as pkginfo from '../../package.json';
import { Command, Argument } from 'commander';
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
  .option('--configSection <configSection>', 'Use this section in ew-config file that contains the default config properties set.')
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
  .on('option:configSection', function (configSection) {
    configUtils.setConfigSection(configSection);
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
  argumentDescription: () => '',
  argumentTerm: (cmd) =>
    helper.argumentTerm(cmd) + '\n\t' + helper.argumentDescription(cmd),

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
  .option('--isPartner <boolean>', 'Filter EdgeWorker IDs by partner identifier')
  .action(async function (ewId, options) {
    options['groupId'] = options.groupId || configUtils.searchProperty(GROUP_ID);
    options['resourceTierId'] = options.resourceTierId || configUtils.searchProperty(RESOURCE_TIER_ID);
    if (options.isPartner != undefined) {
      options['isPartner'] = (options.isPartner.toLowerCase() === 'true' ? true : false);
    }

    try {
      await cliHandler.showEdgeWorkerIdOverview(ewId, options.groupId, options.resourceTierId, options.isPartner);
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
    options['resourceTierId'] = options.resourceTierId || configUtils.searchProperty(RESOURCE_TIER_ID);

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
  .command('list-properties <edgeworker-identifier>')
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
    options['contractId'] = options.contractId || configUtils.searchProperty(CONTRACT_ID);

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
    options['resourceTierId'] = options.resourceTierId || configUtils.searchProperty(RESOURCE_TIER_ID);

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
    options['bundlePath'] = options.bundlePath || configUtils.searchProperty(BUNDLE_PATH);
    options['workingDirectory'] = options.workingDirectory || configUtils.searchProperty(WORKING_DIRECTORY);

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
    options['downloadPath'] = options.downloadPath || configUtils.searchProperty(DOWNLOAD_PATH);

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
  .command('download-revision <edgeworker-identifier> <revision-identifier>')
  .description('Download the combined code bundle that contains the code and the dependencies that the EdgeWorker executes')
  .alias('dr')
  .option('--downloadPath <downloadPath>', 'Path to store downloaded combined bundle file; defaults to CLI home directory if not provided')
  .action(async function (ewId, revisionId, options) {
    options['downloadPath'] = options.downloadPath || configUtils.searchProperty(DOWNLOAD_PATH);

    try {
      await cliHandler.downloadRevisionTarball(ewId, revisionId, options.downloadPath);
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
  .option('--activeOnNetwork', 'Limits results to show only currently activate versions')
  .option('--network <network>', 'Limits the results to versions that were activated on a specific network (STAGING or PRODUCTION)')
  .action(async function (ewId, options) {
    options['versionId'] = options.versionId || configUtils.searchProperty(VERSION_ID);
    options['activationId'] = options.activationId || configUtils.searchProperty(ACTIVATION_ID);
    options['activeOnNetwork'] = options.activeOnNetwork || configUtils.searchProperty(ACTIVE);
    options['network'] = options.network || configUtils.searchProperty(NETWORK);

    // Do not provide both versionId and activationId
    if (options.activationId && (options.versionId || options.active || options.network) ) {
      cliUtils.logAndExit(1, 'ERROR: You may not provide the Activation identifier with versionId, network, or activeOnNetwork options.');
    }

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
  .option('--auto-pin <autoPin>', 'Indicator to tell initial revision is pinned or not, true by default.')
  .action(async function (ewId, network, versionId, options) {
    if (options.autoPin != undefined) {
      options.autoPin = (options.autoPin.toLowerCase() === 'true' ? true : false);
    }

    // Network must use correct keyword STAGING|PRODUCTION
    if (network.toUpperCase() !== cliUtils.staging && network.toUpperCase() !== cliUtils.production)
      cliUtils.logAndExit(1, `ERROR: Network parameter must be either staging or production - was: ${network}`);
    try {
      await cliHandler.createNewActivation(ewId, network.toUpperCase(), versionId, options.autoPin);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-revisions <edgeworker-identifier>')
  .description('List the revision history for a given EdgeWorker ID')
  .option('--versionId <versionId>', 'Version Identifier')
  .option('--activationId <activationId>', 'Activation Identifier')
  .option(
    '--network <network>',
    'Limits the results to versions that were activated on a specific network (STAGING or PRODUCTION)',
  )
  .option(
    '--pinnedOnly',
    'Limits results to show only currently or previously pinned revisions',
  )
  .option(
    '--currentlyPinned',
    'Limits results to show only revisions that are currently pinned',
  )
  .alias('lr')
  .action(async function (ewId, options) {
    options['versionId'] =
      options.versionId || configUtils.searchProperty(VERSION_ID);
    options['activationId'] =
      options.activationId || configUtils.searchProperty(ACTIVATION_ID);
    options['network'] = options.network || configUtils.searchProperty(NETWORK);
    options['pinnedOnly'] =
      options.pinnedOnly || configUtils.searchProperty(PINNED_ONLY);
    options['currentlyPinned'] =
      options.currentlyPinned || configUtils.searchProperty(CURRENTLY_PINNED);

    try {
      await cliHandler.showEdgeWorkerRevisionOverview(ewId, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('get-revision <edgeworker-identifier> <revision-identifier>')
  .description('Get details for a specific revision')
  .alias('gr')
  .action(async function (ewId, revId) {
    try {
      await cliHandler.getRevision(ewId, revId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('compare-revisions <edgeworker-identifier> <revision-identifier> <revision-identifier>')
  .description('View dependency differences between two revisions of the same EdgeWorker.')
  .alias('cr')
  .action(async function (ewId, revId1, revId2) {
    try {
      await cliHandler.compareRevisions(ewId, revId1, revId2);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('activate-revision <edgeworker-identifier> <revision-identifier>')
  .description('Activate a revision for a given EdgeWorker Id on Akamai Network')
  .option('--note <note>', 'Note to specify why the revision is being reactivated')
  .alias('ar')
  .action(async function (ewId, revId, options) {
    options['note'] = options.note || configUtils.searchProperty(NOTE);

    try {
      await cliHandler.activateRevision(ewId, revId, options.note);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('pin-revision <edgeworker-identifier> <revision-identifier>')
  .description('Pin an active revision for a given EdgeWorker ID')
  .option('--note <note>', 'Note to specify why the revision is being pinned')
  .action(async function (ewId, revId, options) {
    options['note'] = options.note || configUtils.searchProperty(NOTE);

    try {
      await cliHandler.pinRevision(ewId, revId, options.note);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('unpin-revision <edgeworker-identifier> <revision-identifier>')
  .description('Unpin an active pinned revision for a given EdgeWorker ID')
  .option('--note <note>', 'Note to specify why the revision is being unpinned')
  .action(async function (ewId, revId, options) {
    options['note'] = options.note || configUtils.searchProperty(NOTE);

    try {
      await cliHandler.unpinRevision(ewId, revId, options.note);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('get-revision-bom <edgeworker-identifier> <revision-identifier>')
  .description('View details for a specific revision of a composite bundle')
  .alias('gb')
  .option('--activeVersions', 'Limit results to show only active versions')
  .option('--currentlyPinnedRevisions', 'Shows additional information about the revision that\'s currently pinned')
  .action(async function  (ewId, revisionId, options) {
    options['activeVersions'] = options.activeVersions || configUtils.searchProperty(ACTIVE_VERSIONS);
    options['currentlyPinnedRevisions'] = options.currentlyPinnedRevisions || configUtils.searchProperty(CURRENTLY_PINNED_REVISIONS);

    try {
      await cliHandler.showRevisionBOM(ewId, revisionId, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command('list-revision-activations <edgeworker-identifier>')
  .description('List Revision Activation status of a given EdgeWorker ID')
  .alias('lra')
  .option('--versionId <versionId>', 'Version Identifier')
  .option('--activationId <activationId>', 'Activation Identifier')
  .option('--network  <network>', 'Limits the results to versions that were activated on a specific network (STAGING or PRODUCTION)')
  .action(async function (ewId, options) {
    options['versionId'] = options.versionId || configUtils.searchProperty(VERSION_ID);
    options['activationId'] = options.activationId || configUtils.searchProperty(ACTIVATION_ID);
    options['network'] = options.network || configUtils.searchProperty(NETWORK);

    // Do not provide both versionId and activationId
    if (options.activationId && (options.versionId || options.network) ) {
      cliUtils.logAndExit(1, 'ERROR: You may not provide the Activation identifier with versionId or network options.');
    }

    try {
      await cliHandler.showEdgeWorkerRevisionActivationOverview(ewId, options);
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
    options['ewName'] = options.ewName || configUtils.searchProperty(EDGEWORKER_NAME);
    options['groupId'] = options.groupId || configUtils.searchProperty(GROUP_ID);

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
    options['expiry'] = options.expiry || configUtils.searchProperty(EXPIRY);
    options['format'] = options.format || configUtils.searchProperty(FORMAT);

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
  .option('--ev, --eventHandlers <eventHandlers>', 'Comma-separated string to filter EdgeWorkers by the event that triggers them. Values: onClientRequest, onOriginRequest, onOriginResponse, onClientResponse, onBotSegmentAvailable, responseProvider.')
  .action(async function (reportId: number, edgeworkerId: string, options) {
    reportId = reportId || configUtils.searchProperty(REPORT_ID);
    if (!reportId){
      cliUtils.logAndExit(1, 'ERROR: Please specify a reportId. To obtain the available report ID run "akamai edgeworkers get reports".');
    }

    options['endDate'] = options.endDate || configUtils.searchProperty(END_DATE);
    options['status'] = options.status || configUtils.searchProperty(STATUS);
    options['eventHandlers'] = options.eventHandlers || configUtils.searchProperty(EVENT_HANDLERS);

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

const log_level = program
  .command('log-level')
  .description('Manage Edgeworker logging level.');

log_level
  .command('set')
  .argument('<edgeworker-identifier>')
  .addArgument(new Argument('<network>', `(choices: ${cliUtils.staging}, ${cliUtils.production})`))
  .addArgument(new Argument('<level>', `(choices: ${cliUtils.LOG_LEVELS.join(', ')})`))
  .option('--expires <time>', `Expire time for logging level change. Supports natural language input
       like: '+1h', 'Next Saturday', as well as ISO Timestamps. Use '${cliUtils.LL_NEVER_EXPIRE_STR}'
       for the change to never expire.`, cliUtils.LL_NEVER_EXPIRE_STR)
  .option('--ds2Id <id>', 'Datastream 2 ID to use alongside the default specified in bundle.json')
  .description('Set logging level for an Edgeworker.')
  .action(async function (ewId: number, network: string, level: string, options) {
    if (network.toUpperCase() !== cliUtils.staging && network.toUpperCase() !== cliUtils.production)
      cliUtils.logAndExit(1, `ERROR: Network parameter must be either ${cliUtils.staging} or ${cliUtils.production} - was: ${network}`);
    if (!cliUtils.LOG_LEVELS.includes(level.toUpperCase()))
      cliUtils.logAndExit(1, `ERROR: Level parameter must be one of: ${cliUtils.LOG_LEVELS.join(', ')} - was: ${level}`);
    try {
      await cliHandler.setLogLevel(ewId, network.toUpperCase(), level.toUpperCase(), options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on('--help', function () {
    cliUtils.logAndExit(0, copywrite);
  });

log_level
  .command('get')
  .argument('<edgeworker-identifier>')
  .argument('[logging-identifier]')
  .description('Get logging level for an Edgeworker.')
  .action(async function (ewId: number, loggingId: null | string) {
    try {
      await cliHandler.getLogLevel(ewId, loggingId);
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
