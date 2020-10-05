#!/usr/bin/env node
import * as path from "path";
import * as envUtils from './utils/env-utils';
import * as cliUtils from './utils/cli-utils';
import * as edgeWorkersSvc from './service/edgeworkers-svc';
import * as edgeWorkersClientSvc from './service/edgeworkers-client-manager';
var CryptoJS = require("crypto-js");
const pkginfo = require('../package.json');
const cTable = require('console.table');
var program = require('commander');
const groupColumnsToKeep = ["groupId", "groupName", "capabilities"];
const idColumnsToKeep = ["edgeWorkerId", "name", "groupId"];
const versionColumnsToKeep = ["edgeWorkerId", "version", "checksum", "createdBy", "createdTime", "sequenceNumber"];
const activationColumnsToKeep = ["edgeWorkerId", "version", "activationId", "status", "network", "createdBy", "createdTime"];
const errorColumnsToKeep = ["type", "message"];
const copywrite = '\nCopyright (c) 2019-2020 Akamai Technologies, Inc. Licensed under Apache 2 license.\nYour use of Akamai\'s products and services is subject to the terms and provisions outlined in Akamai\'s legal policies.\nVisit http://github.com/akamai/cli-edgeworkers for detailed documentation';

/* ========== Local Helpers ========== */
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
    edgeWorkersSvc.setAccountKey(key);
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
      var command = (!!program.commands.find(c => c._name == arg)) ? program.commands.find(c => c._name == arg) : program.commands.find(c => c._alias == arg);
      if (!command) {
        cliUtils.logAndExit(1,`ERROR: Could not find a command for ${arg}`);
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
      await showGroupOverview(groupId);
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
  .action(async function (ewId, options) {
    try {
      await showEdgeWorkerIdOverview(ewId, options.groupId);
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
  .action(async function (groupId, name) {
    try {
      await createEdgeWorkerId(groupId, name);
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
  .alias("ui")
  .action(async function (ewId, groupId, name) {
    try {
      await updateEdgeWorkerInfo(ewId, groupId, name);
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
      await showEdgeWorkerIdVersionOverview(ewId, { versionId: versionId, showResult: true });
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
      await createNewVersion(ewId, options);
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
      await downloadTarball(ewId, versionId, options.downloadPath);
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
      await showEdgeWorkerActivationOverview(ewId, options);
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
    if (network.toUpperCase() !== 'STAGING' && network.toUpperCase() !== 'PRODUCTION')
      cliUtils.logAndExit(1, `ERROR: Network parameter must be either STAGING or PRODUCTION - was: ${network}`);
    try {
      await createNewActivation(ewId, network.toUpperCase(), versionId);
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
      await validateNewVersion(bundlePath);
    } catch (e) {
        cliUtils.logAndExit(1, e);
    }
  })
  .on("--help", function () {
    cliUtils.logAndExit(0, copywrite);
  });

program
  .command("generate-secret")
  .description("Generates a random secret key that can be used in the variable PMUSER_EW_DEBUG_KEY in their property and as an input to create auth token using cli command")
  .alias("secret")
  .option("--length <length>", "The length of the token to be generated")
  .action(async function (options) {
    let length = 32;
    if(options.length) {
      let errorMsg = "ERROR: The length specified is invalid. It must be an even integer value between 32 and 64.";
      if(isNaN(options.length)) {
        cliUtils.logAndExit(1, errorMsg);
      }
      if(options.length < 32 || options.length > 64 || options.length % 2 != 0) {
        cliUtils.logAndExit(1, errorMsg);
      }
    }
    if(options.length != null) {
      length = options.length;
    }
    try {
      await generateRandomSecretKey(length);
    } catch (e) {
        cliUtils.logAndExit(1, e);
    }
  });

program
  .command("create-auth-token <secretKey>")
  .description("Generates an authentication token that can be used to get detailed EdgeWorker debug response headers.  \
The secret key (hex-digit based, min 64 chars) that is configured for the Akamai property in which the EdgeWorker executes.")
  .alias("auth")
  .option("--acl <aclPath>", "The path prefix of the response pages which require debugging; this value is used to restrict for which pages the token is valid. \
The default value if not specified is \"/*\". This option is mutually exclusive to the --url option; only use one or the other.")
  .option("--url <urlPath>", "The exact path (including filename and extension) of the response page which requires debugging; this value is used as a salt for \
generating the token, and the URL does NOT appear in the final token itself. The generated token is only valid for the exact URL. This option is mutually \
exclusive to the --acl option; only use one or the other.")
  .option("--expiry <expiry>", "The number of minutes during which the token is valid, after which it expires. Max value is 60 minutes; default value is 15 minutes.")
  .action(async function (secretKey, options) {

    if(!secretKey) {
      cliUtils.logAndExit(1, "ERROR: The secret key specified in the property in which the EdgeWorker executes must be supplied in order to generate an authentication token.");
    } else if(secretKey.length < 64) {
      cliUtils.logAndExit(1, "ERROR: The secret key specified in the property in which the EdgeWorker executes must have at least 64 characters.");
    } else if(secretKey.length % 2 != 0) {
      cliUtils.logAndExit(1, "ERROR: The secret key specified in the property in which the EdgeWorker executes must have an even number of hex characters.");
    } else if(!secretKey.match(/^[0-9a-fA-F]+$/)) {
      cliUtils.logAndExit(1, "ERROR: The secret key specified in the property in which the EdgeWorker executes must contain only hex characters: [0-9a-f]");
    } else {
      secretKey = secretKey.toLowerCase();
    }

    var expiry = 15; // Use 15 minutes as the default value
    if(options.expiry) {
      expiry = parseInt(options.expiry);
      if(isNaN(expiry)) {
        cliUtils.logAndExit(1, "ERROR: The expiry is invalid. It must be an integer value (in minutes) representing the duration of the validity of the token.");
      } else if(expiry < 1 || expiry > 60) {
        cliUtils.logAndExit(1, "ERROR: The expiry is invalid. It must be an integer value (in minutes) between 1 and 60.");
      }
    }

    var path = "/*";
    var isACL = true;
    if(options.acl) {
      if(options.url) {
        cliUtils.logAndExit(1, "ERROR: The --acl and --url parameters are mutually exclusive; please use only one parameter. Specifying neither will result in a \
default value for the --acl parameter being used." );
      } else {
        path = options.acl;
        isACL = true;
      }
    } else if(options.url) {
      path = options.url;
      isACL = false;
    }

    try {
      await createAuthToken(secretKey, path, expiry, isACL);
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

if(program.args.length === 0) {
  program.outputHelp(function(text){
    console.log(text);
    console.log(copywrite);
    cliUtils.logAndExit(1, "ERROR: No commands were provided.");
  });
}

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

    let msg = `User has the following Permission Group access for group: ${groupId}`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, group);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(group);
    }
  }
  else {
    cliUtils.logAndExit(0, `INFO: There is currently no Permission Group info for group: ${groupId}`);
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
    let msg = `The following EdgeWorker Ids are currently registered for account: ${accountId}, group: ${groupId}, ewId: ${ewId}`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  }
  else {
    cliUtils.logAndExit(0, `INFO: There is currently no EdgeWorker Id info for group: ${groupId}, ewId: ${ewId}`);
  }
}

async function updateEdgeWorkerInfo(ewId: string, groupId: string, name: string) {
  var ids = await cliUtils.spinner(edgeWorkersSvc.updateEdgeWorkerId(ewId, groupId, name), `Updating info for EdgeWorker Id ${ewId}`);

  if (ids) {
    ids = [ids];
    var id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    let msg = `Updated EdgeWorker Id info for ewId: ${ewId}`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  }
}

async function createEdgeWorkerId(groupId: string, name: string) {
  var ids = await cliUtils.spinner(edgeWorkersSvc.createEdgeWorkerId(groupId, name), `Creating new EdgeWorker Id in group: ${groupId}, with name: ${name}`);

  if (ids) {
    ids = [ids];
    var id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    let msg = `Created new EdgeWorker Identifier:`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
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
      let msg = `The following EdgeWorker Versions are currently registered for account: ${accountId}, ewId: ${ewId}, version: ${versionId}`;
      if(edgeWorkersClientSvc.isJSONOutputMode()) {
        edgeWorkersClientSvc.writeJSONOutput(0, msg, version);
      }
      else {
        cliUtils.logWithBorder(msg);
        console.table(version);
      }
    }
    else {
      return version;
    }
  }
  else {
    if (showResult) {
      cliUtils.logAndExit(0, `INFO: There are currently no Versions for this EdgeWorker Id: ${ewId}`);
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
  // New Validation API is run during code bundle upload so no need to explicitly validate the provided tarball locally, rather delegate that to the OPEN API
  // However we still need to ensure the tarball exists locally if provided
  if (options.bundle)
    bundle = await cliUtils.spinner(edgeWorkersClientSvc.validateTarballLocally(options.bundle), "Validating provided tarball exists");
  else
    bundle = await cliUtils.spinner(edgeWorkersClientSvc.buildTarball(ewId, options.codeDir), "Building tarball from working directory code");

  //compare checksum to existing tarballs already uploaded - if matches fail indicating which version matched
  if (!bundle.tarballChecksum) {
    cliUtils.logAndExit(1, "ERROR: Checksum for EdgeWorkers bundle not found!");
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
      let errorValues = {};
      if(!edgeWorkersClientSvc.isJSONOutputMode()) {
        var errorInfo = [];
        errorInfo.push(["error_info", "value"]);
        errorInfo.push(["bundle", bundle.tarballPath]);
        errorInfo.push(["new checksum", bundle.tarballChecksum]);
        errorInfo.push(["matched id and version", ewId + " / v" + matchedVersion['version']]);
        errorInfo.push(["matched checksum", matchedVersion['checksum']]);
        console.table(errorInfo[0], errorInfo.slice(1));
      }
      else {
        errorValues = {
          bundle: bundle.tarballPath,
          new_checksum: bundle.tarballChecksum,
          matched_id_and_version: ewId + " / v" + matchedVersion['version'],
          matched_checksum: matchedVersion['checksum']
        }
      }
      cliUtils.logAndExit(1, `ERROR: Checksum for EdgeWorkers bundle provided matches existing version!`, [errorValues]);
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
    Object.keys(versions).forEach(function (key) {
      version.push(filterJsonData(versions[key], versionColumnsToKeep));
    });
    if (!envUtils.isDebugMode()) {
      Object.keys(version).forEach(function (key) {
        delete version[key]["sequenceNumber"];
      });
    }
    let msg = `New version uploaded for EdgeWorker Id: ${ewId}`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
       edgeWorkersClientSvc.writeJSONOutput(0, msg, version);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(version);
    }
  }
  else {
    cliUtils.logAndExit(1, `ERROR: Code bundle was not able to be uploaded for EdgeWorker Id ${ewId} from ${tarballPath}`);
  }
}

async function validateNewVersion(bundlePath: string) {
  // first verify the tarball provided exists locally
  var bundle = await cliUtils.spinner(edgeWorkersClientSvc.validateTarballLocally(bundlePath), "Validating provided tarball exists");

  if (!bundle.tarballChecksum) {
    cliUtils.logAndExit(1, "ERROR: Checksum for EdgeWorkers bundle not found!");
  }
  else {
    //if all remains good, then send tarball to the Validation API for evaluation
    await validateEdgeWorkerVersion(bundle.tarballPath);
  }
}

async function validateEdgeWorkerVersion(tarballPath: string) {
  var hasErrors = true;
  var errors = await cliUtils.spinner(edgeWorkersSvc.validateTarball(tarballPath), `Validating new code bundle version from ${tarballPath}`);

  if (errors) {
    // take off outer layer of JSON envelope
    if (errors.hasOwnProperty("errors"))
        errors = errors["errors"];

    // if the Validation API returns successfully, but payload illustrates code bundle has errors, flag this as CLI failure
    if (JSON.stringify(errors) === '[]')
      hasErrors = false;

    var error = [];
    Object.keys(errors).forEach(function (key) {
      error.push(filterJsonData(errors[key], errorColumnsToKeep));
    });

    let msg = `Validation Errors for: ${tarballPath}`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(hasErrors ? 1 : 0, msg, error);
      // we want to set a failure exit code if the CLI executed successfully, but the Validation API indicated the code bundle is invalid
      if(hasErrors){
        process.exit(1);
      }
    }
    else {
      if(hasErrors) {
        cliUtils.logWithBorder(msg);
        console.table(error);
        cliUtils.logAndExit(1,'');
      }
      else
        cliUtils.logAndExit(0, `INFO: Tarball ${tarballPath} is valid!`);
    }
  }
  else {
    cliUtils.logAndExit(1, `ERROR: Code bundle was not able to be validated from path: ${tarballPath}`);
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
    cliUtils.logAndExit(0, `INFO: File saved @ ${pathToStore}`);
  }
  else {
    cliUtils.logAndExit(1, `ERROR: Code bundle for EdgeWorker Id ${ewId}, version ${versionId} was not able to be saved @ ${pathToStore}`);
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

    let msg = `The following EdgeWorker Activations currently exist for account: ${accountId}, ewId: ${ewId}, version: ${versionId}, activationId: ${activationId}`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
       edgeWorkersClientSvc.writeJSONOutput(0, msg, activation);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(activation);
    }
  }
  else {
    cliUtils.logAndExit(0, `INFO: There are currently no Activations for ewId: ${ewId}, version: ${versionId}, activationId: ${activationId}`);
  }
}

async function createNewActivation(ewId: string, network: string, versionId: string) {
  var activations = await cliUtils.spinner(edgeWorkersSvc.createActivationId(ewId, network, versionId), `Creating Activation record for EdgeWorker Id ${ewId}, version: ${versionId} on network: ${network}`);

  if (activations) {
    activations = [activations];
    var activation = [];
    Object.keys(activations).forEach(function (key) {
      activation.push(filterJsonData(activations[key], activationColumnsToKeep));
    });
    let msg = `New Activation record created for EdgeWorker Id: ${ewId}, version: ${versionId}, on network: ${network}`;
    if(edgeWorkersClientSvc.isJSONOutputMode()) {
       edgeWorkersClientSvc.writeJSONOutput(0, msg, activation);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(activation);
    }
  }
  else {
    cliUtils.logAndExit(1, `ERROR: Activation record was not able to be created for EdgeWorker Id ${ewId}, version: ${versionId} on network: ${network}!`);
  }
}

async function createAuthToken(secretKey: string, path: string, expiry: number, isACL: boolean) {

  // Time calculations
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + (expiry * 60);

  var acl=path;
  var field_delimiter = "~";
  var new_token = "";
  var hmac_token = "";

  new_token += `st=${startTime}`;
  new_token += field_delimiter;
  new_token += `exp=${endTime}`;

  if(isACL) {
    new_token += field_delimiter;
    new_token += `acl=${acl}`;
    hmac_token = new_token;
  } else {
    hmac_token = new_token + field_delimiter + "url=" + escape(path);
  }

  const hexedSecretKey = CryptoJS.enc.Hex.parse(secretKey);
  const hash = CryptoJS.HmacSHA256(hmac_token, hexedSecretKey);
  const hashStr = CryptoJS.enc.Hex.stringify(hash);
  var auth_token = new_token + field_delimiter + `hmac=${hashStr}`;

  let msg = "Akamai-EW-Trace: " + auth_token;
  if(edgeWorkersClientSvc.isJSONOutputMode()) {
    edgeWorkersClientSvc.writeJSONOutput(0, msg);
  } else {
    cliUtils.logWithBorder("\nAdd the following request header to your requests to get additional trace information.\nAkamai-EW-Trace: " + auth_token + "\n");
  }
}

async function generateRandomSecretKey(length: number) {
  var randomToken = CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
  let secretToken = `Secret: ${randomToken}`;
  let msg = `The following secret can be used to generate auth token or be used in the variable "PMUSER_EW_DEBUG_KEY" in the property.\n `+secretToken;
  if(edgeWorkersClientSvc.isJSONOutputMode()) {
    edgeWorkersClientSvc.writeJSONOutput(0, secretToken);
  } else {
  cliUtils.logWithBorder(msg);
  }
}

function escape(tokenComponent: string) {
  return encodeURIComponent(tokenComponent).toLowerCase();
}