import { ekvMetrics } from './ekv-metricFactory';
import * as httpEdge from '../cli-httpRequest';
import * as error from './ekv-error';
import * as cliUtils from '../utils/cli-utils';
import * as fs from 'fs';

export const EDGEKV_API_BASE = '/edgekv/v1';
const INIT_EKV_TIMEOUT = 120000;
const DEFAULT_EKV_TIMEOUT = 60000;

export function getNameSpaceList(network: string, details: boolean) {
  let queryString = '';
  if (details) {
    queryString += `?details=${details}`;
  }
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/networks/${network}/namespaces${queryString}`,
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
  geoLocation,
  dataAccessPolicy: object = undefined
) {
  const body = {
    namespace: namespace,
    retentionInSeconds: retention,
    groupId: groupId,
    geoLocation: geoLocation,
  };
  if (dataAccessPolicy !== undefined) {
    body['dataAccessPolicy'] = dataAccessPolicy;
  }
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
  const body = {
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

export function initializeEdgeKV(dataAccessPolicy) {
  const body = dataAccessPolicy ? { dataAccessPolicy } : undefined;
  return httpEdge
    .putJson(
      `${EDGEKV_API_BASE}/initialize`,
      body,
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

export function updateDatabase(dataAccessPolicy) {
  const body = {
    dataAccessPolicy
  };
  return httpEdge
    .putJson(
      `${EDGEKV_API_BASE}/auth/database`,
      body,
      cliUtils.getTimeout(INIT_EKV_TIMEOUT),
      ekvMetrics.updateDatabase
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
  const body = itemList;
  let writeItemPath = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`;
  if (sandboxid) {
    writeItemPath += `?sandboxId=${sandboxid}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return request
  .then((r) => r.body)
  .catch((err) => error.handleError(err));
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
      ekvMetrics.readItem,
      {transformResponse: [data => data]},
      // axios has a bug where when parsing strings that are wrapped in quotes it will remove the extra quotes at the beginning & end
      // as such, we need to override the response parser to just return the raw response data
    )
    .then((r) => {
      // manually parse body if needed
      return typeof r.body === 'string' ? r.body : cliUtils.parseIfJSON(r.body);
    })
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
  let queryString = '';
  if (maxItems !== undefined) {
    queryString += `?maxItems=${maxItems}`;
  }
  if (sandboxid) {
    queryString += maxItems == undefined ? '?' : '&';
    queryString += `sandboxId=${sandboxid}`;
  }

  const listItemsPath = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}${queryString}`;
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
  const body = {
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
  let queryString = '';
  if (incExpired) {
    queryString += `?includeExpired=${incExpired}`;
  }
  return httpEdge
    .getJson(
      `${EDGEKV_API_BASE}/tokens${queryString}`,
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

export function refreshToken(tokenName: string) {
  const body = undefined;
  return httpEdge
    .postJson(
      `${EDGEKV_API_BASE}/tokens/${tokenName}/refresh`,
      body,
      cliUtils.getTimeout(DEFAULT_EKV_TIMEOUT),
      ekvMetrics.refreshToken
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err));
}

export function modifyAuthGroupPermission(namespace: string, groupId: number) {
  const body = { groupId: groupId };
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
  let group = '';
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
