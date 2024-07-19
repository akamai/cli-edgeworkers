import * as path from 'path';
import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as edgeWorkersSvc from './ew-service';
import {ewJsonOutput, validateTarballLocally, buildTarball, determineTarballDownloadDir} from './client-manager';
import * as readline from 'readline-sync';
import * as chrono from 'chrono-node';

import CryptoJS from 'crypto-js';
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const resourceTierColumnsToKeep = [
  'resourceTierId',
  'resourceTierName',
  'edgeWorkerLimits',
];
const errorColumnsToKeep = ['type', 'message'];

export async function showGroupOverview(groupId: string) {
  let groups = null;
  const group = [];

  if (!groupId) {
    groups = await cliUtils.spinner(
      edgeWorkersSvc.getAllGroups(),
      'Fetching Permission Groups...'
    );
    // remove outer envelope of JSON data
    if (Object.prototype.hasOwnProperty.call(groups, 'groups')) {
      groups = groups['groups'];
    }
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

    const msg = `User has the following Permission Group access for group: ${groupId}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, group);
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
  let ids = null;
  const id = [];
  let accountId = '';

  if (!ewId) {
    ids = await cliUtils.spinner(
      edgeWorkersSvc.getAllEdgeWorkerIds(groupId, resourceTierId),
      'Fetching EdgeWorker Ids...'
    );
    // remove outer envelope of JSON data
    if (Object.prototype.hasOwnProperty.call(ids, 'edgeWorkerIds')) {
      ids = ids['edgeWorkerIds'];
    }
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
    const msg = `The following EdgeWorker Ids are currently registered for account: ${accountId}, group: ${groupId}, ewId: ${ewId}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, id);
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
  let ids = await cliUtils.spinner(
    edgeWorkersSvc.updateEdgeWorkerId(ewId, groupId, name, resourceTierId),
    `Updating info for EdgeWorker Id ${ewId}`
  );

  if (ids && !ids.isError) {
    ids = [ids];
    const id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    const msg = `Updated EdgeWorker Id info for ewId: ${ewId}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, id);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(id);
    }
  } else {
    cliUtils.logAndExit(1, ids.error_reason);
  }
}

export async function deleteEdgeWorkerId(ewId: string, noPrompt: boolean) {
  let deletion;
  if (noPrompt !== undefined) {
    deletion = await cliUtils.spinner(
      edgeWorkersSvc.deleteEdgeWorkerId(ewId),
      `Deleting EdgeWorker Id ${ewId}`
    );
  } else {
    if (
      readline.keyInYN(
        `Have you checked to make sure that EdgeWorker Id ${ewId} is not in use on any active properties? You can check for active properties by using the list-properties command.`
      )
    ) {
      deletion = await cliUtils.spinner(
        edgeWorkersSvc.deleteEdgeWorkerId(ewId),
        `Deleting EdgeWorker Id ${ewId}`
      );
    } else {
      cliUtils.logAndExit(1, `Deletion of EdgeWorker Id ${ewId} cancelled.`);
    }
  }

  if (!deletion.isError) {
    const msg = `EdgeWorker ${ewId} was successfully deleted.`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, [{}]);
    } else {
      cliUtils.logWithBorder(msg);
    }
  } else {
    cliUtils.logAndExit(1, deletion.error_reason);
  }
}

export async function getResourceTierInfo() {
  // get contract list
  const contractList = await cliUtils.spinner(
    getContractIds(),
    'Retrieving contract id\'s...'
  );
  if (contractList == undefined) {
    cliUtils.logAndExit(
      1,
      'ERROR: Unable to retrieve contract ids for your account.'
    );
  }

  const contractId = readline.keyInSelect(
    contractList,
    'Please select from the above contract ids :'
  );
  const selectedOption = contractId == -1 ? 'cancel' : contractList[contractId];
  console.log('You have selected ' + selectedOption);
  if (contractList[contractId] == undefined) {
    cliUtils.logAndExit(1, 'ERROR: Please select a valid contract id');
  }
  const resourceTierList = await getResourceTierList(contractList[contractId]);

  cliUtils.log('\nResource Tiers');
  const resourceIds = [];
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
    const ewLimit = resTier['edgeWorkerLimits'];
    ewLimit.forEach(function (limit) {
      console.log(
        limit['limitName'] + ': ' + cliUtils.getFormattedValue(limit)
      );
    });
    console.log(); // adding line break
  });

  const resourceTrIdx = readline.keyInSelect(
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
  const contractIdList = await cliUtils.spinner(
    edgeWorkersSvc.getContracts(),
    'Retrieving contract id\'s...'
  );
  if (contractIdList && !contractIdList.isError) {
    const contractIds = contractIdList['contractIds'];
    if (contractIds.length == 0) {
      cliUtils.logAndExit(1, 'Unable to retrieve contracts for your account.');
    }
    return contractIdList['contractIds'];
  } else {
    cliUtils.logAndExit(1, contractIdList.error_reason);
  }
}

export async function getContracts() {
  const contractIdList = await getContractIds();
  if (contractIdList != undefined) {
    const msg = 'List of contract id\'s associated with this account';
    const contractList = [];
    contractIdList.forEach(function (value) {
      contractList.push({ContractIds: value});
    });
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, contractList);
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
  const propList = await cliUtils.spinner(
    edgeWorkersSvc.getProperties(ewId, activeOnly),
    `Retrieving properties for EdgeWorker Id ${ewId}...`
  );
  if (propList && !propList.isError) {
    const properties = propList.properties;

    if (properties.length > 0) {
      const msg = `The following properties are associated with the EdgeWorker Id ${ewId}`;

      if (ewJsonOutput.isJSONOutputMode()) {
        ewJsonOutput.writeJSONOutput(0, msg, propList);
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
    const contractIdList = await getContractIds();
    if (contractIdList == undefined) {
      cliUtils.logAndExit(
        1,
        'ERROR: Unable to retrieve contracts for your account.'
      );
    } else {
      const contractOption = readline.keyInSelect(
        contractIdList,
        'Please select from the above contract ids :'
      );
      contractId = contractIdList[contractOption];
      const selectedOption = contractOption == -1 ? 'cancel' : contractId;
      console.log('You have selected ' + selectedOption);
      if (contractId == undefined) {
        cliUtils.logAndExit(1, 'ERROR: Please select a valid contract id');
      }
    }
  }

  const resourceTierList = await getResourceTierList(contractId);
  if (resourceTierList) {
    const msg = `The following Resource Tiers available for the contract id ${contractId}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, resourceTierList);
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
        const ewLimit = resTier['edgeWorkerLimits'];
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
  const resourceTier = await cliUtils.spinner(
    edgeWorkersSvc.getResourceTierForEwid(ewId),
    `Retrieving resource tier for Edgeworker id ${ewId}...`
  );
  if (resourceTier && !resourceTier.isError) {
    if (ewJsonOutput.isJSONOutputMode()) {
      const msg = `The following resource tier is associated with the edgeworker id ${ewId}`;
      ewJsonOutput.writeJSONOutput(0, msg, resourceTier);
    } else {
      const keyVal =
        'ResourceTier ' +
        resourceTier['resourceTierId'] +
        ' - ' +
        resourceTier['resourceTierName'];
      cliUtils.logWithBorder(keyVal);
      const ewLimit = resourceTier['edgeWorkerLimits'];
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
  const resourceTierList = await cliUtils.spinner(
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
  let ids = await cliUtils.spinner(
    edgeWorkersSvc.createEdgeWorkerId(groupId, name, resourceTierId),
    `Creating new EdgeWorker Id in group: ${groupId}, with name: ${name}`
  );

  if (ids && !ids.isError) {
    ids = [ids];
    const id = [];
    Object.keys(ids).forEach(function (key) {
      id.push(filterJsonData(ids[key], idColumnsToKeep));
    });
    const msg = 'Created new EdgeWorker Identifier:';
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, id);
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
  options?: {versionId?: string; showResult?: boolean}
) {
  let versions = null;
  const version = [];
  let accountId = '';
  let versionId = options.versionId;
  const showResult: boolean =
    options.showResult != null && options.showResult != undefined
      ? options.showResult
      : true;

  if (!versionId) {
    versions = await cliUtils.spinner(
      edgeWorkersSvc.getAllVersions(ewId),
      `Fetching all Versions for EdgeWorker Id ${ewId}`
    );
    // remove outer envelope of JSON data
    if (Object.prototype.hasOwnProperty.call(versions, 'versions')) {
      versions = versions['versions'];
    }
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
      const msg = `The following EdgeWorker Versions are currently registered for account: ${accountId}, ewId: ${ewId}, version: ${versionId}`;
      if (ewJsonOutput.isJSONOutputMode()) {
        ewJsonOutput.writeJSONOutput(0, msg, version);
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
  options: {bundle?: string; codeDir?: string}
) {
  let bundle = null;
  let versions = null;
  let matchedVersion = null;
  let checksumMatches = false;

  // Depending on options used, validate or build tarball from code files
  // New Validation API is run during code bundle upload so no need to explicitly validate the provided tarball locally, rather delegate that to the OPEN API
  // However we still need to ensure the tarball exists locally if provided
  if (options.bundle)
    bundle = await cliUtils.spinner(
      validateTarballLocally(options.bundle),
      'Validating provided tarball exists'
    );
  else
    bundle = await cliUtils.spinner(
      buildTarball(ewId, options.codeDir),
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
      if (!ewJsonOutput.isJSONOutputMode()) {
        const errorInfo = [];
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
        'ERROR: Checksum for EdgeWorkers bundle provided matches existing version!',
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
  let deletion;
  if (noPrompt !== undefined) {
    deletion = await cliUtils.spinner(
      edgeWorkersSvc.deleteVersion(ewId, versionId),
      `Deleting version ${versionId} of EdgeWorker Id ${ewId}`
    );
  } else {
    if (
      readline.keyInYN(
        `Are you sure you want to delete version ${versionId} of EdgeWorker Id ${ewId}?`
      )
    ) {
      deletion = await cliUtils.spinner(
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
    const msg = `Version ${versionId} of Edgeworker Id ${ewId} was successfully deleted.`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, [{}]);
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
  let versions;
  try {
    versions = await cliUtils.spinner(
      edgeWorkersSvc.uploadTarball(ewId, tarballPath),
      `Uploading new version for EdgeWorker Id ${ewId} from ${tarballPath}`
    );
  } catch (error) {
    const errorObj = JSON.parse(error);

    if (errorObj.type === '/edgeworkers/error-types/edgeworkers-invalid-argument') {
      return validateEdgeWorkerVersion(tarballPath);
    } else {
      cliUtils.logAndExit(
        1,
        `ERROR: Code bundle was not able to be uploaded for EdgeWorker Id ${ewId} from ${tarballPath}, reason: ${errorObj.detail}`
      );
    }
  }

  if (versions) {
    versions = [versions];
    const version = [];
    Object.keys(versions).forEach(function (key) {
      version.push(filterJsonData(versions[key], versionColumnsToKeep));
    });
    if (!envUtils.isDebugMode()) {
      Object.keys(version).forEach(function (key) {
        delete version[key]['sequenceNumber'];
      });
    }
    const msg = `New version uploaded for EdgeWorker Id: ${ewId}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, version);
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
  const bundle = await cliUtils.spinner(
    validateTarballLocally(bundlePath, true),
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
  let hasErrors = true;
  let errors = await cliUtils.spinner(
    edgeWorkersSvc.validateTarball(tarballPath),
    `Validating new code bundle version from ${tarballPath}`
  );

  if (errors) {
    // take off outer layer of JSON envelope
    if (Object.prototype.hasOwnProperty.call(errors, 'errors')) {
      errors = errors['errors'];
    }
    // if the Validation API returns successfully, but payload illustrates code bundle has errors, flag this as CLI failure
    if (JSON.stringify(errors) === '[]') hasErrors = false;

    const error = [];
    Object.keys(errors).forEach(function (key) {
      error.push(filterJsonData(errors[key], errorColumnsToKeep));
    });

    const msg = `Validation Errors for: ${tarballPath}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(hasErrors ? 1 : 0, msg, error);
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
  const downloadPath = determineTarballDownloadDir(
    ewId,
    rawDownloadPath
  );
  // Build tarball file name as ew_<version>_<now-as-epoch>.tgz
  const tarballFileName = `ew_${versionId}_${Date.now()}.tgz`;
  const pathToStore = path.join(downloadPath, tarballFileName);

  // First try to fetch tarball
  const wasDownloaded = await cliUtils.spinner(
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
  options?: {versionId?: string; activationId?: string; activeOnNetwork?: boolean; network?: string;}
) {
  let activations = null;
  const activation = [];
  let accountId = '';
  let versionId = options.versionId;
  let activationId = options.activationId;
  const active = options.activeOnNetwork;
  const network = options.network;

  if (versionId) {
    activations = await cliUtils.spinner(
      edgeWorkersSvc.getActivations(ewId, versionId, network),
      `Fetching all Activations for EdgeWorker Id ${ewId}, Version ${versionId}${network ? ', Network ' + network : ''}`
    );

    if (Object.prototype.hasOwnProperty.call(activations, 'activations')) {
      activations = activations['activations'];
    }
  } else if (activationId) {
    activations = await cliUtils.spinner(
      edgeWorkersSvc.getActivationID(ewId, activationId),
      `Fetching Activation info for EdgeWorker Id ${ewId}, Activation Id ${activationId}`
    );
    activations = [activations];
  } else {
    activations = await cliUtils.spinner(
      edgeWorkersSvc.getActivations(ewId, undefined, network, active),
      `Fetching ${active ? 'active version' : 'all activations'} for EdgeWorker Id ${ewId}${network ? ' on ' + network : ''}`
    );
    // remove outer envelope of JSON data

    if (Object.prototype.hasOwnProperty.call(activations, 'activations')) {
      activations = activations['activations'];
    }
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

    const msg = `The following EdgeWorker Activations currently exist for account: ${accountId}, ewId: ${ewId}, version: ${active ? 'active' : versionId}, activationId: ${activationId}, network: ${network ? network : 'any'}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, activation);
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
  let activations = await cliUtils.spinner(
    edgeWorkersSvc.createActivationId(ewId, network, versionId),
    `Creating Activation record for EdgeWorker Id ${ewId}, version: ${versionId} on network: ${network}`
  );

  if (activations) {
    activations = [activations];
    const activation = [];
    Object.keys(activations).forEach(function (key) {
      activation.push(
        filterJsonData(activations[key], activationColumnsToKeep)
      );
    });
    const msg = `New Activation record created for EdgeWorker Id: ${ewId}, version: ${versionId}, on network: ${network}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, activation);
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
    const msg = `Cloned Edgeworker from Edgeworker id ${ewId} to resourceTier id ${resourceTierId}`;
    clonedEw = [clonedEw];
    const id = [];
    Object.keys(clonedEw).forEach(function (key) {
      id.push(filterJsonData(clonedEw[key], clonedColumnsToKeep));
    });
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, id);
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
  let deactivate = await cliUtils.spinner(
    edgeWorkersSvc.deactivateEdgeworker(ewId, network, versionId),
    `Deactivating Edgeworker for Id ${ewId}, version: ${versionId} on network: ${network}`
  );
  if (deactivate) {
    deactivate = [deactivate];
    const deactivation = [];
    Object.keys(deactivate).forEach(function (key) {
      deactivation.push(
        filterJsonData(deactivate[key], deactivationColumnsToKeep)
      );
    });
    const msg = `EdgeWorker deactivated for Id: ${ewId}, version: ${versionId}, on network: ${network}`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, deactivate);
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
    expiry?: number;
    format?;
  }
) {
  if (options.expiry) {
    validateExpiry(options.expiry);
  }

  let authToken = await cliUtils.spinner(
    edgeWorkersSvc.getAuthToken(
      hostName,
      options.expiry),
    'Creating auth token ...'
  );
  if (authToken && !authToken.isError) {
    Object.keys(authToken).forEach(function (key) {
      authToken = authToken[key];
    });
    const token = 'Akamai-EW-Trace: ' + authToken;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, token);
    } else if (options.format && options.format == 'curl') {
      cliUtils.log(`-H '${token}'`);
    } else {
      cliUtils.logWithBorder('Add the following request header to your requests to get additional trace information.');
      cliUtils.log(token + '\n');
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
    'The following secret can be used to generate auth token or be used in the variable "PMUSER_EW_DEBUG_KEY" in the property.\n ' +
    secretToken;
  if (ewJsonOutput.isJSONOutputMode()) {
    ewJsonOutput.writeJSONOutput(0, secretToken);
  } else {
    cliUtils.logWithBorder(msg);
  }
}

export async function getLimits() {
  const limitsResponse = await cliUtils.spinner(
    edgeWorkersSvc.getLimits(),
    'Getting limits list...'
  );

  if (limitsResponse.limits && !limitsResponse.isError) {
    const msg = 'EdgeWorkers imposes the following limits:';
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, limitsResponse.limits);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(limitsResponse.limits);
    }
  } else {
    cliUtils.logAndExit(1, limitsResponse.error_reason);
  }
}

export async function getAvailableReports() {
  const availableReports = await cliUtils.spinner(
    edgeWorkersSvc.getAvailableReports(),
    'Getting list of available reports...'
  );

  if (availableReports && !availableReports.isError) {
    const msg = 'The following reports are available:';
    const reportList = availableReports.reports.map((report) => {
      return {ReportId: report.reportId, ReportType: report.name};
    });

    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, reportList);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(reportList);
    }
  } else {
    cliUtils.logAndExit(1, availableReports.error_reason);
  }
}

interface Execution {
  invocations: number
  execDuration?: Record<string, number>,
  initDuration?: Record<string, number>,
  status?: string,
  memory?: Record<string, number>,
}

const getExecutionAverages = (executionArray: Array<Execution>, executionKey: string) => {
  if (executionArray) {
    let totalAvg = 0, totalInvocations = 0, eventMax = -1, eventMin = Number.MAX_SAFE_INTEGER;
    for (const execution of executionArray) {
      const {avg, min, max} = execution[executionKey];

      totalAvg += avg * execution.invocations;
      totalInvocations += execution.invocations;
      eventMin = Math.min(eventMin, min);
      eventMax = Math.max(eventMax, max);
    }
    return {
      avg: (totalAvg / totalInvocations).toFixed(4),
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

export async function getReport(
  reportId: number,
  start: string,
  end: string,
  ewid: string,
  statuses: Array<string>,
  eventHandlers: Array<string>,
) {
  const report = await cliUtils.spinner(
    edgeWorkersSvc.getReport(reportId, ewid, start, statuses, eventHandlers, end),
    'Getting report...'
  );

  const EVENT_HANDLERS = ['onClientRequest', 'onOriginRequest', 'onOriginResponse', 'onClientResponse', 'responseProvider'];
  let executionEventHandlers: Array<string>;
  if (eventHandlers.length !== 0) {
    // remove unwanted event handlers
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

      switch (report.reportId) {
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
          let initDurationMapped = {}; // init duration might be undefined

          if (initDuration) {
            Object.keys(initDuration).forEach((key) => {
              initDurationMapped[key] = initDuration[key].toFixed(4);
            });
          } else {
            initDurationMapped = {avg: 'N/A', max: 'N/A', min: 'N/A'};
          }

          Object.keys(execDuration).forEach((key) => {
            execDuration[key] = execDuration[key].toFixed(4);
          });
          Object.keys(memory).forEach((key) => {
            memory[key] = memory[key].toFixed(4);
          });

          reportOutput = [
            {successes, errors, invocations},
            {initDuration: initDurationMapped, execDuration},
            {memory}
          ];
          break;
        }

        case 2: {
          // execution time
          reportOutput = {};
          const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

          for (const event of executionEventHandlers) {
            reportOutput[event] = getExecutionAverages(executionCategories[event], 'execDuration');
          }
          // execution time has an additional property for init times
          reportOutput['init'] = getExecutionAverages(executionCategories['init'], 'initDuration');

          break;
        }

        case 3: {
          // execution status
          reportOutput = {};
          const executionCategories: Record<string, Array<Execution>> = report.data[0].data;
          let errors = 0;

          for (const executionArray of Object.values(executionCategories)) {
            for (const execution of executionArray) {
              const {status, invocations} = execution;
              reportOutput[status] = reportOutput[status] + invocations || invocations;
              if (status !== 'success' && status !== 'unimplementedEventHandler') {
                errors += invocations;
              }
            }
          }

          if (!reportOutput['success']) {
            // add success count if no successful executions
            reportOutput['success'] = 0;
          }
          //add property for total errors
          reportOutput['errors'] = errors;

          break;
        }

        case 4: {
          // memory usage
          reportOutput = {};
          const executionCategories: Record<string, Array<Execution>> = report.data[0].data;

          for (const event of executionEventHandlers) {
            reportOutput[event] = getExecutionAverages(executionCategories[event], 'memory');
          }

          break;
        }
      }
      if (ewJsonOutput.isJSONOutputMode()) {
        ewJsonOutput.writeJSONOutput(0, msg, reportOutput);
      } else {
        if (Array.isArray(reportOutput)) {
          // report 1 (summary) will return an array of table objects
          reportOutput.forEach((table) => console.table(table));
        } else {
          console.table(reportOutput);
        }
      }
    }
  } else {
    cliUtils.logAndExit(1, report.error_reason);
  }
}

/* ========== Log-level related functionality ========== */

export async function setLogLevel(ewId: number, network: string, level: string, options: object) {
  let expireTime = null;
  if (options['expires'] !== cliUtils.LL_NEVER_EXPIRE_STR) {
    expireTime = chrono.parseDate(options['expires'], null, {forwardDate: true});
    if (expireTime === null) {
      cliUtils.logAndExit(1, `ERROR: cannot parse given date: ${options['until']}`);
    }

    validateLogLevelExpireTime(expireTime);
    expireTime = expireTime.toISOString();
  }

  network = network.toUpperCase();
  level = level.toUpperCase();

  const ds2Id = options['ds2Id'];
  if (ds2Id != null && Number.isNaN(parseInt(ds2Id))) {
    cliUtils.logAndExit(1, `ERROR: Specified Datastream 2 ID '${ds2Id}' is invalid`);
  }

  const logLevel = await cliUtils.spinner(
    edgeWorkersSvc.setLogLevel(ewId, level, network, expireTime, ds2Id),
    `Setting new logging level for edgeworker ${ewId}...`
  );

  if (logLevel && !logLevel.isError) {
    const msg = `Setting new logging level '${level}' successful`;
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, logLevel);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(logLevel);
    }
  } else {
    cliUtils.logAndExit(1, logLevel.error_reason);
  }
}

export async function getLogLevel(ewId: number, loggingId: null | string = null) {
  const logLevel = await cliUtils.spinner(
    edgeWorkersSvc.getLogLevel(ewId, loggingId),
    `Fetching current logging level for edgeworker ${ewId}...`
  );

  if (logLevel && !logLevel.isError) {
    const msg = 'Fetching logging level successful';
    if (ewJsonOutput.isJSONOutputMode()) {
      ewJsonOutput.writeJSONOutput(0, msg, logLevel);
    } else {
      cliUtils.logWithBorder(msg);
      if (logLevel['loggings'] === undefined) {
        console.table(logLevel);
      } else {
        console.table(logLevel['loggings']);
      }
    }

  } else {
    cliUtils.logAndExit(1, logLevel.error_reason);
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

function validateLogLevelExpireTime(expireTime: Date) {
  const now = new Date();
  if ((now.getTime() - expireTime.getTime()) >= 0) {
    cliUtils.logAndExit(1, 'ERROR: Logging level expiry time in the past');
  }
}
