import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as httpEdge from '../cli-httpRequest';
import * as error from './ew-error';
import * as fs from 'fs';

export const EDGEWORKERS_API_BASE = '/edgeworkers/v1';
export const EDGEWORKERS_CLIENT_HEADER = 'X-EW-CLIENT';
export const EDGEWORKERS_IDE_HEADER = 'X-EW-IDE';
const DEFAULT_EW_TIMEOUT = 120000;

// This is only for fetching tarball bodies
function fetchTarball(
  pth: string,
  method: string,
  body,
  headers,
  downloadPath: string
) {
  const edge = envUtils.getEdgeGrid();
  let path = pth;
  let queryString = '&';
  const accountKey = httpEdge.accountKey;
  if (accountKey) {
    // Check if query string already included in path, if not use ? otherwise use &
    if (path.indexOf('?') == -1) queryString = '?';
    path += `${queryString}accountSwitchKey=${accountKey}`;
  }
  headers[EDGEWORKERS_CLIENT_HEADER] = 'CLI';
  // headers[EDGEWORKERS_IDE_HEADER] = 'VSCODE';
  headers['Accept'] = 'application/gzip';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    edge.auth({
      path,
      method,
      headers,
      body,
      encoding: null,
    });

    edge.send(function (error, response, body) {
      if (!error && httpEdge.isOkStatus(response.status)) {
        const contentType = response.headers['content-type'];
        if (contentType.indexOf('gzip') > -1) {
          const buffer = Buffer.from(response.data, 'utf8');
          fs.writeFileSync(downloadPath, buffer);
          resolve({state: true});
        } else {
          // this shouldn't happen unless Version API changes content-types to non-tarball format
          throw new Error(`ERROR: Unexpected content-type: ${contentType}`);
        }
      } else {
        try {
          const errorObj = Buffer.from(error.response.data as string, 'utf8');
          reject(errorObj.toString());
        } catch (ex) {
          console.error(
            `Got error code: ${error.response.status} calling ${method} ${path}\n${body}`
          );
          reject(body);
        }
      }
    });
  });
}

function postTarball(path: string, edgeworkerTarballPath) {
  return httpEdge.sendEdgeRequest(
    path,
    'POST',
    new Uint8Array(fs.readFileSync(edgeworkerTarballPath, {encoding: null})),
    {
      'Content-Type': 'application/gzip',
    },
    cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
  );
}

function getTarball(path: string, downloadPath: string) {
  return fetchTarball(path, 'GET', '', {}, downloadPath);
}

export function getGroup(groupId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/groups/${groupId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function getAllGroups() {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/groups`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function getEdgeWorkerId(ewId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function getAllEdgeWorkerIds(groupId?: string, resourceTierId?: string) {
  let queryString = '';
  if (groupId != undefined || groupId != null) {
    queryString += `?groupId=${groupId}`;
  }
  if (resourceTierId != undefined) {
    queryString += groupId == undefined ? '?' : '&';
    queryString += `resourceTierId=${resourceTierId}`;
  }
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids${queryString}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'LISTALL_EW'));
}

export function createEdgeWorkerId(
  groupId: string,
  name: string,
  resourceTierId: string
) {
  const body = {groupId: groupId, name: name, resourceTierId: resourceTierId};
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'REGISTER_EW'));
}

export function getContracts() {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/contracts`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_CONTRACT'));
}

export function getProperties(ewId: string, activeOnly: boolean) {
  let queryString = '';
  if (activeOnly !== undefined) {
    queryString = '?activeOnly=true';
  }
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/properties${queryString}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_PROPERTIES'));
}

export function getResourceTiers(contractId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/resource-tiers?contractId=${contractId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_RESTIER'));
}

export function getResourceTierForEwid(ewId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/resource-tier`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_RESTR_FOR_EW'));
}

export function updateEdgeWorkerId(
  ewId: string,
  groupId: string,
  name: string,
  resourceTierId: string
) {
  if (!cliUtils.isValidEwId(ewId)) {
    return error.invalidParameterError('UPDATE_EW');
  }

  const body = {groupId: groupId, name: name};
  if (resourceTierId != undefined && resourceTierId != null) {
    body['resourceTierId'] = resourceTierId;
  }
  return httpEdge
    .putJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'UPDATE_EW'));
}

export function deleteEdgeWorkerId(ewId: string) {
  return httpEdge
    .deleteReq(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'DELETE_EW'));
}

export function getAllVersions(ewId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/versions`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function getVersionId(ewId: string, versionId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/versions/${versionId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function uploadTarball(ewId: string, tarballPath: string) {
  return postTarball(
    `${EDGEWORKERS_API_BASE}/ids/${ewId}/versions`,
    tarballPath
  ).then((r) => r.body);
}

export function downloadTarball(
  ewId: string,
  versionId: string,
  downloadPath: string
) {
  return getTarball(
    `${EDGEWORKERS_API_BASE}/ids/${ewId}/versions/${versionId}/content`,
    downloadPath
  )
    .then((r) => r.state)
    .catch((err) => error.handleError(err, 'DOWNLOAD_TARBALL'));
}

export function downloadRevisionTarball(
  ewId: string,
  revisionId: string,
  downloadPath: string
) {
  return getTarball(
    `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revisionId}/content`,
    downloadPath
  )
    .then((r) => r.state)
    .catch((err) => error.handleError(err, 'DOWNLOAD_REVISION_TARBALL'));
}

export function deleteVersion(ewId: string, versionId: string) {
  return httpEdge
    .deleteReq(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/versions/${versionId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'DELETE_VERSION'));
}

export function getActivations(ewId: string, versionId?: string, network?: string, active?: boolean) {
  let queryString = '?';

  if ((network == undefined || network == null) && (active == undefined || active == null) && (versionId === undefined || versionId === null)) {
    queryString = '';
  } else {
    if (versionId) {
      queryString += `version=${versionId}`;
    }

    if (active) {
      queryString += `${queryString == '?' ? '' : '&'}activeOnNetwork=true`;
    }

    if (network) {
      queryString += `${queryString == '?' ? '' : '&'}network=${network}`;
    }
  }

  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/activations${queryString}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_ACTIVATIONS'));
}

export function getActivationID(ewId: string, activationId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/activations/${activationId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function createActivationId(
  ewId: string,
  network: string,
  versionId: string,
  autoPin?: boolean
) {
  const body = {network: network, version: versionId};
  if (autoPin != undefined) {
    body['autoPin'] = autoPin;
  }

  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/activations`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function listRevisions(
  ewId: string,
  versionId?: string,
  activationId?: string,
  network?: string,
  pinnedOnly?: boolean,
  currentlyPinned?: boolean,
) {
  let queryString = '?';

  if (
    (versionId === undefined || versionId === null) &&
    (activationId === undefined || activationId === null) &&
    (network === undefined || network === null) &&
    (pinnedOnly === undefined || pinnedOnly === null) &&
    (currentlyPinned === undefined || currentlyPinned === null)
  ) {
    queryString = '';
  } else {
    if (versionId) {
      queryString += `version=${versionId}`;
    }
    if (activationId) {
      queryString += `${
        queryString == '?' ? '' : '&'
      }activationId=${activationId}`;
    }
    if (network) {
      queryString += `${queryString == '?' ? '' : '&'}network=${network}`;
    }
    if (pinnedOnly) {
      queryString += `${queryString == '?' ? '' : '&'}pinnedOnly=true`;
    }
    if (currentlyPinned) {
      queryString += `${queryString == '?' ? '' : '&'}currentlyPinned=true`;
    }
  }

  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions${queryString}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT),
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'LIST_REVISIONS'));
}

export function getRevision(ewId: string, revId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT),
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_REVISION'));
}

export function compareRevisions(ewId: string, revId1: string, revId2: string) {
  const body = {revisionId: revId2};
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revId1}/compare`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'COMPARE_REVISIONS'));
}

export function activateRevision(
  ewId: string,
  revId: string,
  note?: string
) {
  if (!cliUtils.isValidRevId(revId)) {
    return error.invalidParameterError('ACTIVATE_REVISION', 'Invalid revision ID');
  }
  const body = {revisionId: revId, note: note};
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/activations`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'ACTIVATE_REVISION'));
}

export function pinRevision(
  ewId: string,
  revId: string,
  note?: string
) {
  const body = {pinNote: note};
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revId}/pin`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'PIN_REVISION'));
}

export function unpinRevision(
  ewId: string,
  revId: string,
  note?: string
) {
  const body = {unpinNote: note};
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revId}/unpin`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'UNPIN_REVISION'));
}

export function getRevisionBOM(ewId: string, revisionId: string, activeVersions?: boolean, currentlyPinned?: boolean) {
  let queryString = '?';

  if ((activeVersions ==  undefined || activeVersions == null) &&
    (currentlyPinned === undefined || currentlyPinned === null)) {
    queryString = '';
  } else {
    if (activeVersions) {
      queryString += 'includeActiveVersions=true';
    }

    if (currentlyPinned) {
      queryString += `${queryString == '?' ? '' : '&'}includeCurrentlyPinnedRevisions=true`;
    }
  }
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/${revisionId}/bom${queryString}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_REVISION_BOM'));
}

export function getRevisionActivations(ewId: string, versionId?: string, network?: string, activationId?: string) {
  let queryString = '?';

  if ((network ==  undefined || network == null) && (versionId === undefined || versionId === null)) {
    queryString = '';
  } else {
    if (activationId) {
      queryString += `=${activationId}`;
    }

    if (versionId) {
      queryString += `${queryString == '?' ? '' : '&'}version=${versionId}`;
    }

    if (network) {
      queryString += `${queryString == '?' ? '' : '&'}network=${network}`;
    }
  }

  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/revisions/activations${queryString}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_REVISION_ACTIVATIONS'));
}

export function cloneEdgeworker(
  ewId: string,
  name: string,
  groupId: string,
  resourceTierId: string
) {
  const body = {resourceTierId: resourceTierId};
  if (groupId != undefined) {
    body['groupId'] = groupId;
  }
  if (name != undefined) {
    body['name'] = name;
  }
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/clone`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'CLONE_EW'));
}

export function validateTarball(tarballPath: string) {
  return postTarball(`${EDGEWORKERS_API_BASE}/validations`, tarballPath).then(
    (r) => r.body
  );
}

export function getAuthToken(
  hostName: string,
  expiry: number
) {
  const urlPath = `${EDGEWORKERS_API_BASE}/secure-token`;

  //  If no hostnames are provided then token is created for all hosts
  if (!hostName) {
    hostName = '/*';
  }
  const body = buildTokenBody(hostName.split(','), expiry);
  return httpEdge
    .postJson(urlPath, body, cliUtils.getTimeout(DEFAULT_EW_TIMEOUT))
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'AUTH_TOKEN'));
}

function buildTokenBody(
  hostName: string[],
  expiry: number
) {
  const params = {};

  if (hostName != undefined && hostName != null) {
    params['hostnames'] = hostName;
  }

  if (expiry != undefined && expiry != null) {
    params['expiry'] = expiry;
  }
  return params;
}
export function deactivateEdgeworker(
  ewId: string,
  network: string,
  versionId: string
) {
  const body = {network: network, version: versionId};
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/deactivations`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function getLimits() {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/limits`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_LIMITS'));
}

export function getAvailableReports() {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/reports`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_AVAILABLE_REPORTS'));
}

export function getReport(
  reportId: number,
  ewid: string,
  start: string,
  statuses: Array<string>,
  eventHandlers: Array<string>,
  end?: string,
) {
  let queryString = `?start=${start}&edgeWorker=${ewid}`;
  if (end) queryString += `&end=${end}`;
  for (const status of statuses) {
    queryString += `&status=${status}`;
  }
  for (const eventHandler of eventHandlers) {
    queryString += `&eventHandler=${eventHandler}`;
  }

  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/reports/${reportId}${queryString}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_REPORT'));
}

export function getLogLevel(ewId: number, loggingId: null | string = null) {
  let url = `${EDGEWORKERS_API_BASE}/ids/${ewId}/loggings`;
  if (loggingId) {
    url += `/${loggingId}`;
  }

  return httpEdge
    .getJson(
      url,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'GET_LOG_LEVEL'));
}

export function setLogLevel(
  ewId: number,
  level: string,
  network: string,
  timeout: string | null,
  ds2Id: string | null,
) {

  const jsonBody = {
    'level': level,
    'network': network,
  };

  if (timeout != null) {
    jsonBody['timeout'] = timeout;
  }

  if (ds2Id != null) {
    jsonBody['ds2Id'] = ds2Id;
  }

  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/loggings`,
      jsonBody,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'SET_LOG_LEVEL'));
}
