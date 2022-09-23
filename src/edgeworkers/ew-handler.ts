import * as path from 'path';
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as edgeWorkersSvc from './ew-service';
import * as edgeWorkersClientSvc from './client-manager';
const readline = require('readline-sync');

var CryptoJS = require('crypto-js');
const groupColumnsToKeep = ['groupId', 'groupName', 'capabilities'];
const idColumnsToKeep = ['edgeWorkerId', 'name', 'groupId', 'resourceTierId'];
const clonedColumnsToKeep = [
  'edgeWorkerId',
  'name',
  'groupId',
  'resourceTierId',
  'sourceEdgeWorkerId',
  'createdBy',
  'createdTime',
];
const versionColumnsToKeep = [
  'edgeWorkerId',
  'version',
  'checksum',
  'createdBy',
  'createdTime',
  'sequenceNumber',
];
const activationColumnsToKeep = [
  'edgeWorkerId',
  'version',
  'activationId',
  'status',
  'network',
  'createdBy',
  'createdTime',
];
const deactivationColumnsToKeep = [
  'edgeWorkerId',
  'version',
  'deactivationId',
  'status',
  'network',
  'createdBy',
  'createdTime',
];
const resourceTierColumnsToKeep = [
  'resourceTierId',
  'resourceTierName',
  'edgeWorkerLimits',
];
const errorColumnsToKeep = ['type', 'message'];

export async function showGroupOverview(groupId: string) {
  var groups = null;
  var group = [];

  if (!groupId) {
    groups = await cliUtils.spinner(
      edgeWorkersSvc.getAllGroups(),
      'Fetching Permission Groups...'
    );
    // remove outer envelope of JSON data
    if (groups.hasOwnProperty('groups')) groups = groups['groups'];
  } else {
    groups = await cliUtils.spinner(
      edgeWorkersSvc.getGroup(groupId),
      `Fetching info for Permission Group ${groupId}`
    );
    groups = [groups];
  }

  // check if groupId was empty for messaging
  if (groupId === undefined || groupId === null) groupId = 'any';

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (groups.length > 0) {
    Object.keys(groups).forEach(function (key) {
      group.push(filterJsonData(groups[key], groupColumnsToKeep));
    });

    let msg = `User has the following Permission Group access for group: ${groupId}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, group);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(group);
    }
  } else {
    cliUtils.logAndExit(
      0,
      `INFO: There is currently no Permission Group info for group: ${groupId}`
    );
  }
}

export async function showEdgeWorkerIdOverview(
  ewId: string,
  groupId: string,
  resourceTierId: string
) {
  var ids = null;
  var id = [];
  var accountId: string = '';

  if (!ewId) {
    ids = await cliUtils.spinner(
      edgeWorkersSvc.getAllEdgeWorkerIds(groupId, resourceTierId),
      'Fetching EdgeWorker Ids...'
    );
    // remove outer envelope of JSON data
    if (ids.hasOwnProperty('edgeWorkerIds')) ids = ids['edgeWorkerIds'];
  } else {
    console.log(
      `INFO: Since EdgeWorker Id (${ewId}) was provided, ignoring unnecessary Group Id, group: ${groupId}...`
    );
    groupId = null;
    ids = await cliUtils.spinner(
      edgeWorkersSvc.getEdgeWorkerId(ewId),
      `Fetching info for EdgeWorker Id ${ewId}`
    );
    ids = [ids];
  }

  // check if groupId was empty for messaging
  if (groupId === undefined || groupId === null) groupId = 'any';

  // check if ewId was empty for messaging
  if (ewId === undefined || ewId === null) ewId = 'any';

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (ids.length > 0 && !ids.isError) {
    // accountid should be consistent across returned data set so grab value for messaging from first array element
    accountId = ids[0]['accountId'];

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
    } else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  } else if (ids.isError) {
    cliUtils.logAndExit(1, ids.error_reason);
  } else {
    cliUtils.logAndExit(
      0,
      `INFO: There is currently no EdgeWorker Id info for group: ${groupId}, ewId: ${ewId}`
    );
  }
}

export async function updateEdgeWorkerInfo(
  ewId: string,
  groupId: string,
  name: string,
  resourceTierId?: string
) {
  var ids = await cliUtils.spinner(
    edgeWorkersSvc.updateEdgeWorkerId(ewId, groupId, name, resourceTierId),
    `Updating info for EdgeWorker Id ${ewId}`
  );

  if (ids && !ids.isError) {
    ids = [ids];
    var id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    let msg = `Updated EdgeWorker Id info for ewId: ${ewId}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  } else {
    cliUtils.logAndExit(1, ids.error_reason);
  }
}

export async function deleteEdgeWorkerId(ewId: string, noPrompt: boolean) {
  if (noPrompt !== undefined) {
    var deletion = await cliUtils.spinner(
      edgeWorkersSvc.deleteEdgeWorkerId(ewId),
      `Deleting EdgeWorker Id ${ewId}`
    );
  } else {
    if (
      readline.keyInYN(
        `Have you checked to make sure that EdgeWorker Id ${ewId} is not in use on any active properties? You can check for active properties by using the list-properties command.`
      )
    ) {
      var deletion = await cliUtils.spinner(
        edgeWorkersSvc.deleteEdgeWorkerId(ewId),
        `Deleting EdgeWorker Id ${ewId}`
      );
    } else {
      cliUtils.logAndExit(1, `Deletion of EdgeWorker Id ${ewId} cancelled.`);
    }
  }

  if (!deletion.isError) {
    let msg = `EdgeWorker ${ewId} was successfully deleted.`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, [{}]);
    } else {
      cliUtils.logWithBorder(msg);
    }
  } else {
    cliUtils.logAndExit(1, deletion.error_reason);
  }
}

export async function getResourceTierInfo() {
  // get contract list
  let contractList = await cliUtils.spinner(
    getContractIds(),
    "Retrieving contract id's..."
  );
  if (contractList == undefined) {
    cliUtils.logAndExit(
      1,
      'ERROR: Unable to retrieve contract ids for your account.'
    );
  }

  let contractId = readline.keyInSelect(
    contractList,
    'Please select from the above contract ids :'
  );
  let selectedOption = contractId == -1 ? 'cancel' : contractList[contractId];
  console.log('You have selected ' + selectedOption);
  if (contractList[contractId] == undefined) {
    cliUtils.logAndExit(1, 'ERROR: Please select a valid contract id');
  }
  let resourceTierList = await getResourceTierList(contractList[contractId]);

  cliUtils.log('\nResource Tiers');
  let resourceIds = [];
  resourceTierList.forEach(function (resTier, index) {
    console.log(
      index +
        1 +
        '. Resource Tier ' +
        resTier['resourceTierId'] +
        ' ' +
        resTier['resourceTierName'] +
        '\n'
    );
    resourceIds.push(resTier['resourceTierId']);
    let ewLimit = resTier['edgeWorkerLimits'];
    ewLimit.forEach(function (limit) {
      console.log(
        limit['limitName'] + ': ' + cliUtils.getFormattedValue(limit)
      );
    });
    console.log(); // adding line break
  });

  let resourceTrIdx = readline.keyInSelect(
    resourceIds,
    'Please select from the above resource tier ids'
  );
  return resourceIds[resourceTrIdx];
}

/**
 * This helper method is reused by both get contracts and in create edgeworker
 * @returns contract id list
 */
async function getContractIds() {
  let contractIdList = await cliUtils.spinner(
    edgeWorkersSvc.getContracts(),
    "Retrieving contract id's..."
  );
  if (contractIdList && !contractIdList.isError) {
    let contractIds = contractIdList['contractIds'];
    if (contractIds.length == 0) {
      cliUtils.logAndExit(1, 'Unable to retrieve contracts for your account.');
    }
    return contractIdList['contractIds'];
  } else {
    cliUtils.logAndExit(1, contractIdList.error_reason);
  }
}

export async function getContracts() {
  let contractIdList = await getContractIds();
  if (contractIdList != undefined) {
    let msg = "List of contract id's associated with this account";
    let contractList = [];
    contractIdList.forEach(function (value) {
      contractList.push({ ContractIds: value });
    });
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, contractList);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(contractList);
    }
  } else {
    cliUtils.logAndExit(
      1,
      'ERROR: Unable to retrieve contracts for your account.'
    );
  }
}

export async function getProperties(ewId: string, activeOnly: boolean) {
  let propList = await cliUtils.spinner(
    edgeWorkersSvc.getProperties(ewId, activeOnly),
    `Retrieving properties for EdgeWorker Id ${ewId}...`
  );
  if (propList && !propList.isError) {
    const properties = propList.properties;

    if (properties.length > 0) {
      let msg = `The following properties are associated with the EdgeWorker Id ${ewId}`;

      if (edgeWorkersClientSvc.isJSONOutputMode()) {
        edgeWorkersClientSvc.writeJSONOutput(0, msg, propList);
      } else {
        cliUtils.logWithBorder(msg);
        console.table(properties);
        console.log(
          `limitedAccessToProperties: ${propList.limitedAccessToProperties}`
        );
      }
    } else {
      const optionalParam = activeOnly ? ' active ' : ' ';
      cliUtils.logAndExit(
        0,
        `INFO: There are currently no${optionalParam}properties associated with the EdgeWorker Id: ${ewId}`
      );
    }
  } else {
    cliUtils.logAndExit(1, propList.error_reason);
  }
}

export async function getResourceTiers(contractId?: string) {
  if (!contractId) {
    let contractIdList = await getContractIds();
    if (contractIdList == undefined) {
      cliUtils.logAndExit(
        1,
        'ERROR: Unable to retrieve contracts for your account.'
      );
    } else {
      let contractOption = readline.keyInSelect(
        contractIdList,
        'Please select from the above contract ids :'
      );
      contractId = contractIdList[contractOption];
      let selectedOption = contractOption == -1 ? 'cancel' : contractId;
      console.log('You have selected ' + selectedOption);
      if (contractId == undefined) {
        cliUtils.logAndExit(1, 'ERROR: Please select a valid contract id');
      }
    }
  }

  let resourceTierList = await getResourceTierList(contractId);
  if (resourceTierList) {
    let msg = `The following Resource Tiers available for the contract id ${contractId}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, resourceTierList);
    } else {
      cliUtils.logWithBorder(msg);
      resourceTierList.forEach(function (resTier, index) {
        console.log(
          index +
            1 +
            '. ResourceTier ' +
            resTier['resourceTierId'] +
            ' - ' +
            resTier['resourceTierName']
        );
        let ewLimit = resTier['edgeWorkerLimits'];
        ewLimit.forEach(function (limit) {
          console.log(
            limit['limitName'] + ': ' + cliUtils.getFormattedValue(limit)
          );
        });
        console.log();
      });
    }
  }
}

export async function getResourceTierForEwid(ewId: string) {
  let resourceTier = await cliUtils.spinner(
    edgeWorkersSvc.getResourceTierForEwid(ewId),
    `Retrieving resource tier for Edgeworker id ${ewId}...`
  );
  if (resourceTier && !resourceTier.isError) {
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      let msg = `The following resource tier is associated with the edgeworker id ${ewId}`;
      edgeWorkersClientSvc.writeJSONOutput(0, msg, resourceTier);
    } else {
      let keyVal =
        'ResourceTier ' +
        resourceTier['resourceTierId'] +
        ' - ' +
        resourceTier['resourceTierName'];
      cliUtils.logWithBorder(keyVal);
      let ewLimit = resourceTier['edgeWorkerLimits'];
      ewLimit.forEach(function (limit) {
        console.log(
          limit['limitName'] + ': ' + cliUtils.getFormattedValue(limit)
        );
      });
    }
  } else {
    cliUtils.logAndExit(1, resourceTier.error_reason);
  }
}

async function getResourceTierList(contractId) {
  let resourceTierList = await cliUtils.spinner(
    edgeWorkersSvc.getResourceTiers(contractId),
    `Retrieving resource tiers for contract id ${contractId}...`
  );
  if (!resourceTierList.isError) {
    if (resourceTierList['resourceTiers'].length == 0) {
      cliUtils.logAndExit(
        1,
        `Unable to retrieve resource tiers for your contract id ${contractId}.`
      );
    } else {
      return resourceTierList['resourceTiers'];
    }
  } else {
    cliUtils.logAndExit(1, resourceTierList.error_reason);
  }
}

export async function createEdgeWorkerId(
  groupId: string,
  name: string,
  resourceTierId: string
) {
  var ids = await cliUtils.spinner(
    edgeWorkersSvc.createEdgeWorkerId(groupId, name, resourceTierId),
    `Creating new EdgeWorker Id in group: ${groupId}, with name: ${name}`
  );

  if (ids && !ids.isError) {
    ids = [ids];
    var id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    let msg = `Created new EdgeWorker Identifier:`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  } else {
    cliUtils.logAndExit(1, ids.error_reason);
  }
}

export async function showEdgeWorkerIdVersionOverview(
  ewId: string,
  options?: { versionId?: string; showResult?: boolean }
) {
  var versions = null;
  var version = [];
  var accountId: string = '';
  var versionId = options.versionId;
  var showResult: boolean =
    options.showResult != null && options.showResult != undefined
      ? options.showResult
      : true;

  if (!versionId) {
    versions = await cliUtils.spinner(
      edgeWorkersSvc.getAllVersions(ewId),
      `Fetching all Versions for EdgeWorker Id ${ewId}`
    );
    // remove outer envelope of JSON data
    if (versions.hasOwnProperty('versions')) versions = versions['versions'];
  } else {
    versions = await cliUtils.spinner(
      edgeWorkersSvc.getVersionId(ewId, versionId),
      `Fetching Version ${versionId} for EdgeWorker Id ${ewId}`
    );
    versions = [versions];
  }
  // check if versionId was empty for messaging
  if (versionId === undefined || versionId === null) versionId = 'any';

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (versions.length > 0) {
    // accountid should be consistent across returned data set so grab value for messaging from first array element
    accountId = versions[0]['accountId'];

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
        delete version[key]['sequenceNumber'];
      });
    }

    if (showResult) {
      let msg = `The following EdgeWorker Versions are currently registered for account: ${accountId}, ewId: ${ewId}, version: ${versionId}`;
      if (edgeWorkersClientSvc.isJSONOutputMode()) {
        edgeWorkersClientSvc.writeJSONOutput(0, msg, version);
      } else {
        cliUtils.logWithBorder(msg);
        console.table(version);
      }
    } else {
      return version;
    }
  } else {
    if (showResult) {
      cliUtils.logAndExit(
        0,
        `INFO: There are currently no Versions for this EdgeWorker Id: ${ewId}`
      );
    } else {
      return [];
    }
  }
}

export async function createNewVersion(
  ewId: string,
  options: { bundle?: string; codeDir?: string }
) {
  var bundle = null;
  var versions = null;
  var matchedVersion = null;
  var checksumMatches = false;

  // Depending on options used, validate or build tarball from code files
  // New Validation API is run during code bundle upload so no need to explicitly validate the provided tarball locally, rather delegate that to the OPEN API
  // However we still need to ensure the tarball exists locally if provided
  if (options.bundle)
    bundle = await cliUtils.spinner(
      edgeWorkersClientSvc.validateTarballLocally(options.bundle),
      'Validating provided tarball exists'
    );
  else
    bundle = await cliUtils.spinner(
      edgeWorkersClientSvc.buildTarball(ewId, options.codeDir),
      'Building tarball from working directory code'
    );

  //compare checksum to existing tarballs already uploaded - if matches fail indicating which version matched
  if (!bundle.tarballChecksum) {
    cliUtils.logAndExit(1, 'ERROR: Checksum for EdgeWorkers bundle not found!');
  } else {
    // fetch all versions for given ewID
    versions = await showEdgeWorkerIdVersionOverview(ewId, {
      showResult: false,
    });

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
        errorInfo.push(['error_info', 'value']);
        errorInfo.push(['bundle', bundle.tarballPath]);
        errorInfo.push(['new checksum', bundle.tarballChecksum]);
        errorInfo.push([
          'matched id and version',
          ewId + ' / v' + matchedVersion['version'],
        ]);
        errorInfo.push(['matched checksum', matchedVersion['checksum']]);
        console.table(errorInfo[0], errorInfo.slice(1));
      } else {
        errorValues = {
          bundle: bundle.tarballPath,
          new_checksum: bundle.tarballChecksum,
          matched_id_and_version: ewId + ' / v' + matchedVersion['version'],
          matched_checksum: matchedVersion['checksum'],
        };
      }
      cliUtils.logAndExit(
        1,
        `ERROR: Checksum for EdgeWorkers bundle provided matches existing version!`,
        [errorValues]
      );
    } else {
      //if all remains good, then upload tarball and output checksum and version number
      await uploadEdgeWorkerVersion(ewId, bundle.tarballPath);
    }
  }
}

export async function deleteVersion(
  ewId: string,
  versionId: string,
  noPrompt: boolean
) {
  if (noPrompt !== undefined) {
    var deletion = await cliUtils.spinner(
      edgeWorkersSvc.deleteVersion(ewId, versionId),
      `Deleting version ${versionId} of EdgeWorker Id ${ewId}`
    );
  } else {
    if (
      readline.keyInYN(
        `Are you sure you want to delete version ${versionId} of EdgeWorker Id ${ewId}?`
      )
    ) {
      var deletion = await cliUtils.spinner(
        edgeWorkersSvc.deleteVersion(ewId, versionId),
        `Deleting version ${versionId} of EdgeWorker Id ${ewId}`
      );
    } else {
      cliUtils.logAndExit(
        1,
        `Deletion of version ${versionId} of EdgeWorker Id ${ewId} cancelled.`
      );
    }
  }

  if (!deletion.isError) {
    let msg = `Version ${versionId} of Edgeworker Id ${ewId} was successfully deleted.`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, [{}]);
    } else {
      cliUtils.logWithBorder(msg);
    }
  } else {
    cliUtils.logAndExit(1, deletion.error_reason);
  }
}

export async function uploadEdgeWorkerVersion(
  ewId: string,
  tarballPath: string
) {
  var versions = await cliUtils.spinner(
    edgeWorkersSvc.uploadTarball(ewId, tarballPath),
    `Uploading new version for EdgeWorker Id ${ewId} from ${tarballPath}`
  );

  if (versions) {
    versions = [versions];
    var version = [];
    Object.keys(versions).forEach(function (key) {
      version.push(filterJsonData(versions[key], versionColumnsToKeep));
    });
    if (!envUtils.isDebugMode()) {
      Object.keys(version).forEach(function (key) {
        delete version[key]['sequenceNumber'];
      });
    }
    let msg = `New version uploaded for EdgeWorker Id: ${ewId}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, version);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(version);
    }
  } else {
    cliUtils.logAndExit(
      1,
      `ERROR: Code bundle was not able to be uploaded for EdgeWorker Id ${ewId} from ${tarballPath}`
    );
  }
}

export async function validateNewVersion(bundlePath: string) {
  // first verify the tarball provided exists locally
  var bundle = await cliUtils.spinner(
    edgeWorkersClientSvc.validateTarballLocally(bundlePath, true),
    'Validating provided tarball exists'
  );

  if (!bundle.tarballChecksum) {
    cliUtils.logAndExit(1, 'ERROR: Checksum for EdgeWorkers bundle not found!');
  } else {
    //if all remains good, then send tarball to the Validation API for evaluation
    await validateEdgeWorkerVersion(bundle.tarballPath);
  }
}

export async function validateEdgeWorkerVersion(tarballPath: string) {
  var hasErrors = true;
  var errors = await cliUtils.spinner(
    edgeWorkersSvc.validateTarball(tarballPath),
    `Validating new code bundle version from ${tarballPath}`
  );

  if (errors) {
    // take off outer layer of JSON envelope
    if (errors.hasOwnProperty('errors')) errors = errors['errors'];

    // if the Validation API returns successfully, but payload illustrates code bundle has errors, flag this as CLI failure
    if (JSON.stringify(errors) === '[]') hasErrors = false;

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
    } else {
      if (hasErrors) {
        cliUtils.logWithBorder(msg);
        console.table(error);
        cliUtils.logAndExit(1, '');
      } else cliUtils.logAndExit(0, `INFO: Tarball ${tarballPath} is valid!`);
    }
  } else {
    cliUtils.logAndExit(
      1,
      `ERROR: Code bundle was not able to be validated from path: ${tarballPath}`
    );
  }
}

export async function downloadTarball(
  ewId: string,
  versionId: string,
  rawDownloadPath?: string
) {
  // Determine where the tarball should be store
  var downloadPath = edgeWorkersClientSvc.determineTarballDownloadDir(
    ewId,
    rawDownloadPath
  );
  // Build tarball file name as ew_<version>_<now-as-epoch>.tgz
  var tarballFileName: string = `ew_${versionId}_${Date.now()}.tgz`;
  var pathToStore = path.join(downloadPath, tarballFileName);

  // First try to fetch tarball
  var wasDownloaded = await cliUtils.spinner(
    edgeWorkersSvc.downloadTarball(ewId, versionId, pathToStore),
    `Downloading code bundle for EdgeWorker Id ${ewId}, version ${versionId}`
  );

  // if tarball found, then figure out where to store it
  if (!wasDownloaded.isError) {
    cliUtils.logAndExit(0, `INFO: File saved @ ${pathToStore}`);
  } else {
    cliUtils.logAndExit(
      1,
      `ERROR: Code bundle for EdgeWorker Id ${ewId}, version ${versionId} was not saved. (${wasDownloaded.error_reason})`
    );
  }
}

export async function showEdgeWorkerActivationOverview(
  ewId: string,
  options?: { versionId?: string; activationId?: string }
) {
  var activations = null;
  var activation = [];
  var accountId: string = '';
  var versionId = options.versionId;
  var activationId = options.activationId;

  if (versionId) {
    activations = await cliUtils.spinner(
      edgeWorkersSvc.getVersionActivations(ewId, versionId),
      `Fetching all Activations for EdgeWorker Id ${ewId}, Version ${versionId}`
    );
    if (activations.hasOwnProperty('activations'))
      activations = activations['activations'];
  } else if (activationId) {
    activations = await cliUtils.spinner(
      edgeWorkersSvc.getActivationID(ewId, activationId),
      `Fetching Activation info for EdgeWorker Id ${ewId}, Activation Id ${activationId}`
    );
    activations = [activations];
  } else {
    activations = await cliUtils.spinner(
      edgeWorkersSvc.getAllActivations(ewId),
      `Fetching all Activations for EdgeWorker Id ${ewId}`
    );
    // remove outer envelope of JSON data
    if (activations.hasOwnProperty('activations'))
      activations = activations['activations'];
  }

  // check if versionId was empty for messaging
  if (versionId === undefined || versionId === null) versionId = 'any';

  // check if activationId was empty for messaging
  if (activationId === undefined || activationId === null) activationId = 'any';

  // If data was provided format it, otherwise submit an INFO statement that no data was provided
  if (activations.length > 0) {
    // accountid should be consistent across returned data set so grab value for messaging from first array element
    accountId = activations[0]['accountId'];

    Object.keys(activations).forEach(function (key) {
      activation.push(
        filterJsonData(activations[key], activationColumnsToKeep)
      );
    });

    let msg = `The following EdgeWorker Activations currently exist for account: ${accountId}, ewId: ${ewId}, version: ${versionId}, activationId: ${activationId}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, activation);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(activation);
    }
  } else {
    cliUtils.logAndExit(
      0,
      `INFO: There are currently no Activations for ewId: ${ewId}, version: ${versionId}, activationId: ${activationId}`
    );
  }
}

export async function createNewActivation(
  ewId: string,
  network: string,
  versionId: string
) {
  var activations = await cliUtils.spinner(
    edgeWorkersSvc.createActivationId(ewId, network, versionId),
    `Creating Activation record for EdgeWorker Id ${ewId}, version: ${versionId} on network: ${network}`
  );

  if (activations) {
    activations = [activations];
    var activation = [];
    Object.keys(activations).forEach(function (key) {
      activation.push(
        filterJsonData(activations[key], activationColumnsToKeep)
      );
    });
    let msg = `New Activation record created for EdgeWorker Id: ${ewId}, version: ${versionId}, on network: ${network}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, activation);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(activation);
    }
  } else {
    cliUtils.logAndExit(
      1,
      `ERROR: Activation record was not able to be created for EdgeWorker Id ${ewId}, version: ${versionId} on network: ${network}!`
    );
  }
}

export async function cloneEdgeworker(
  ewId: string,
  groupId: string,
  ewName: string,
  resourceTierId: string
) {
  let clonedEw = await cliUtils.spinner(
    edgeWorkersSvc.cloneEdgeworker(ewId, ewName, groupId, resourceTierId),
    'Cloning Edgeworker ...'
  );

  if (clonedEw && !clonedEw.isError) {
    let msg = `Cloned Edgeworker from Edgeworker id ${ewId} to resourceTier id ${resourceTierId}`;
    clonedEw = [clonedEw];
    var id = [];
    Object.keys(clonedEw).forEach(function (key) {
      id.push(filterJsonData(clonedEw[key], clonedColumnsToKeep));
    });
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, id);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  } else {
    cliUtils.logAndExit(1, clonedEw.error_reason);
  }
}

export async function deactivateEdgeworker(
  ewId: string,
  network: string,
  versionId: string
) {
  var deactivate = await cliUtils.spinner(
    edgeWorkersSvc.deactivateEdgeworker(ewId, network, versionId),
    `Deactivating Edgeworker for Id ${ewId}, version: ${versionId} on network: ${network}`
  );
  if (deactivate) {
    deactivate = [deactivate];
    var deactivation = [];
    Object.keys(deactivate).forEach(function (key) {
      deactivation.push(
        filterJsonData(deactivate[key], deactivationColumnsToKeep)
      );
    });
    let msg = `EdgeWorker deactivated for Id: ${ewId}, version: ${versionId}, on network: ${network}`;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, deactivate);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(deactivate);
    }
  } else {
    cliUtils.logAndExit(
      1,
      `ERROR: Unable to deactivate EdgeWorker for Id ${ewId}, version: ${versionId} on network: ${network}!`
    );
  }
}

export async function createAuthToken(
  hostName: string,
  options?: {
    acl?: string;
    url?: string;
    expiry?: number;
    network?: string;
    format?;
  }
) {
  if (options.expiry) {
    validateExpiry(options.expiry);
  }

  if (options.acl && options.url) {
    cliUtils.logAndExit(
      1,
      'ERROR: The --acl and --url parameters are mutually exclusive; please use only one parameter. Specifying neither will result in a default value for the --acl parameter being used.'
    );
  }

  if (options.network) {
    let network = options.network;
    if (
      network.toUpperCase() !== cliUtils.staging &&
      network.toUpperCase() !== cliUtils.production
    ) {
      cliUtils.logAndExit(
        1,
        `ERROR: Network parameter must be either staging or production - was: ${network}`
      );
    }
  }
  let authToken = await cliUtils.spinner(
    edgeWorkersSvc.getAuthToken(
      hostName,
      options.acl,
      options.url,
      options.expiry,
      options.network
    ),
    'Creating auth token ...'
  );
  if (authToken && !authToken.isError) {
    Object.keys(authToken).forEach(function (key) {
      authToken = authToken[key];
    });
    let token = 'Akamai-EW-Trace: ' + authToken;
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, token);
    } else if (options.format && options.format == 'curl') {
      cliUtils.log(`-H '${token}'`);
    } else {
      cliUtils.logWithBorder(
        '\nAdd the following request header to your requests to get additional trace information.\n' +
          token +
          '\n'
      );
    }
  } else {
    cliUtils.logAndExit(1, authToken.error_reason);
  }
}

export async function generateRandomSecretKey(length: number) {
  const randomToken = CryptoJS.lib.WordArray.random(length).toString(
    CryptoJS.enc.Hex
  );
  const secretToken = `Secret: ${randomToken}`;
  const msg =
    `The following secret can be used to generate auth token or be used in the variable "PMUSER_EW_DEBUG_KEY" in the property.\n ` +
    secretToken;
  if (edgeWorkersClientSvc.isJSONOutputMode()) {
    edgeWorkersClientSvc.writeJSONOutput(0, secretToken);
  } else {
    cliUtils.logWithBorder(msg);
  }
}

export async function getAvailableReports() {
  const availableReports = await cliUtils.spinner(
    edgeWorkersSvc.getAvailableReports(),
    'Getting list of available reports...'
  );

  if (availableReports && !availableReports.isError) {
    const msg = 'The following reports are available:';
    const reportList = availableReports.reports.map((report)=>{
      return {ReportId: report.reportId, ReportType: report.name};
    });
    
    if (edgeWorkersClientSvc.isJSONOutputMode()) {
      edgeWorkersClientSvc.writeJSONOutput(0, msg, reportList);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(reportList);
    }
  } else {
    cliUtils.logAndExit(1, availableReports.error_reason);
  }
}

const getExecutionAverages = (executionArray, executionKey: string) => {
  if (executionArray){
    let totalAvg = 0, totalInvocations = 0, eventMax = -1, eventMin = Number.MAX_SAFE_INTEGER;
    for (const execution of executionArray){
      const {avg, min, max} = execution[executionKey];

      totalAvg += avg * execution.invocations;
      totalInvocations += execution.invocations;
      eventMin = Math.min(eventMin, min);
      eventMax = Math.max(eventMax, max);
    }
    return {
      avg: (totalAvg / totalInvocations).toFixed(5),
      min: eventMin.toFixed(2),
      max: eventMax.toFixed(2)
    };
  } else {
    return {
      avg: 'N/A',
      min: 'N/A',
      max: 'N/A'
    };
  }
};

interface ExecutionCategoriesArray {
  [index: number]: { 
    invocations: number
  };
}

export async function getReport(
  reportId: number,
  start: string,
  end:string,
  ewid: string,
  statuses: Array<string>,
  eventHandlers: Array<string>,
  ) {
  const report = await cliUtils.spinner(
    edgeWorkersSvc.getReport(reportId, start, end, ewid, statuses, eventHandlers),
    'Getting report...'
  );

  const EVENT_HANDLERS = ['onClientRequest', 'onOriginRequest', 'onOriginResponse', 'onClientResponse', 'responseProvider'];
  let executionEventHandlers;
  if (eventHandlers.length !== 0){
    executionEventHandlers = EVENT_HANDLERS.filter((event) => eventHandlers.includes(event));
  } else {
    executionEventHandlers = EVENT_HANDLERS;
  }
  

  if (report && !report.isError) {
    const data: Record<string, unknown> = report.data;
    if (typeof data === 'object' && Object.keys(data).length === 0) {
      // check if data is empty object or empty array
      cliUtils.logWithBorder(`${report.name} from ${report.start} to ${report.end} has no data`);
    } else {
      const msg = `Printing ${report.name} from ${report.start} to ${report.end}`;
      cliUtils.logWithBorder(msg);
      let reportOutput;
      switch (report.reportId){
        case 1: {
          // summary
          const {
            memory,
            initDuration,
            execDuration,
            successes,
            errors,
            invocations
          } = report.data;
          const initDurationMapped = initDuration ? initDuration : {avg: 'N/A', max: 'N/A', min: 'N/A'};
          
          reportOutput = [
            {successes, errors, invocations},
            {initDuration: initDurationMapped, execDuration},
            {memory}
          ];
          break;
        }
  
        case 2: {
          //execution time
          reportOutput = {};
          const executionCategories: ExecutionCategoriesArray = report.data[0].data;

          for (const event of executionEventHandlers) {
            reportOutput[event] = getExecutionAverages(executionCategories[event], 'execDuration');
          }
          // execution time has an additional property for init times
          reportOutput['init'] = getExecutionAverages(executionCategories['init'], 'initDuration');
          
          break;
        }

        case 3: {
          //execution status
          reportOutput = {};
          const executionCategories: ExecutionCategoriesArray = report.data[0].data;
          let errors = 0;
  
          for (const executionArray of Object.values(executionCategories)) {
            for (const execution of executionArray) {
              const {status, invocations} = execution;
              reportOutput[status] = reportOutput[status] + invocations || invocations;
              if (status !== 'success') {
                errors += invocations;
              }
            }
          }
          
          if (!reportOutput['success']){
            // add success count if no successful executions
            reportOutput['success'] = 0;
          }
          //add property for total errors
          reportOutput['errors'] = errors;

          break;
        }

        case 4: {
          //memory usage
          reportOutput = {};
          const executionCategories: ExecutionCategoriesArray = report.data[0].data;
  
          for (const event of executionEventHandlers) {
            reportOutput[event] = getExecutionAverages(executionCategories[event], 'memory');
          }

          break;
        }
      }
      if (edgeWorkersClientSvc.isJSONOutputMode()) {
        edgeWorkersClientSvc.writeJSONOutput(0, msg, reportOutput);
      } else {
        if (Array.isArray(reportOutput)){
          // report 1 (summary) will return an array of table objects
          reportOutput.forEach( (table) => console.table(table));
        } else {
          console.table(reportOutput);
        }
      }
    }
  } else {
    cliUtils.logAndExit(1, report.error_reason);
  }
}

/* ========== Local Helpers ========== */
function filterJsonData(data, columnsToKeep: string[]) {
  //Dont filter data if in debug mode
  if (!envUtils.isDebugMode()) {
    Object.keys(data).forEach(function (key) {
      if (columnsToKeep.indexOf(key) == -1) delete data[key];
    });
  }
  return data;
}

function validateExpiry(expiry) {
  expiry = parseInt(expiry);
  if (isNaN(expiry)) {
    cliUtils.logAndExit(
      1,
      'ERROR: The expiry is invalid. It must be an integer value (in minutes) representing the duration of the validity of the token.'
    );
  } else if (expiry < 1 || expiry > 720) {
    cliUtils.logAndExit(
      1,
      'ERROR: The expiry is invalid. It must be an integer value (in minutes) between 1 and 720 minutes (12 hours).'
    );
  }
}
