import * as edgekvSvc from './ekv-service';
import * as cliUtils from '../utils/cli-utils';
import * as response from './ekv-response';
import * as ekvhelper from './ekv-helper';
import * as edgeWorkersSvc from '../edgeworkers/ew-service';
import { ekvJsonOutput } from './client-manager';

export async function listNameSpaces(
  environment: string,
  details: boolean,
  sortDirection: cliUtils.sortDirections,
  orderBy: string
) {
  ekvhelper.validateNetwork(environment);
  const nameSpaceList = await cliUtils.spinner(
    edgekvSvc.getNameSpaceList(environment, details),
    'Fetching namespace list...'
  );
  if (nameSpaceList != undefined && !nameSpaceList.isError) {
    const nsListResp = [];
    if (Object.prototype.hasOwnProperty.call(nameSpaceList, 'namespaces')) {
      const namespace = nameSpaceList['namespaces'];
      cliUtils.sortObjectArray(namespace, orderBy, sortDirection);

      namespace.forEach(function (value) {
        if (details) {
          const retentionPeriod = ekvhelper.convertRetentionPeriod(
            value['retentionInSeconds']
          );
          const groupId = value['groupId'] == undefined ? 0 : value['groupId'];
          nsListResp.push({
            NamespaceId: value['namespace'],
            RetentionPeriod: retentionPeriod,
            GeoLocation: value['geoLocation'],
            AccessGroupId: groupId,
          });
        } else {
          nsListResp.push({ NamespaceId: value['namespace'] });
        }
      });
    }
    const msg =
      `The following namespaces are provisioned on the ${environment} environment`;

    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, nsListResp);
    } else {
      cliUtils.logWithBorder(msg);
      console.table(nsListResp);
    }
  } else {
    response.logError(
      nameSpaceList,
      `ERROR: Error while retrieving namespaces. ${nameSpaceList.error_reason} [TraceId: ${nameSpaceList.traceId}]`
    );
  }
}
export async function listGroups(environment: string, namespace: string) {
  ekvhelper.validateNetwork(environment);
  const groupsList = await cliUtils.spinner(
    edgekvSvc.getGroupsList(environment, namespace),
    'Fetching groups list...'
  );
  if (groupsList != undefined && !groupsList.isError) {
    const msg = `The ${environment} namespace "${namespace}" contains ${groupsList.length} groups.`;
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, groupsList);
    } else {
      cliUtils.logWithBorder(msg);
      groupsList.forEach((element) => {
        console.log(element);
      });
    }
  } else {
    response.logError(
      groupsList,
      `ERROR: Error while retrieving groups. ${groupsList.error_reason} [TraceId: ${groupsList.traceId}]`
    );
  }
}

export async function createNamespace(
  environment: string,
  nameSpace: string,
  retention: number,
  groupId: number,
  geoLocation: string
) {
  if (!groupId) {
    cliUtils.logAndExit(
      1,
      'ERROR: The mandatory "groupId" parameter is missing. Please specify a valid "groupId" or set it to 0 if you do not want to restrict the namespace to a specific group.'
    );
  }

  ekvhelper.validateNetwork(environment);
  const msg = `Namespace ${nameSpace} has been created successfully on the ${environment} environment`;
  const retentionPeriod = ekvhelper.convertDaysToSeconds(retention);
  const createdNamespace = await cliUtils.spinner(
    edgekvSvc.createNameSpace(
      environment,
      nameSpace,
      retentionPeriod,
      groupId,
      geoLocation
    ),
    `Creating namespace for environment ${environment}`
  );
  if (createdNamespace != undefined && !createdNamespace.isError) {
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, createdNamespace);
    } else {
      cliUtils.logWithBorder(msg);
      response.logNamespace(nameSpace, createdNamespace);
    }
  } else {
    response.logError(
      createdNamespace,
      `ERROR: Error while creating namespace. ${createdNamespace.error_reason} [TraceId: ${createdNamespace.traceId}]`
    );
  }
}

export async function getNameSpace(environment: string, nameSpace: string) {
  ekvhelper.validateNetwork(environment);
  const msg = `Namespace ${nameSpace} was successfully retrieved for the ${environment} environment`;
  const createdNamespace = await cliUtils.spinner(
    edgekvSvc.getNameSpace(environment, nameSpace),
    `Fetching namespace for id ${nameSpace}`
  );
  if (createdNamespace != undefined && !createdNamespace.isError) {
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, createdNamespace);
    } else {
      cliUtils.logWithBorder(msg);
      response.logNamespace(nameSpace, createdNamespace);
    }
  } else {
    response.logError(
      createdNamespace,
      `ERROR: Error while retrieving namespace from ${environment} environment. ${createdNamespace.error_reason} [TraceId: ${createdNamespace.traceId}]`
    );
  }
}

export async function updateNameSpace(
  environment: string,
  nameSpace: string,
  options: { retention: number; groupId: number; geoLocation?: string }
) {
  if (nameSpace == 'default') {
    cliUtils.logAndExit(
      1,
      'ERROR: You cannot modify the retention period for the "default" namespace.'
    );
  }

  const msg = `Namespace ${nameSpace} has been updated successfully on the ${environment} environment`;
  const createdNamespace = await edgekvSvc.getNameSpace(environment, nameSpace);
  if (createdNamespace != undefined && !createdNamespace.isError) {
    const retentionPeriod = ekvhelper.convertDaysToSeconds(options.retention);
    let geoLocation = options.geoLocation;
    if (!geoLocation) {
      geoLocation = createdNamespace['geoLocation'];
    }
    const groupId = createdNamespace['groupId'];

    const updatedNamespace = await cliUtils.spinner(
      edgekvSvc.updateNameSpace(
        environment,
        nameSpace,
        retentionPeriod,
        groupId,
        geoLocation
      ),
      `Updating namespace for id ${nameSpace}`
    );
    if (updatedNamespace != undefined && !updatedNamespace.isError) {
      if (ekvJsonOutput.isJSONOutputMode()) {
        ekvJsonOutput.writeJSONOutput(0, msg, updatedNamespace);
      } else {
        cliUtils.logWithBorder(msg);
        response.logNamespace(nameSpace, updatedNamespace);
      }
    } else {
      response.logError(
        updatedNamespace,
        `Error while updating the namespace on the ${environment} environment. ${updatedNamespace.error_reason} [TraceId: ${updatedNamespace.traceId}]`
      );
    }
  } else {
    response.logError(
      createdNamespace,
      `ERROR: Namespace ${nameSpace} is not found on the ${environment} environment. [TraceId: ${createdNamespace.traceId}]`
    );
  }
}

export async function initializeEdgeKv(dataAccessPolicyStr: string) {
  const dataAccessPolicy = {};
  const dataAccessPolicyArr = dataAccessPolicyStr.split(',');
  dataAccessPolicyArr.filter(item => item.includes('=')).forEach(item => {
    const property = item.split('=');
    if (property.length !== 2) {
      console.error(`Warning: cannot parse invalid item ['${item}'], skip it.`);
    } else {
      dataAccessPolicy[property[0].trim()] = property[1].trim() === 'true';
    }
  });
  if (dataAccessPolicy['restrictDataAccess'] == undefined || dataAccessPolicy['allowNamespacePolicyOverride'] == undefined) {
    cliUtils.logAndExit(
      1,
      'ERROR: `dataAccessPolicy` option must be of the form `restrictDataAccess=<bool>,allowNamespacePolicyOverride=<bool>` where <bool> can be true or false.'
    );
  }
  const initializedEdgeKv = await cliUtils.spinner(
    edgekvSvc.initializeEdgeKV(dataAccessPolicy),
    'Initializing EdgeKV...'
  );

  if (initializedEdgeKv.data != undefined && !initializedEdgeKv.isError) {
    const initRespBody = initializedEdgeKv.data;

    const status = initializedEdgeKv.status;
    let msg;
    if (Object.prototype.hasOwnProperty.call(initRespBody, 'accountStatus')) {
      const accountStatus = initRespBody['accountStatus'];
      if (accountStatus == 'INITIALIZED') {
        if (status == 201) {
          msg = 'EdgeKV INITIALIZED successfully';
        } else {
          msg = 'EdgeKV already INITIALIZED';
        }
      } else if (status == 200 && accountStatus != 'INITIALIZED') {
        msg = 'EdgeKV initialization is IN PROGRESS';
      } else if (status == 404) {
        msg = 'EdgeKV was not INITIALIZED';
      } else if (accountStatus == 'UNINITIALIZED') {
        msg = 'EdgeKV Initialization failed. Please try again.';
      } else {
        msg = `EdgeKV initialization is ${initRespBody.account_status}`;
      }
    }
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, initRespBody);
    } else {
      cliUtils.logWithBorder(msg);
      response.logInitialize(initRespBody);
    }
  } else {
    let errorReason = `${initializedEdgeKv.error_reason}`;
    if (initializedEdgeKv && initializedEdgeKv.status == 403) {
      errorReason =
        '(You don\'t have permission to access this resource). Please make sure you have the EdgeKV product added to your contract.';
    }
    response.logError(
      initializedEdgeKv,
      `ERROR: EdgeKV initialization failed ${errorReason} [TraceId: ${initializedEdgeKv.traceId}]`
    );
  }
}

export async function getInitializationStatus() {
  const initializedEdgeKv = await cliUtils.spinner(
    edgekvSvc.getInitializedEdgeKV(),
    'Getting Initialization status...'
  );

  if (initializedEdgeKv.data != undefined && !initializedEdgeKv.isError) {
    const initRespBody = initializedEdgeKv.data;
    const status = initializedEdgeKv.status;
    let msg;
    if (Object.prototype.hasOwnProperty.call(initRespBody, 'accountStatus')) {
      const accountStatus = initRespBody['accountStatus'];
      if (accountStatus == 'INITIALIZED') {
        if (status == 200) {
          msg = 'EdgeKV already INITIALIZED';
        } else if (status == 201) {
          msg = 'EdgeKV INITIALIZED successfully';
        }
      } else if (status == 102) {
        msg = 'EdgeKV initialization is IN PROGRESS';
      } else if (accountStatus == 'UNINITIALIZED') {
        msg = 'EdgeKV Initialization failed. Please try again';
      } else {
        msg = `EdgeKV initialization is ${initRespBody.account_status}`;
      }
    }
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, initRespBody);
    } else {
      cliUtils.logWithBorder(msg);
      response.logInitialize(initRespBody);
    }
  } else {
    let errorReason = `${initializedEdgeKv.error_reason}`;
    if (initializedEdgeKv && initializedEdgeKv.status == 403) {
      errorReason =
        '(You don\'t have permission to access this resource). Please make sure you have the EdgeKV product added to your contract.';
    }
    response.logError(
      initializedEdgeKv,
      `ERROR: EdgeKV Initialization failed ${errorReason} [TraceId: ${initializedEdgeKv.traceId}]`
    );
  }
}

export async function writeItemToEdgeKV(
  environment: string,
  nameSpace: string,
  groupId: string,
  itemId: string,
  items,
  itemType: string,
  sandboxid: string
) {
  ekvhelper.validateNetwork(environment, sandboxid);
  let msg = `Item ${itemId} was successfully created into the environment: ${environment}, namespace: ${nameSpace} and groupid: ${groupId}`;
  if (sandboxid) {
    msg = `Item ${itemId} was successfully created into the environment: ${environment}/sandboxid=${sandboxid}, namespace: ${nameSpace} and groupid: ${groupId}`;
  }
  let createdItem;
  if (itemType == 'text') {
    if (cliUtils.isJSON(items)) {
      items = JSON.parse(items);
    }
    createdItem = await edgekvSvc.writeItems(
      environment,
      nameSpace,
      groupId,
      itemId,
      items,
      sandboxid
    );
  } else if (itemType == 'jsonfile') {
    ekvhelper.validateInputFile(items);
    createdItem = await edgekvSvc.writeItemsFromFile(
      environment,
      nameSpace,
      groupId,
      itemId,
      items,
      sandboxid
    );
  } else {
    cliUtils.logAndExit(
      1,
      'ERROR: Unable to write item to EdgeKV. Use \'text\' or \'jsonfile\' as item type.'
    );
  }

  if (createdItem != undefined && !createdItem.isError) {
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg);
    } else {
      cliUtils.logWithBorder(msg);
    }
  } else {
    response.logError(
      createdItem,
      `ERROR: Unable to write item to EdgeKV. ${createdItem.error_reason} [TraceId: ${createdItem.traceId}]`
    );
  }
}

export async function readItemFromEdgeKV(
  environment: string,
  nameSpace: string,
  groupId: string,
  itemId: string,
  sandboxid: string
) {
  ekvhelper.validateNetwork(environment, sandboxid);
  let msg = `Item ${itemId} from group ${groupId}, namespace ${nameSpace} and environment ${environment} retrieved successfully`;
  if (sandboxid) {
    msg = `Item ${itemId} from group ${groupId}, namespace ${nameSpace} and environment ${environment}/sandboxid=${sandboxid} retrieved successfully`;
  }

  const item = await cliUtils.spinner(
    edgekvSvc.readItem(environment, nameSpace, groupId, itemId, sandboxid),
    'Reading items from EdgeKV..'
  );
  if ((item != undefined && !item.isError) || item == null) {
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, item);
    } else {
      cliUtils.logWithBorder(msg);
      if (typeof item == 'object') {
        console.log(JSON.stringify(item));
      } else {
        console.log(item);
      }
    }
  } else {
    response.logError(
      item,
      `ERROR: Unable to read item. ${item.error_reason} [TraceId: ${item.traceId}]`
    );
  }
}

export async function deleteItemFromEdgeKV(
  environment: string,
  nameSpace: string,
  groupId: string,
  itemId: string,
  sandboxid: string
) {
  ekvhelper.validateNetwork(environment, sandboxid);
  let msg = `Item ${itemId} was successfully marked for deletion from group ${groupId}, namespace ${nameSpace} and environment ${environment}`;
  let errorMsg = `ERROR: Unable to delete item ${itemId} from group ${groupId}, namespace ${nameSpace} and environment ${environment}`;
  if (sandboxid) {
    msg += `/sandboxid=${sandboxid}`;
    errorMsg += `/sandboxid=${sandboxid}`;
  }
  const deletedItem = await edgekvSvc.deleteItem(
    environment,
    nameSpace,
    groupId,
    itemId,
    sandboxid
  );
  if (deletedItem != undefined && !deletedItem.isError) {
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg);
    } else {
      cliUtils.logWithBorder(msg);
    }
  } else {
    response.logError(
      deletedItem,
      `${errorMsg}. ${deletedItem.error_reason} [TraceId: ${deletedItem.traceId}]`
    );
  }
}

export async function listItemsFromGroup(
  environment: string,
  nameSpace: string,
  groupId: string,
  maxItems: number,
  sandboxid: string
) {
  ekvhelper.validateNetwork(environment, sandboxid);
  let msg = `There are no items for group ${groupId}, namespace ${nameSpace} and environment ${environment}`;
  let successMsg = `items from group ${groupId} were retrieved successfully from ${environment}`;
  if (sandboxid) {
    msg += `/sandboxid=${sandboxid}`;
    successMsg += `/sandboxid=${sandboxid}`;
  }
  const itemsList = await cliUtils.spinner(
    edgekvSvc.getItemsFromGroup(
      environment,
      nameSpace,
      groupId,
      maxItems,
      sandboxid
    ),
    `Listing items from namespace ${nameSpace} and group ${groupId}`
  );
  if (itemsList != undefined && !itemsList.isError) {
    if (itemsList.length != 0) {
      msg = `${itemsList.length} ${successMsg}`;
    }
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, itemsList);
    } else {
      cliUtils.logWithBorder(msg);
      itemsList.forEach((element) => {
        console.log(element);
      });
    }
  } else {
    response.logError(
      itemsList,
      `ERROR: Unable to retrieve items from group. ${itemsList.error_reason} [TraceId: ${itemsList.traceId}]`
    );
  }
}

export async function listTokens(incExpired) {
  const tokenList = await cliUtils.spinner(
    edgekvSvc.getTokenList(incExpired),
    'Fetching token list...'
  );
  const msg = 'The following tokens are available for you to download';
  if (tokenList != undefined && !tokenList.isError) {
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg, tokenList);
    } else {
      cliUtils.logWithBorder(msg);
      response.logTokenList(tokenList);
      cliUtils.log(
        `You have ${tokenList['tokens'].length} tokens available to download.`
      );
    }
  } else {
    response.logError(
      tokenList,
      `ERROR: Unable to retrieve edgekv access tokens. ${tokenList.error_reason} [TraceId: ${tokenList.traceId}]`
    );
  }
}

export async function createToken(
  tokenName: string,
  options: {
    save_path?: string;
    staging?: string;
    production?: string;
    ewids?: string;
    namespace?: string;
    expiry?: string;
    overwrite?;
  }
) {
  // convert string to ISO date
  const expiry = getExpiryDate(options.expiry);

  // parse input permissions
  const permissionList = parseNameSpacePermissions(options.namespace);
  const envAccess = { allow: true, deny: false };
  const savePath = options.save_path;
  validateSavePath(savePath);

  const createdToken = await cliUtils.spinner(
    edgekvSvc.createEdgeKVToken(
      tokenName,
      permissionList,
      envAccess[options.staging],
      envAccess[options.production],
      options.ewids.split(','),
      expiry
    ),
    'Creating edgekv token ...'
  );

  if (createdToken != undefined && !createdToken.isError) {
    processToken(createdToken, savePath, options.overwrite);
  } else {
    response.logError(
      createdToken,
      `ERROR: Unable to create edgekv token. ${createdToken.error_reason} [TraceId: ${createdToken.traceId}]`
    );
  }
}

export async function retrieveToken(
  tokenName: string,
  options: { save_path?: string; overwrite? }
) {
  const savePath = options.save_path;
  validateSavePath(savePath);

  const retrievedToken = await cliUtils.spinner(
    edgekvSvc.getSingleToken(tokenName),
    'Downloading egdekv token...'
  );

  if (retrievedToken != undefined && !retrievedToken.isError) {
    processToken(retrievedToken, savePath, options.overwrite);
  } else {
    response.logError(
      retrievedToken,
      `ERROR: Unable to retrieve edgekv token. ${retrievedToken.error_reason} [TraceId: ${retrievedToken.traceId}]`
    );
  }
}

export async function revokeToken(tokenName: string) {
  const revokedToken = await cliUtils.spinner(
    edgekvSvc.revokeToken(tokenName),
    'Revoking EdgeKV token...'
  );
  if (revokedToken != undefined && !revokedToken.isError) {
    const msg = `${tokenName} was successfully revoked and removed from the EdgeKV access token list.`;
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg);
    } else {
      cliUtils.logWithBorder(msg);
    }
  } else {
    response.logError(
      revokedToken,
      `ERROR: Unable to revoke EdgeKV token. ${revokedToken.error_reason} [TraceId: ${revokedToken.traceId}]`
    );
  }
}

export async function modifyAuthGroupPermission(
  namespaceId: string,
  groupId: number
) {
  const modifiedAuthGroup = await cliUtils.spinner(
    edgekvSvc.modifyAuthGroupPermission(namespaceId, groupId),
    'Modifying Auth group permission...'
  );
  if (modifiedAuthGroup != undefined && !modifiedAuthGroup.isError) {
    const msg = `The Permission Group for namespace ${namespaceId} was successfully modified to groupId ${groupId}`;
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(0, msg);
    } else {
      cliUtils.logWithBorder(msg);
    }
  } else {
    response.logError(
      modifiedAuthGroup,
      `ERROR: Unable to modify the permission group associated with the namespace. ${modifiedAuthGroup.error_reason} [TraceId: ${modifiedAuthGroup.traceId}]`
    );
  }
}

/**
 * Retrieves single group or all groups
 * If include ew group option is provided makes call to EW and returns the capabilites of EW and EKV
 * @param options
 */
export async function listAuthGroups(options: {
  groupIds?;
  include_ew_groups?;
}) {
  let groupId = options.groupIds;
  let ewGroups = new Map<number, string>();
  let authGroups = null;

  // for single group or mutliple groups specified by user
  if (groupId) {
    const splitted = groupId.split(',');
    if (splitted.length > 0) {
      const groupObj = { groups: [] };

      for (const val of splitted) {
        const authGroup = await cliUtils.spinner(
          edgekvSvc.listAuthGroups(val),
          'Retrieving permission groups...'
        );
        if (authGroup != undefined && !authGroup.isError) {
          groupObj['groups'].push(authGroup);
        } else {
          response.logError(
            authGroup,
            `ERROR: Unable to list the permission groups. ${authGroup.error_reason} [TraceId: ${authGroup.traceId}]`
          );
        }
      }
      authGroups = groupObj;
    }
  } else {
    // for all groups
    const retreievedAuthGroups = await cliUtils.spinner(
      edgekvSvc.listAuthGroups(options.groupIds),
      'Retrieving permission groups...'
    );
    if (retreievedAuthGroups != undefined && !retreievedAuthGroups.isError) {
      authGroups = retreievedAuthGroups;
    } else {
      response.logError(
        authGroups,
        `ERROR: Unable to list the permission groups. ${retreievedAuthGroups.error_reason} [TraceId: ${retreievedAuthGroups.traceId}]`
      );
    }
  }
  // check if groupId was empty for messaging
  if (groupId === undefined || groupId === null) {
    groupId = 'any';
  }
  if (options.include_ew_groups) {
    ewGroups = await getEwGroups(options.groupIds);
  }
  const msg = `User has the following permission access for group: ${groupId}`;

  if (ekvJsonOutput.isJSONOutputMode()) {
    const obj = {
      authGroups,
      ...( options.include_ew_groups && { ewGroups: [...ewGroups] }),
    };
    ekvJsonOutput.writeJSONOutput(0, msg, obj);
  } else {
    cliUtils.logWithBorder(msg);
    response.logAuthGroups(authGroups, ewGroups, options.include_ew_groups);
  }
}

/** Retrieve edgeworker capabilities for single or all group ids
 * and create a map for easy retrieval
 * @param groupId
 * @returns
 */
async function getEwGroups(groupId: string) {
  let groups = null;
  const ewGrpCapabilitiesMap = new Map<number, string>();
  if (!groupId) {
    groups = await edgeWorkersSvc.getAllGroups();
    // remove outer envelope of JSON data
    if (Object.prototype.hasOwnProperty.call(groups, 'groups')) {
      groups = groups['groups'];
      groups.forEach((group) => {
        ewGrpCapabilitiesMap.set(group['groupId'], group['capabilities']);
      });
    }
  } else {
    const splitted = groupId.split(',');
    if (splitted.length > 0) {
      for (const val of splitted) {
        groups = await edgeWorkersSvc.getGroup(val);
        ewGrpCapabilitiesMap.set(groups['groupId'], groups['capabilities']);
      }
    }
  }
  return ewGrpCapabilitiesMap;
}
/**
 * Checks if date is in format yyyy-mm-dd
 * Converts date to iso format to be consumed by API
 * @param expiry
 */
function getExpiryDate(expiry: string) {
  const errorMsg =
    'Expiration time specified is invalid. Please specify in format yyyy-mm-dd.';
  try {
    if (!ekvhelper.isValidDate(expiry)) {
      cliUtils.logAndExit(1, errorMsg);
    }
    expiry = new Date(expiry).toISOString().split('.').shift() + 'Z';
    return expiry;
  } catch (ex) {
    cliUtils.logAndExit(1, errorMsg);
  }
}

function parseNameSpacePermissions(namespace: string) {
  // list to which all the permissions mapped to namespace will be added
  const permissionList = {};
  const allowedPermission = ['r', 'w', 'd'];
  const allowedPermissionErrorMsg =
    'ERROR: Permissions provided is invalid. Please provide from the following : r,w,d';
  namespace.split(',').forEach((val) => {
    const per = val.split('+');
    const permissions = [];

    if (per[0] == '' || per[1] == '') {
      cliUtils.logAndExit(
        1,
        'ERROR: Permissions provided is invalid. Please do not provide space between namespaces or permissions.'
      );
    }
    // if no permissions are provided
    if (per.length != 2) {
      cliUtils.logAndExit(1, allowedPermissionErrorMsg);
    }

    per[1].split('').forEach(function (c) {
      if (allowedPermission.includes(c)) {
        permissions.push(c);
      } else {
        cliUtils.logAndExit(1, allowedPermissionErrorMsg);
      }
    });
    // if namespace is repeated, error out
    if (permissionList[per[0]] != null) {
      cliUtils.logAndExit(
        1,
        'ERROR: Namespace cannot be repeated. Please provide valid namespace and permissions.'
      );
    }
    permissionList[per[0]] = permissions;
  });
  return permissionList;
}

function validateSavePath(savePath) {
  if (savePath) {
    if (!ekvhelper.checkIfFileExists(savePath)) {
      cliUtils.logWithBorder(
        'ERROR: Unable to save token. save_path provided is invalid or you do not have access permissions. Please provide a valid path.'
      );
      process.exit(1);
    }
  }
}

function processToken(token, savePath, overwrite) {
  // decodes the jwt token
  const decodedToken = ekvhelper.decodeJWTToken(token['value']);
  const nameSpaceList = ekvhelper.getNameSpaceListFromJWT(decodedToken);
  const msg =
    'Add the token value in edgekv_tokens.js file and place it in your bundle. Use --save_path option to save the token file to your bundle';
  if (savePath) {
    if (ekvhelper.getFileExtension(savePath) != '.tgz') {
      ekvhelper.createTokenFileWithoutBundle(
        savePath,
        overwrite,
        token,
        decodedToken,
        nameSpaceList
      );
    } else {
      ekvhelper.saveTokenToBundle(
        savePath,
        overwrite,
        token,
        decodedToken,
        nameSpaceList
      );
    }
  } else {
    if (ekvJsonOutput.isJSONOutputMode()) {
      ekvJsonOutput.writeJSONOutput(
        0,
        msg,
        response.logTokenToJson(token, decodedToken, nameSpaceList)
      );
    } else {
      cliUtils.logWithBorder(msg);
      response.logToken(
        token['name'],
        token['value'],
        decodedToken,
        nameSpaceList,
        false
      );
    }
  }
}
