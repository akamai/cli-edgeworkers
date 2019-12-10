#!/usr/bin/env node
import * as fs from 'fs';
import * as path from "path";
import * as os from "os";
import * as envUtils from './utils/env-utils';
import * as cliUtils from './utils/cli-utils';
import * as edgeWorkersSvc from './service/edgeworkers-svc';
import * as edgeWorkersClientSvc from './service/edgeworkers-client-manager';
const pkginfo = require('../package.json');
const cTable = require('console.table');
var program = require('commander');
const groupColumnsToKeep = ["groupId", "groupName", "capabilities"];
const idColumnsToKeep = ["edgeWorkerId", "name", "groupId"];
const versionColumnsToKeep = ["edgeWorkerId", "version", "checksum", "createdBy", "createdTime", "sequenceNumber"];
const activationColumnsToKeep = ["edgeWorkerId", "version", "activationId", "status", "network", "createdBy", "createdTime"];
const CLI_CACHE_PATH = process.env.AKAMAI_CLI_CACHE_PATH;
const copywrite = '\nCopyright (C) Akamai Technologies, Inc\nVisit http://github.com/akamai/cli-edgeworkers for detailed documentation';

if (!CLI_CACHE_PATH) {
  logAndExit("ERROR: AKAMAI_CLI_CACHE_PATH is not set.");
}

if (!fs.existsSync(CLI_CACHE_PATH)) {
  logAndExit(`ERROR: AKAMAI_CLI_CACHE_PATH is set to ${CLI_CACHE_PATH} but this directory does not exist.`);
}

const edgeRcPath = path.resolve(os.homedir(), '.edgerc');
if (!fs.existsSync(edgeRcPath)) {
  logAndExit(`ERROR: Could not find .edgerc to authenticate Akamai API calls. Add your credential set to the .edgerc file at this path: ${edgeRcPath}`);
}

if (envUtils.getNodeVersion() < 8) {
  logAndExit("ERROR: The Akamai EdgeWorkers CLI requires Node 8 or later.");
}

/* ========== Local Helpers ========== */
function logAndExit(msg: string) {
  console.log(msg);
  process.exit();
}

function filterJsonData(data, columnsToKeep: string[]) {
  //Dont filter data if in debug mode
  if (!envUtils.isDebugMode()) {
    Object.keys(data).forEach(function (key) {
      if (columnsToKeep.indexOf(key) == -1)
        delete data[key];
    });
  }
  return data;
}

/* ========== EdgeWorkers CLI Program Commands ========== */
program
  .version(pkginfo.version)
  .description(pkginfo.description)
  .option('--debug', 'Show debug information.')
  .option('--edgerc <path>', 'Use edgerc file for authentication.')
  .option('--section <name>', 'Use this section in edgerc file that contains the credential set.')
  .option('--accountkey <account-id>', 'internal parameter')
  .on("option:edgerc", function (edgeRcFilePath) {
    envUtils.setEdgeRcFilePath(edgeRcFilePath);
  })
  .on("option:section", function (section) {
    envUtils.setEdgeRcSection(section);
  })
  .on("option:accountkey", function (key) {
    edgeWorkersSvc.setAccountKey(key);
  })
  .on("option:debug", function () {
    envUtils.setDebugMode(true);
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  })
  .on('command:*', function (command) {
    const firstCommand = command[0];
    if (!this.commands.find(c => c._name == firstCommand)) {
      console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
      process.exit(1);
    }
  })
  ;

program
  .command('help [command]')
  .description('Displays help information for the given command.')
  .action(function (arg) {
    if (!arg) {
      program.outputHelp();
    } else {
      var command = (!!program.commands.find(c => c._name == arg)) ? program.commands.find(c => c._name == arg) : program.commands.find(c => c._alias == arg);
      if (!command) {
        console.log(`ERROR: Could not find a command for ${arg}`);
      } else {
        command.outputHelp();
        console.log(copywrite);
      }
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

program
  .command("list-groups [group-identifier]")
  .description("Customer Developer can find their EdgeWorkers access level per Luna Access Control Group.")
  .alias("lg")
  .action(async function (groupId) {
    try {
      await showGroupOverview(groupId);
    } catch (e) {
      console.error(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

program
  .command("list-ids [edgeworker-identifier]")
  .description("List EdgeWorker ids currently registered.")
  .alias("li")
  .option("--groupId <groupId>", "Filter EdgeWorker Id list by Permission Group")
  .action(async function (ewId, options) {
    try {
      await showEdgeWorkerIdOverview(ewId, options.groupId);
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

program
  .command("register <group-identifier> <edgeworker-name>")
  .description("Register a new EdgeWorker id to reference in Property Manager behavior.")
  .alias("create-id")
  .action(async function (groupId, name) {
    try {
      await createEdgeWorkerId(groupId, name);
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

program
  .command("update-id <edgeworker-identifier> <group-identifier> <edgeworker-name>")
  .description("Allows Customer Developer to update an existing EdgeWorker Identifier's Luna ACG or Name attributes.")
  .alias("ui")
  .action(async function (ewId, groupId, name) {
    try {
      await updateEdgeWorkerInfo(ewId, groupId, name);
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

program
  .command("list-versions <edgeworker-identifier> [version-identifier]")
  .description("List Version information of a given EdgeWorker Id.")
  .alias("lv")
  .action(async function (ewId, versionId) {
    try {
      await showEdgeWorkerIdVersionOverview(ewId, { versionId: versionId, showResult: true });
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
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
      logAndExit("ERROR: You must provide the EdgeWorkers bundle tgz (--bundle) OR the working directory for mainjs and manifest file (--codeDir) to create a new version!");

    try {
      await createNewVersion(ewId, options);
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

program
  .command("download <edgeworker-identifier> <version-identifier>")
  .description("Download the code bundle of an EdgeWorker version.")
  .alias("download-version")
  .option("--downloadPath <downloadPath>", "Path to store downloaded bundle file; defaults to CLI home directory if not provided")
  .action(async function (ewId, versionId, options) {
    try {
      await downloadTarball(ewId, versionId, options.downloadPath);
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
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
      logAndExit("ERROR: You may not provide both the Version and the Activation identifiers!");
    try {
      await showEdgeWorkerActivationOverview(ewId, options);
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

program
  .command("activate <edgeworker-identifier> <network> <version-identifier>")
  .description("Activate a Version for a given EdgeWorker Id on an Akamai Network")
  .alias("av")
  .action(async function (ewId, network, versionId) {

    // Network must use correct keyword STAGING|PRODUCTION
    if (network.toUpperCase() !== 'STAGING' && network.toUpperCase() !== 'PRODUCTION')
      logAndExit(`ERROR: Network parameter must be either STAGING or PRODUCTION - was: ${network}`);
    try {
      await createNewActivation(ewId, network.toUpperCase(), versionId);
    } catch (e) {
      console.log(e);
    }
  })
  .on("--help", function () {
    console.log(copywrite);
  })
  .on("-h", function () {
    console.log(copywrite);
  });

  if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit();
  }

  program.parse(process.argv);

/* ========== Async Fetch and Formatters ========== */
async function showGroupOverview(groupId: string) {
  var groups = null;
  var group = [];

  if (!groupId) {
    groups = await cliUtils.spinner(edgeWorkersSvc.getAllGroups(), "Fetching Permission Groups...");
    // remove outer envelope of JSON data
    if (groups.hasOwnProperty('groups'))
      groups = groups["groups"];
  }
  else {
    groups = await cliUtils.spinner(edgeWorkersSvc.getGroup(groupId), `Fetching info for Permission Group ${groupId}`);
    groups = [groups];
  }

  // check if groupId was empty for messaging
  if (groupId === undefined || groupId === null)
    groupId = "any";

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (groups.length > 0) {

    Object.keys(groups).forEach(function (key) {
      group.push(filterJsonData(groups[key], groupColumnsToKeep));
    });

    cliUtils.logWithBorder(`User has the following Permission Group acccess for group: ${groupId}`);
    console.table(group);
  }
  else {
    logAndExit(`INFO: There is currently no Permission Group info for group: ${groupId}`);
  }
}

async function showEdgeWorkerIdOverview(ewId: string, groupId: string) {
  var ids = null;
  var id = [];
  var accountId: string = '';

  if (!ewId) {
    ids = await cliUtils.spinner(edgeWorkersSvc.getAllEdgeWorkerIds(groupId), "Fetching EdgeWorker Ids...");
    // remove outer envelope of JSON data
    if (ids.hasOwnProperty("edgeWorkerIds"))
      ids = ids["edgeWorkerIds"];
  }
  else {
    console.log(`INFO: Since EdgeWorker Id (${ewId}) was provided, ignoring unnecessary Group Id, group: ${groupId}...`);
    groupId = null;
    ids = await cliUtils.spinner(edgeWorkersSvc.getEdgeWorkerId(ewId), `Fetching info for EdgeWorker Id ${ewId}`);
    ids = [ids];
  }

  // check if groupId was empty for messaging
  if (groupId === undefined || groupId === null)
    groupId = "any";

  // check if ewId was empty for messaging
  if (ewId === undefined || ewId === null)
    ewId = "any";

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (ids.length > 0) {
    // accountid should be consistent across returned data set so grab value for messaging from first array element
    accountId = ids[0]["accountId"];

    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });

    // sort by ewID since API doesn't sort result set
    id.sort(function (a, b) {
      return a.edgeWorkerId - b.edgeWorkerId;
    });
    cliUtils.logWithBorder(`The following EdgeWorker Ids are currently registered for account: ${accountId}, group: ${groupId}, ewId: ${ewId}`);
    console.table(id);
  }
  else {
    logAndExit(`INFO: There is currently no EdgeWorker Id info for group: ${groupId}, ewId: ${ewId}`);
  }
}

async function updateEdgeWorkerInfo(ewId: string, groupId: string, name: string) {
  var ids = await cliUtils.spinner(edgeWorkersSvc.updateEdgeWorkerId(ewId, groupId, name), `Updating info for EdgeWorker Id ${ewId}`);

  if (ids) {
    ids = [ids];
    var id = [];
    cliUtils.logWithBorder(`Updated EdgeWorker Id info for ewId: ${ewId}`);
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    console.table(id);
  }
}

async function createEdgeWorkerId(groupId: string, name: string) {
  var ids = await cliUtils.spinner(edgeWorkersSvc.createEdgeWorkerId(groupId, name), `Creating new EdgeWorker Id in group: ${groupId}, with name: ${name}`);

  if (ids) {
    ids = [ids];
    var id = [];
    cliUtils.logWithBorder(`Created new EdgeWorker Identifier:`);
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    console.table(id);
  }
}

async function showEdgeWorkerIdVersionOverview(ewId: string, options?: { versionId?: string, showResult?: boolean }) {
  var versions = null;
  var version = [];
  var accountId: string = '';
  var versionId = options.versionId;
  var showResult: boolean = (options.showResult != null && options.showResult != undefined) ? options.showResult : true;

  if (!versionId) {
    versions = await cliUtils.spinner(edgeWorkersSvc.getAllVersions(ewId), `Fetching all Versions for EdgeWorker Id ${ewId}`);
    // remove outer envelope of JSON data
    if (versions.hasOwnProperty("versions"))
      versions = versions["versions"];
  }
  else {
    versions = await cliUtils.spinner(edgeWorkersSvc.getVersionId(ewId, versionId), `Fetching Version ${versionId} for EdgeWorker Id ${ewId}`);
    versions = [versions];
  }
  // check if versionId was empty for messaging
  if (versionId === undefined || versionId === null)
    versionId = "any";

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (versions.length > 0) {
    // accountid should be consistent across returned data set so grab value for messaging from first array element
    accountId = versions[0]["accountId"];

    Object.keys(versions).forEach(function (key) {
      version.push(filterJsonData(versions[key], versionColumnsToKeep));
    });

    // sort by sequenceNumber since API doesn't sort result set
    version.sort(function (a, b) {
      return a.sequenceNumber - b.sequenceNumber;
    });

    // after sort, remove sequenceNumber column, unless in debug mode
    if (!envUtils.isDebugMode()) {
      Object.keys(version).forEach(function (key) {
        delete version[key]["sequenceNumber"];
      });
    }

    if (showResult) {
      cliUtils.logWithBorder(`The following EdgeWorker Versions are currently registered for account: ${accountId}, ewId: ${ewId}, version: ${versionId}`);
      console.table(version);
    }
    else {
      return version;
    }
  }
  else {
    if (showResult) {
      logAndExit(`INFO: There are currently no Versions for this EdgeWorker Id: ${ewId}`);
    }
    else {
      return [];
    }
  }
}

async function createNewVersion(ewId: string, options: { bundle?: string, codeDir?: string }) {
  var bundle = null;
  var versions = null;
  var matchedVersion = null;
  var checksumMatches = false;

  // Depending on options used, validate or build tarball from code files
  if (options.bundle)
    bundle = await cliUtils.spinner(edgeWorkersClientSvc.validateTarball(ewId, options.bundle), "Validating provided tarball");
  else
    bundle = await cliUtils.spinner(edgeWorkersClientSvc.buildTarball(ewId, options.codeDir), "Building tarball from working directory code");

  //compare checksum to existing tarballs already uploaded - if matches fail indicating which version matched
  if (!bundle.tarballChecksum) {
    logAndExit("ERROR: Checksum for EdgeWorkers bundle not found!");
  }
  else {
    // fetch all versions for given ewID
    versions = await showEdgeWorkerIdVersionOverview(ewId, { showResult: false });

    //Compare new checksum to existing checksums, if match, abort version creation
    Object.keys(versions).forEach(function (key) {
      if (versions[key]['checksum'] == bundle.tarballChecksum) {
        checksumMatches = true;
        matchedVersion = versions[key];
      }
    });
    if (checksumMatches) {
      var errorInfo = [];
      errorInfo.push(["error_info", "value"]);
      errorInfo.push(["bundle", bundle.tarballPath]);
      errorInfo.push(["new checksum", bundle.tarballChecksum]);
      errorInfo.push(["matched id and version", ewId + " / v" + matchedVersion['version']]);
      errorInfo.push(["matched checksum", matchedVersion['checksum']]);
      console.table(errorInfo[0], errorInfo.slice(1));
      logAndExit(`ERROR: Checksum for EdgeWorkers bundle provided matches existing version!`);
    }
    else {
      //if all remains good, then upload tarball and output checksum and version number
      await uploadEdgeWorkerVersion(ewId, bundle.tarballPath);
    }
  }
}

async function uploadEdgeWorkerVersion(ewId: string, tarballPath: string) {

  var versions = await cliUtils.spinner(edgeWorkersSvc.uploadTarball(ewId, tarballPath), `Uploading new version for EdgeWorker Id ${ewId} from ${tarballPath}`);

  if (versions) {
    versions = [versions];
    var version = [];
    cliUtils.logWithBorder(`New version uploaded for EdgeWorker Id: ${ewId}`);
    Object.keys(versions).forEach(function (key) {
      version.push(filterJsonData(versions[key], versionColumnsToKeep));
    });
    if (!envUtils.isDebugMode()) {
      Object.keys(version).forEach(function (key) {
        delete version[key]["sequenceNumber"];
      });
    }
    console.table(version);
  }
  else {
    logAndExit(`ERROR: Code bundle was not able to be uploaded!`);
  }
}

async function downloadTarball(ewId: string, versionId: string, rawDownloadPath?: string) {
  // Determine where the tarball should be store
  var downloadPath = edgeWorkersClientSvc.determineTarballDownloadDir(ewId, rawDownloadPath);
  // Build tarball file name as ew_<version>_<now-as-epoch>.tgz
  var tarballFileName: string = `ew_${versionId}_${Date.now()}.tgz`;
  var pathToStore = path.join(downloadPath, tarballFileName);

  // First try to fetch tarball
  var wasDownloaded = await cliUtils.spinner(edgeWorkersSvc.downloadTarball(ewId, versionId, pathToStore), `Downloading code bundle for EdgeWorker Id ${ewId}, version ${versionId}`);

  // if tarball found, then figure out where to store it
  if (!!wasDownloaded) {
    logAndExit(`INFO: File saved @ ${pathToStore}`);
  }
  else {
    logAndExit(`ERROR: Code bundle was not able to be saved locally!`);
  }
}

async function showEdgeWorkerActivationOverview(ewId: string, options?: { versionId?: string, activationId?: string }) {
  var activations = null;
  var activation = [];
  var accountId: string = '';
  var versionId = options.versionId;
  var activationId = options.activationId;

  if (versionId) {
    activations = await cliUtils.spinner(edgeWorkersSvc.getVersionActivations(ewId, versionId), `Fetching all Activations for EdgeWorker Id ${ewId}, Version ${versionId}`);
    if (activations.hasOwnProperty("activations"))
      activations = activations["activations"];
  }
  else if (activationId) {
    activations = await cliUtils.spinner(edgeWorkersSvc.getActivationID(ewId, activationId), `Fetching Activation info for EdgeWorker Id ${ewId}, Activation Id ${activationId}`);
    activations = [activations];

  }
  else {
    activations = await cliUtils.spinner(edgeWorkersSvc.getAllActivations(ewId), `Fetching all Activations for EdgeWorker Id ${ewId}`);
    // remove outer envelope of JSON data
    if (activations.hasOwnProperty("activations"))
      activations = activations["activations"];
  }

  // check if versionId was empty for messaging
  if (versionId === undefined || versionId === null)
    versionId = "any";

  // check if activationId was empty for messaging
  if (activationId === undefined || activationId === null)
    activationId = "any";

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (activations.length > 0) {
    // accountid should be consistent across returned data set so grab value for messaging from first array element
    accountId = activations[0]["accountId"];

    Object.keys(activations).forEach(function (key) {
      activation.push(filterJsonData(activations[key], activationColumnsToKeep));
    });

    cliUtils.logWithBorder(`The following EdgeWorker Activations currently exist for account: ${accountId}, ewId: ${ewId}, version: ${versionId}, activationId: ${activationId}`);
    console.table(activation);
  }
  else {
    logAndExit(`INFO: There are currently no Activations for ewId: ${ewId}, version: ${versionId}, activationId: ${activationId}`);
  }
}

async function createNewActivation(ewId: string, network: string, versionId: string) {
  var activations = await cliUtils.spinner(edgeWorkersSvc.createActivationId(ewId, network, versionId), `Creating Activation record for EdgeWorker Id ${ewId}, version: ${versionId} on network: ${network}`);

  if (activations) {
    activations = [activations];
    var activation = [];
    cliUtils.logWithBorder(`New Activation record created for EdgeWorker Id: ${ewId}, version: ${versionId}, on network: ${network}`);
    Object.keys(activations).forEach(function (key) {
      activation.push(filterJsonData(activations[key], activationColumnsToKeep));
    });
    console.table(activation);
  }
  else {
    logAndExit(`ERROR: Activation record was not able to be created!`);
  }

}
