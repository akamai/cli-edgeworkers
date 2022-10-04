import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as httpEdge from '../cli-httpRequest';
import * as error from './ew-error';
import * as fs from 'fs';

export const EDGEWORKERS_API_BASE = '/edgeworkers/v1';
export const EDGEWORKERS_CLIENT_HEADER = 'X-EW-CLIENT';
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
  let qs = '&';
  const accountKey = httpEdge.accountKey;
  if (accountKey) {
    // Check if query string already included in path, if not use ? otherwise use &
    if (path.indexOf('?') == -1) qs = '?';
    path += `${qs}accountSwitchKey=${accountKey}`;
  }
  headers[EDGEWORKERS_CLIENT_HEADER] = 'CLI';
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
          resolve({ state: true });
        } else {
          // this shouldn't happen unless Version API changes content-types to non-tarball format
          throw new Error(`ERROR: Unexpected content-type: ${contentType}`);
        }
      } else {
        try {
          const errorObj = Buffer.from(error.response.data, 'utf8');
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
    new Uint8Array(fs.readFileSync(edgeworkerTarballPath, { encoding: null })),
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
  let qs = '';
  if (groupId != undefined || groupId != null) {
    qs += `?groupId=${groupId}`;
  }
  if (resourceTierId != undefined) {
    qs += groupId == undefined ? '?' : '&';
    qs += `resourceTierId=${resourceTierId}`;
  }
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids${qs}`,
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
  const body = { groupId: groupId, name: name, resourceTierId: resourceTierId };
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
  let qs = '';
  if (activeOnly !== undefined) {
    qs = '?activeOnly=true';
  }
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/properties${qs}`,
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
  const body = { groupId: groupId, name: name };
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

export function deleteVersion(ewId: string, versionId: string) {
  return httpEdge
    .deleteReq(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/versions/${versionId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'DELETE_VERSION'));
}

export function getAllActivations(ewId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/activations`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function getActivationID(ewId: string, activationId: string) {
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/activations/${activationId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function getVersionActivations(ewId: string, versionId: string) {
  let qs = '?version=';
  if (versionId === undefined || versionId === null) {
    qs = '';
    versionId = '';
  }
  return httpEdge
    .getJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/activations${qs}${versionId}`,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function createActivationId(
  ewId: string,
  network: string,
  versionId: string
) {
  const body = { network: network, version: versionId };
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/activations`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}

export function cloneEdgeworker(
  ewId: string,
  name: string,
  groupId: string,
  resourceTierId: string
) {
  const body = { resourceTierId: resourceTierId };
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
  acl: string,
  url: string,
  expiry: number,
  network: string
) {
  const urlPath = `${EDGEWORKERS_API_BASE}/secure-token`;

  const body = buildTokenBody(hostName, acl, url, expiry, network);

  return httpEdge
    .postJson(urlPath, body, cliUtils.getTimeout(DEFAULT_EW_TIMEOUT))
    .then((r) => r.body)
    .catch((err) => error.handleError(err, 'AUTH_TOKEN'));
}

function buildTokenBody(
  hostName: string,
  acl: string,
  url: string,
  expiry: number,
  network: string
) {
  const params = {};

  if (hostName != undefined && hostName != null) {
    params['hostname'] = hostName;
  }

  if (acl != undefined && acl != null) {
    params['acl'] = acl;
  }
  if (expiry != undefined && expiry != null) {
    params['expiry'] = expiry;
  }
  if (url != undefined && url != null) {
    params['url'] = url;
  }

  if (network != undefined && network != null) {
    params['network'] = network;
  }

  return params;
}
export function deactivateEdgeworker(
  ewId: string,
  network: string,
  versionId: string
) {
  const body = { network: network, version: versionId };
  return httpEdge
    .postJson(
      `${EDGEWORKERS_API_BASE}/ids/${ewId}/deactivations`,
      body,
      cliUtils.getTimeout(DEFAULT_EW_TIMEOUT)
    )
    .then((r) => r.body);
}
