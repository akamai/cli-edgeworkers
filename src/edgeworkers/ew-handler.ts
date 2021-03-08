import * as path from "path";
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as edgeWorkersSvc from './ew-service';
import * as edgeWorkersClientSvc from './client-manager';
require('console.table');

var CryptoJS = require("crypto-js");
const groupColumnsToKeep = ["groupId", "groupName", "capabilities"];
const idColumnsToKeep = ["edgeWorkerId", "name", "groupId"];
const versionColumnsToKeep = ["edgeWorkerId", "version", "checksum", "createdBy", "createdTime", "sequenceNumber"];
const activationColumnsToKeep = ["edgeWorkerId", "version", "activationId", "status", "network", "createdBy", "createdTime"];
const deactivationColumnsToKeep = ["edgeWorkerId", "version", "deactivationId", "status", "network", "createdBy", "createdTime"];
const errorColumnsToKeep = ["type", "message"];

export async function showGroupOverview(groupId: string) {
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
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
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

export async function showEdgeWorkerIdOverview(ewId: string, groupId: string) {
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
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
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

export async function updateEdgeWorkerInfo(ewId: string, groupId: string, name: string) {
  var ids = await cliUtils.spinner(edgeWorkersSvc.updateEdgeWorkerId(ewId, groupId, name), `Updating info for EdgeWorker Id ${ewId}`);

  if (ids) {
    ids = [ids];
    var id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    let msg = `Updated EdgeWorker Id info for ewId: ${ewId}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  }
}

export async function createEdgeWorkerId(groupId: string, name: string) {
  var ids = await cliUtils.spinner(edgeWorkersSvc.createEdgeWorkerId(groupId, name), `Creating new EdgeWorker Id in group: ${groupId}, with name: ${name}`);

  if (ids) {
    ids = [ids];
    var id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    let msg = `Created new EdgeWorker Identifier:`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  }
}

export async function showEdgeWorkerIdVersionOverview(ewId: string, options?: { versionId?: string, showResult?: boolean }) {
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
      if (edgeWorkersClientSvc.isJSONOutputMode()) {
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

export async function createNewVersion(ewId: string, options: { bundle?: string, codeDir?: string }) {
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
      if (!edgeWorkersClientSvc.isJSONOutputMode()) {
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

export async function uploadEdgeWorkerVersion(ewId: string, tarballPath: string) {

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
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
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

export async function validateNewVersion(bundlePath: string) {
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

export async function validateEdgeWorkerVersion(tarballPath: string) {
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
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(hasErrors ? 1 : 0, msg, error);
      // we want to set a failure exit code if the CLI executed successfully, but the Validation API indicated the code bundle is invalid
      if (hasErrors) {
        process.exit(1);
      }
    }
    else {
      if (hasErrors) {
        cliUtils.logWithBorder(msg);
        console.table(error);
        cliUtils.logAndExit(1, '');
      }
      else
        cliUtils.logAndExit(0, `INFO: Tarball ${tarballPath} is valid!`);
    }
  }
  else {
    cliUtils.logAndExit(1, `ERROR: Code bundle was not able to be validated from path: ${tarballPath}`);
  }
}

export async function downloadTarball(ewId: string, versionId: string, rawDownloadPath?: string) {
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

export async function showEdgeWorkerActivationOverview(ewId: string, options?: { versionId?: string, activationId?: string }) {
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
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
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

export async function createNewActivation(ewId: string, network: string, versionId: string) {
  var activations = await cliUtils.spinner(edgeWorkersSvc.createActivationId(ewId, network, versionId), `Creating Activation record for EdgeWorker Id ${ewId}, version: ${versionId} on network: ${network}`);

  if (activations) {
    activations = [activations];
    var activation = [];
    Object.keys(activations).forEach(function (key) {
      activation.push(filterJsonData(activations[key], activationColumnsToKeep));
    });
    let msg = `New Activation record created for EdgeWorker Id: ${ewId}, version: ${versionId}, on network: ${network}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
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

export async function deactivateEdgeworker(ewId: string, network: string, versionId: string) {
  var deactivate = await cliUtils.spinner(edgeWorkersSvc.deactivateEdgeworker(ewId, network, versionId), `Deactivating Edgeworker for Id ${ewId}, version: ${versionId} on network: ${network}`);
  if (deactivate) {
    deactivate = [deactivate];
    var deactivation = [];
    Object.keys(deactivate).forEach(function (key) {
      deactivation.push(filterJsonData(deactivate[key], deactivationColumnsToKeep));
    });
    let msg = `EdgeWorker deactivated for Id: ${ewId}, version: ${versionId}, on network: ${network}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, deactivate);
    }
    else {
      cliUtils.logWithBorder(msg);
      console.table(deactivate);
    }
  }
  else {
    cliUtils.logAndExit(1, `ERROR: Unable to deactivate EdgeWorker for Id ${ewId}, version: ${versionId} on network: ${network}!`);
  }
}

export async function createAuthToken(secretKey: string, path: string, expiry: number, isACL: boolean, format) {

  // Time calculations
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + (expiry * 60);

  var acl = path;
  var field_delimiter = "~";
  var new_token = "";
  var hmac_token = "";

  new_token += `st=${startTime}`;
  new_token += field_delimiter;
  new_token += `exp=${endTime}`;

  if (isACL) {
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
  if (edgeWorkersClientSvc.isJSONOutputMode()) {
    edgeWorkersClientSvc.writeJSONOutput(0, msg);
  } else if (format == "curl") {
    cliUtils.log(`-H ${auth_token}`)
  } else {
    cliUtils.logWithBorder("\nAdd the following request header to your requests to get additional trace information.\nAkamai-EW-Trace: " + auth_token + "\n");
  }
}

export async function generateRandomSecretKey(length: number) {
  var randomToken = CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
  let secretToken = `Secret: ${randomToken}`;
  let msg = `The following secret can be used to generate auth token or be used in the variable "PMUSER_EW_DEBUG_KEY" in the property.\n ` + secretToken;
  if (edgeWorkersClientSvc.isJSONOutputMode()) {
    edgeWorkersClientSvc.writeJSONOutput(0, secretToken);
  } else {
    cliUtils.logWithBorder(msg);
  }
}

function escape(tokenComponent: string) {
  return encodeURIComponent(tokenComponent).toLowerCase();
}

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