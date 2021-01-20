import * as edgekvSvc from './ekv-service';
import * as cliUtils from '../utils/cli-utils';
import * as response from './ekv-response';
import * as ekvhelper from './ekv-helper';

export async function listNameSpaces(environment: string) {
  ekvhelper.validateNetwork(environment);
  let nameSpaceList = await cliUtils.spinner(edgekvSvc.getNameSpaceList(environment), "Fetching namespace list...");
  if (nameSpaceList != 'undefined' && !nameSpaceList.isError) {
    let nsListResp = [];
    if (nameSpaceList.hasOwnProperty("namespaces")) {
      let namespace = nameSpaceList["namespaces"];
      namespace.forEach(function (value) {
        nsListResp.push({ "Namespace": value });
      });
    }
    cliUtils.logWithBorder(`The following namespaces are provisioned on the ${environment} environment`);
    console.table(nsListResp);
  } else {
    cliUtils.logAndExit(1, `ERROR: Error while retrieving namespaces. ${nameSpaceList.error_reason}`)
  }
}

export async function createNamespace(environment: string, nameSpace: string) {
  ekvhelper.validateNetwork(environment);
  let msg = `Namespace ${nameSpace} has been created successfully on the ${environment} environment`
  let createdNamespace = await cliUtils.spinner(edgekvSvc.createNameSpace(environment, nameSpace), `Creating namespace for environment ${environment}`);
  if (createdNamespace != 'undefined' && !createdNamespace.isError) {
    cliUtils.logWithBorder(msg);
    response.logNamespace(nameSpace, createdNamespace);
  } else {
    cliUtils.logAndExit(1, `ERROR: Error while creating namespace. ${createdNamespace.error_reason}`)
  }

}

export async function getNameSpace(environment: string, nameSpace: string) {
  ekvhelper.validateNetwork(environment);
  let msg = `Namespace ${nameSpace} was successfully retrieved for the ${environment} environment`
  let createdNamespace = await cliUtils.spinner(edgekvSvc.getNameSpace(environment, nameSpace), `Fetching namespace for id ${nameSpace}`);
  if (createdNamespace != 'undefined' && !createdNamespace.isError) {
    cliUtils.logWithBorder(msg);
    response.logNamespace(nameSpace, createdNamespace);
  } else {
    cliUtils.logAndExit(1, `ERROR: Error while retrieving namespace from ${environment} environment. ${createdNamespace.error_reason}`)
  }
}

export async function initializeEdgeKv() {
  let initializedEdgeKv = await edgekvSvc.initializeEdgeKV();

  if (initializedEdgeKv != 'undefined' && !initializedEdgeKv.isError) {
    let status = initializedEdgeKv.status;
    if (initializedEdgeKv.hasOwnProperty("account_status")) {
      let accountStatus = initializedEdgeKv["account_status"];
      if (accountStatus == "INITIALIZED") {
        if (status == 201) {
          cliUtils.logWithBorder(`EdgeKV INITIALIZED successfully`);
        } else if (status = 200) {
          cliUtils.logWithBorder(`EdgeKV already INITIALIZED`);
        }
      } else if (status == 200 && accountStatus != "INITIALIZED") {
        cliUtils.logWithBorder(`EdgeKV initialization is IN PROGRESS`);
      } else if (status == 404) {
        cliUtils.logWithBorder(`EdgeKV was not INITIALIZED`);
      } else if (accountStatus == "UNINITIALIZED") {
        cliUtils.logWithBorder(`EdgeKV Initialization failed. (${initializedEdgeKv.error_reason}).`);
      }
      else {
        cliUtils.logWithBorder(`EdgeKV initialization is ${initializedEdgeKv.account_status}`);
      }
    }
    response.logInitialize(initializedEdgeKv);
  } else {
    cliUtils.logAndExit(1, `ERROR: EdgeKV Initialization failed  (${initializedEdgeKv.error_reason}).`)
  }
}

export async function getInitializationStatus() {
  let initializedEdgeKv = await edgekvSvc.getInitializedEdgeKV();

  if (initializedEdgeKv != 'undefined' && !initializedEdgeKv.isError) {
    let status = initializedEdgeKv.status;
    if (initializedEdgeKv.hasOwnProperty("account_status")) {
      let accountStatus = initializedEdgeKv["account_status"];
      if (accountStatus == "INITIALIZED") {
        if (status == 200) {
          cliUtils.logWithBorder(`EdgeKV already INITIALIZED`);
        } else if (status == 201) {
          cliUtils.logWithBorder(`EdgeKV INITIALIZED successfully`);
        }
      } else if (status == 102) {
        cliUtils.logWithBorder(`EdgeKV initialization is IN PROGRESS`);
      } else if (accountStatus == "UNINITIALIZED") {
        cliUtils.logWithBorder(`EdgeKV Initialization failed. Please try again`);
      } else {
        cliUtils.logWithBorder(`EdgeKV initialization is ${initializedEdgeKv.account_status}`);
      }
    }
    response.logInitialize(initializedEdgeKv);
  } else {
    cliUtils.logAndExit(1, `ERROR: EdgeKV Initialization failed. Please try again. ${initializedEdgeKv.error_reason}`)
  }
}

export async function writeItemToEdgeKV(environment: string, nameSpace: string, groupId: string, itemId: string, items, itemType: string) {
  ekvhelper.validateNetwork(environment);
  let msg = `Item ${itemId} was successfully created into the environment: ${environment}, namespace: ${nameSpace} and groupid: ${groupId}`
  let createdItem: any;
  if (itemType == "text") {
    if (cliUtils.isJSON(items)) {
      items = JSON.parse(items);
    }
    createdItem = await edgekvSvc.writeItems(environment, nameSpace, groupId, itemId, items);
  }
  else if (itemType == "jsonfile") {
    ekvhelper.validateInputFile(items);
    createdItem = await edgekvSvc.writeItemsFromFile(environment, nameSpace, groupId, itemId, items);
  } else {
    cliUtils.logAndExit(1, "ERROR: Unable to write item to EdgeKV. Use 'text' or 'jsonfile' as item type.")
  }

  if (createdItem != 'undefined' && !createdItem.isError) {
    cliUtils.logWithBorder(msg);
  } else {
    cliUtils.logAndExit(1, `ERROR: Unable to write item to EdgeKV. ${createdItem.error_reason}`)
  }
}

export async function readItemFromEdgeKV(environment: string, nameSpace: string, groupId: string, itemId: string) {

  ekvhelper.validateNetwork(environment);

  let item = await edgekvSvc.readItem(environment, nameSpace, groupId, itemId);
  if (item != 'undefined' && !item.isError) {
    let msg = `Item ${itemId} from group ${groupId}, namespace ${nameSpace} and environment ${environment} retrieved successfully.`
    cliUtils.logWithBorder(msg);
    if (typeof item == 'object') {
      console.log(JSON.stringify(item));
    } else {
      console.log(item);
    }
  } else {
    cliUtils.logAndExit(1, `ERROR: Unable to read item. ${item.error_reason}`)
  }
}

export async function deleteItemFromEdgeKV(environment: string, nameSpace: string, groupId: string, itemId: string) {
  ekvhelper.validateNetwork(environment);
  let deletedItem = await edgekvSvc.deleteItem(environment, nameSpace, groupId, itemId);
  if (deletedItem != 'undefined' && !deletedItem.isError) {
    let msg = `Item ${itemId} was successfully marked for deletion from group ${groupId}, namespace ${nameSpace} and environment ${environment}`
    cliUtils.logWithBorder(msg);
  } else {
    cliUtils.logAndExit(1, `ERROR: Unable to delete item ${itemId} from group ${groupId}, namespace ${nameSpace} and environment ${environment}. ${deletedItem.error_reason}`)
  }
}

export async function listItemsFromGroup(environment: string, nameSpace: string, groupId: string) {
  ekvhelper.validateNetwork(environment);
  let itemsList = await edgekvSvc.getItemsFromGroup(environment, nameSpace, groupId);
  if (itemsList != 'undefined' && !itemsList.isError) {

    let msg: string = `There are no items for group ${groupId}, namespace ${nameSpace} and environment ${environment}`;
    if (itemsList.length != 0) {
      msg = `${itemsList.length} items from group ${groupId} were retrieved successfully.`;
    }
    cliUtils.logWithBorder(msg);
    itemsList.forEach(element => {
      console.log(element);
    });
  } else {
    cliUtils.logAndExit(1, `ERROR: Unable to retrieve items from group. ${itemsList.error_reason}`)
  }
}

export async function createToken(tokenName: string, options: { save_path?: string, staging?: string, production?: string, ewids?: string, namespace?: string, expiry?: string, overwrite?}) {
  // convert string to ISO date
  let expiry = getExpiryDate(options.expiry);
  let savePath = options.save_path;
  // parse input permissions
  let permissionList = parseNameSpacePermissions(options.namespace);
  let envAccess = { "allow": true, "deny": false };

  if (savePath) {
    if (ekvhelper.getFileExtension(savePath) != ".tgz" || !(ekvhelper.checkIfFileExists(savePath))) {
      cliUtils.logWithBorder(`ERROR: Unable to create token. save_path provided is invalid or you do not have access permissions. Please provide a valid path.`);
      process.exit(1);
    }
  }

  if (options.staging == "deny" && options.production == "deny") {
    cliUtils.logWithBorder(`ERROR: Unable to create token. Either one of staging or production access should be set to "allow". Please provide a valid access permissions.`);
    process.exit(1);
  }

  let createdToken = await cliUtils.spinner(edgekvSvc.createEdgeKVToken(tokenName, permissionList, envAccess[options.staging], envAccess[options.production], options.ewids, expiry), "Creating edgekv token ...");

  if (createdToken != 'undefined' && !createdToken.isError) {
    // decodes the jwt token
    let decodedToken = ekvhelper.decodeJWTToken(createdToken["value"]);
    let nameSpaceList = ekvhelper.getNameSpaceListFromJWT(decodedToken);
    let msg = `Add the token value in edgekv_tokens.js file and place it in your bundle. Use --save_path option to save the token file to your bundle`
    if (options.save_path) {
      ekvhelper.saveTokenToBundle(options.save_path, options.overwrite, createdToken, decodedToken, nameSpaceList);
    } else {
      cliUtils.logWithBorder(msg);
      response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
    }
  } else {
    cliUtils.logAndExit(1, `ERROR: Unable to create edgekv token. ${createdToken.error_reason}`)
  }
}

function getExpiryDate(expiry: string) {
  try {
    expiry = new Date(expiry).toISOString().split('.').shift() + 'Z';
    return expiry;
  } catch (ex) {
    cliUtils.logAndExit(1, `Expiration time specified is invalid. ${ex}`);
  }
}

function parseNameSpacePermissions(namespace: string) {
  let permissionList = {}; // list to which all the permissions mapped to namespace will be added
  let allowedPermission = ["r", "w", "d"];
  namespace.split(",").forEach(val => {
    let per = val.split("+");
    let permissions = [];

    // if no permissions are provided
    if (per.length != 2) {
      cliUtils.logAndExit(1, `ERROR: Permissions provided is invalid. Please provide from the following : r,w,d`);
    }

    per[1].split('').forEach(function (c) {
      if (allowedPermission.includes(c)) {
        permissions.push(c);
      } else {
        cliUtils.logAndExit(1, `ERROR: Permissions provided is invalid. Please provide from the following : r,w,d`)
      }
    });
    // if namespace is repeated
    if (permissionList[per[0]] != null) {
      cliUtils.logAndExit(1, `ERROR: Namespace cannot be repeated. Please provide valid namespace and permissions.`);
    }
    permissionList[per[0]] = permissions;
  });
  return permissionList;
}