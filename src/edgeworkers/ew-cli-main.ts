#!/usr/bin/env node
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as cliHandler from './ew-handler';
import * as httpEdge from '../cli-httpRequest'
import * as edgeWorkersClientSvc from './client-manager';
import * as pkginfo from '../../package.json';
var program = require('commander');
const isValidDomain = require('is-valid-domain')
const copywrite = '\nCopyright (c) 2019-2021 Akamai Technologies, Inc. Licensed under Apache 2 license.\nYour use of Akamai\'s products and services is subject to the terms and provisions outlined in Akamai\'s legal policies.\nVisit http://github.com/akamai/cli-edgeworkers for detailed documentation';

/* ========== EdgeWorkers CLI Program Commands ========== */
program
  .version(pkginfo.version)
  .description(pkginfo.description)
  .option('--debug', 'Show debug information.')
  .option('--edgerc <path>', 'Use edgerc file for authentication.')
  .option('--section <name>', 'Use this section in edgerc file that contains the credential set.')
  .option('--json [path]', 'Write command output to JSON file at given path, otherwise written to CLI cache directory')
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
    edgeWorkersClientSvc.setJSONOutputMode(true);
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
  .command("list-groups [group-identifier]")
  .description("Customer Developer can find their EdgeWorkers access level per Luna Access Control Group.")
  .alias("lg")
  .action(async function (groupId) {
    try {
      await cliHandler.showGroupOverview(groupId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("list-ids [edgeworker-identifier]")
  .description("List EdgeWorker ids currently registered.")
  .alias("li")
  .option("--groupId <groupId>", "Filter EdgeWorker Id list by Permission Group")
  .option("-restier, --resourceTierId <resourceTierId>", "Filter Edgeworkers by resource tiers")
  .action(async function (ewId, options) {
    try {
      await cliHandler.showEdgeWorkerIdOverview(ewId, options.groupId, options.resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("register <group-identifier> <edgeworker-name>")
  .description("Register a new EdgeWorker id to reference in Property Manager behavior.")
  .alias("create-id")
  .option("-restier, --resourceTierId <resourceTierId>", "New resource Tier id to associate with Edgeworker")
  .action(async function (groupId, name, options) {
    try {
      // for automation resource tier id will be provided , hence no need for prompts
      let resourceTierId = options.resourceTierId;
      if (!resourceTierId) {
      // get contract list and get resource tier info
      resourceTierId = await cliHandler.getResourceTierInfo();
      if (resourceTierId == undefined) {
        cliUtils.logAndExit(1, "ERROR: Please select a valid resource tier id.")
      }
      }
      // create edgeworker for the grpid, res tier and ew name
      await cliHandler.createEdgeWorkerId(groupId, name, resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("list-contracts")
  .description("Allows customer to view the list of contracts associated with their account")
  .alias("li-contracts")
  .action(async function () {
    try {
      await cliHandler.getContracts();
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("list-properties <edgeworkerId>")
  .description("Allows customer to view the list of properties associated with the EdgeWorker Id")
  .option("--activeOnly", "Return only active properties")
  .alias("lp")
  .action(async function (edgeWorkerId, options) {
    try {
      await cliHandler.getProperties(edgeWorkerId, options.activeOnly);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("list-restiers")
  .description("Allows customer to view the list of resource tiers available for the specified contract")
  .option("--contractId <contractId>", "Contract id for the resource tiers")
  .alias("li-restiers")
  .action(async function (options) {
    try {
      await cliHandler.getResourceTiers(options.contractId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("show-restier <edgeworkerId>")
  .description("Allows customer to view the resource tier associated with the EdgeWorker Id")
  .action(async function (edgeworkerId) {
    try {
      await cliHandler.getResourceTierForEwid(edgeworkerId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("update-id <edgeworker-identifier> <group-identifier> <edgeworker-name>")
  .description("Allows Customer Developer to update an existing EdgeWorker Identifier's Luna ACG or Name attributes.")
  .option("-restier, --resourceTierId <resourceTierId>", "New resource Tier id to associate with Edgeworker")
  .alias("ui")
  .action(async function (ewId, groupId, name, options) {
    try {
      await cliHandler.updateEdgeWorkerInfo(ewId, groupId, name, options.resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("delete-id <edgeworker-identifier>")
  .description("Permanently delete an existing EdgeWorker Id.")
  .option("--noPrompt", "Skip the deletion confirmation prompt")
  .action(async function (ewId, options) {
    try {
      await cliHandler.deleteEdgeWorkerId(ewId, options.noPrompt)
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("list-versions <edgeworker-identifier> [version-identifier]")
  .description("List Version information of a given EdgeWorker Id.")
  .alias("lv")
  .action(async function (ewId, versionId) {
    try {
      await cliHandler.showEdgeWorkerIdVersionOverview(ewId, { versionId: versionId, showResult: true });
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("upload <edgeworker-identifier>")
  .description("Creates a new version of a given EdgeWorker Id which includes the code bundle.")
  .alias("create-version")
  .option("--bundle <bundlePath>", "Path to bundle file in tgz format")
  .option("--codeDir <workingDirectory>", "Working directory that includes main.js and bundle.json files")
  .action(async function (ewId, options) {

    //either bundle or code working directory must be provided or fail
    if ((!options.bundle && !options.codeDir) || (options.bundle && options.codeDir))
      cliUtils.logAndExit(1, "ERROR: You must provide the EdgeWorkers bundle tgz (--bundle) OR the working directory for mainjs and manifest file (--codeDir) to create a new version!");

    try {
      await cliHandler.createNewVersion(ewId, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("delete-version <edgeworker-identifier> <version-identifier>")
  .description("Permanently delete an existing version of a given EdgeWorker Id.")
  .option("--noPrompt", "Skip the deletion confirmation prompt")
  .action(async function (ewId, versionId, options) {
    try {
      await cliHandler.deleteVersion(ewId, versionId, options.noPrompt);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("download <edgeworker-identifier> <version-identifier>")
  .description("Download the code bundle of an EdgeWorker version.")
  .alias("download-version")
  .option("--downloadPath <downloadPath>", "Path to store downloaded bundle file; defaults to CLI home directory if not provided")
  .action(async function (ewId, versionId, options) {
    try {
      await cliHandler.downloadTarball(ewId, versionId, options.downloadPath);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("status <edgeworker-identifier>")
  .description("List Activation status of a given EdgeWorker Id.")
  .alias("list-activations")
  .option("--versionId <versionId>", "Version Identifier")
  .option("--activationId <activationId>", "Activation Identifier")
  .action(async function (ewId, options) {

    // Do not provide both versionId and activationId
    if (options.versionId && options.activationId)
      cliUtils.logAndExit(1, "ERROR: You may not provide both the Version and the Activation identifiers!");
    try {
      await cliHandler.showEdgeWorkerActivationOverview(ewId, options);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("activate <edgeworker-identifier> <network> <version-identifier>")
  .description("Activate a Version for a given EdgeWorker Id on an Akamai Network")
  .alias("av")
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
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("clone <edgeworker-identifier> <resourceTierId>")
  .description("Clone the given Edgeworker Id on an akamai network")
  .option("--ewName <name>", "Name of the Edgeworker")
  .option("--groupId <groupId>", "GroupId in which Edgeworker will be cloned")
  .action(async function (ewId, resourceTierId, options) {
    try {
      await cliHandler.cloneEdgeworker(ewId, options.groupId, options.ewName, resourceTierId);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
})
.on("--help", function () {
  cliUtils.logAndExit(0, copywrite);
});

program
  .command("deactivate <edgeworker-identifier> <network> <version-identifier>")
  .description("De-activate a version for a given EdgeWorker Id on an Akamai Network")
  .alias("deact")
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
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("validate <bundlePath>")
  .description("Validates a code bundle version without uploading the code bundle.")
  .alias("vv")
  .action(async function (bundlePath) {

    try {
      await cliHandler.validateNewVersion(bundlePath);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("generate-secret")
  .description("Generates a random secret key that can be used in the variable PMUSER_EW_DEBUG_KEY in their property.")
  .alias("secret")
  .action(async function () {
    let length = 32;
    try {
      await cliHandler.generateRandomSecretKey(length);
    } catch (e) {
      cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("create-auth-token <hostName>")
  .description("Generates an authentication token that can be used to get detailed EdgeWorker debug response headers.")
  .alias("auth")
  .option("--network <network>","The Akamai environment on which to create this token, either “staging” or “production”")
  .option("--acl <aclPath>", "The path prefix of the response pages which require debugging; this value is used to restrict for which pages the token is valid. \
The default value if not specified is \"/*\". This option is mutually exclusive to the --url option; only use one or the other.")
  .option("--url <urlPath>", "The exact path (including filename and extension) of the response page which requires debugging; this value is used as a salt for \
generating the token, and the URL does NOT appear in the final token itself. The generated token is only valid for the exact URL. This option is mutually \
exclusive to the --acl option; only use one or the other.")
  .option("--expiry <expiry>", "The number of minutes during which the token is valid, after which it expires. Max value is 60 minutes; default value is 15 minutes.")
  .option("--format <format>", "Format in which the output will be printed to console")
  .action(async function (hostName, options) {
    try {
      // deprecation msg for people using older CLI. This will be removed eventually.
      if (!isValidDomain(hostName)) {
        cliUtils.logAndExit(1, 'ERROR: Creating auth token with secret is deprecated with version CLI 1.1.0. Please use your host name to create an authentication token.');
      } 

      await cliHandler.createAuthToken(hostName, options);
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
