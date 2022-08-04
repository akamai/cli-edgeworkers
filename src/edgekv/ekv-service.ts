import { ekvMetrics } from './ekv-metricFactory';
import * as httpEdge from '../cli-httpRequest';
import * as error from './ekv-error';
import * as cliUtils from '../utils/cli-utils';
import * as fs from 'fs';
import { listItemsFromGroup } from './ekv-handler';

export const EDGEKV_API_BASE = '/edgekv/v1';
const INIT_EKV_TIMEOUT = 120000;
const DEFAULT_EKV_TIMEOUT = 60000;

export function getNameSpaceList(network: string, details: boolean) {
  var qs: string = '';
  if (details) {
    qs += `?details=${details}`;
  }
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/networks/${network}/namespaces${qs}`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.listNameSpaces
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function getGroupsList(network: string, namespace: string) {
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.listGroups
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function createNameSpace(
  network: string,
  namespace: string,
  retention,
  groupId,
  geoLocation
) {
  var body = {
    namespace: namespace,
    retentionInSeconds: retention,
    groupId: groupId,
    geoLocation: geoLocation,
  };
  return httpEdge
    .postJson(
      `${EDGEKV_API_BASE}/networks/${network}/namespaces`,
      body,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.createNamespace
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function getNameSpace(network: string, namespace: string) {
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.showNamespace
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function updateNameSpace(
  network: string,
  namespace: string,
  retention,
  groupId,
  geoLocation
) {
  var body = {
    namespace: namespace,
    retentionInSeconds: retention,
    groupId: groupId,
    geoLocation: geoLocation,
  };
  return httpEdge
    .putJson(
      `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}`,
      body,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.updateNamespace
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function initializeEdgeKV() {
  return httpEdge
    .putJson(
      `${EDGEKV_API_BASE}/initialize`,
      '',
      cliUtils.getTimeout(INIT_EKV_TIMEOUT),
      ekvMetrics.initialize
    )
    .then((r) => r.response)
    .catch((err) => error.handleError(err));
}

export function getInitializedEdgeKV() {
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/initialize`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.showInitStatus
    )
    .then((r) => r.response)
    .catch((err) => error.handleError(err));
}

export function writeItems(
  network: string,
  namespace: string,
  groupId: string,
  itemId: string,
  itemList,
  sandboxid: string
) {
  let body = itemList;
  let writeItemPath = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`;
  if (sandboxid) {
    writeItemPath += `?sandboxId=${sandboxid}`;
  }

  let request: Promise<any>;
  if (typeof body === 'string') {
    // If the body is a string
    request = httpEdge.sendEdgeRequest(
      writeItemPath,
      'PUT',
      body,
      {
        'Content-Type': 'text/plain',
      },
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.writeItem
    );
  } else {
    // If the body is not a string but a JSON object
    request = httpEdge.putJson(
      writeItemPath,
      body,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.writeItem
    );
  }

  return request.then((r) => r.body).catch((err) => error.handleError(err));
}

export function writeItemsFromFile(
  network: string,
  namespace: string,
  groupId: string,
  itemId: string,
  itemPath: string,
  sandboxid: string
) {
  let writeItemFromJsonpath = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`;
  if (sandboxid) {
    writeItemFromJsonpath += `?sandboxId=${sandboxid}`;
  }
  return httpEdge
    .sendEdgeRequest(
      writeItemFromJsonpath,
      'PUT',
      fs.readFileSync(itemPath, { encoding: null }).toString('utf8'),
      {
        'Content-Type': 'application/json',
      },
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.writeItem
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function readItem(
  network: string,
  namespace: string,
  groupId: string,
  itemId: string,
  sandboxid: string
) {
  let readItemPath = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`;
  if (sandboxid) {
    readItemPath += `?sandboxId=${sandboxid}`;
  }
  return httpEdge
    .getJson(
      readItemPath,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.readItem
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function deleteItem(
  network: string,
  namespace: string,
  groupId: string,
  itemId: string,
  sandboxid: string
) {
  let deleteItemPath = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`;
  if (sandboxid) {
    deleteItemPath += `?sandboxId=${sandboxid}`;
  }
  return httpEdge
    .deleteReq(
      deleteItemPath,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.deleteItem
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function getItemsFromGroup(
  network: string,
  namespace: string,
  groupId: string,
  maxItems?: number,
  sandboxid?: string
) {
  var qs: string = '';
  if (maxItems !== undefined) {
    qs += `?maxItems=${maxItems}`;
  }
  if (sandboxid) {
    qs += maxItems == undefined ? '?' : '&';
    qs += `sandboxId=${sandboxid}`;
  }

  let listItemsPath = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}${qs}`;
  return httpEdge
    .getJson(
      listItemsPath,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.readItemsFromGroup
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function createEdgeKVToken(
  tokenName: string,
  permissionList,
  allowOnStg: boolean,
  allowOnProd: boolean,
  ewids: string[],
  expiry
) {
  let body = {
    name: tokenName,
    allowOnProduction: allowOnProd,
    allowOnStaging: allowOnStg,
    restrictToEwids: ewids,
    expiry: expiry,
    namespacePermissions: permissionList,
  };
  return httpEdge
    .postJson(
      `${EDGEKV_API_BASE}/tokens`,
      body,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.createToken
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function getSingleToken(tokenName: string) {
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/tokens/${tokenName}`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.readToken
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function getTokenList(incExpired: boolean) {
  var qs: string = '';
  if (incExpired) {
    qs += `?includeExpired=${incExpired}`;
  }
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/tokens${qs}`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.readTokenList
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function revokeToken(tokenName: string) {
  return httpEdge
    .deleteReq(
      `${EDGEKV_API_BASE}/tokens/${tokenName}`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.deleteToken
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function modifyAuthGroupPermission(namespace: string, groupId: number) {
  let body = { groupId: groupId };
  return httpEdge
    .putJson(
      `${EDGEKV_API_BASE}/auth/namespaces/${namespace}`,
      body,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.modifyAuthGroup
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function listAuthGroups(groupId?: number) {
  var group: string = '';
  if (groupId && groupId > 0) {
    group = `/${groupId}`;
  }
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/auth/groups${group}`,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.listAuthGroup
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}
