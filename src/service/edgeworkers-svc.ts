import * as envUtils from '../utils/env-utils';
import * as cliUtils from '../utils/cli-utils';
import * as fs from 'fs';

var accountKey: string = null;

const EDGEWORKERS_API_BASE = '/edgeworkers/v1';

export function setAccountKey(account: string) {
  accountKey = account;
}

function isOkStatus(code) {
  return code >= 200 && code < 300;
}

// This is only for fetching tarball bodies
function fetchTarball(pth: string, method: string, body, headers, downloadPath: string) {
  const edge = envUtils.getEdgeGrid();
  var path = pth;
  var qs: string = "&";
  if (accountKey) {
    // Check if query string already included in path, if not use ? otherwise use &
    if (path.indexOf("?") == -1)
      qs = "?";
    path += `${qs}accountSwitchKey=${accountKey}`;
  }

  return new Promise<any>(
    (resolve, reject) => {

      edge.auth({
        path,
        method,
        headers,
        body,
        encoding: null
      });

      edge.send(function (error, response, body) {
        if (error) {
          reject(error);
        }
        else if (isOkStatus(response.statusCode)) {
          var contentType = response.headers['content-type'];
          if (contentType.indexOf('gzip') > -1) {
            const buffer = Buffer.from(body, 'utf8');
            fs.writeFileSync(downloadPath, buffer);
            resolve({state: true});
          }
          else {
            // this shouldn't happen unless Version API changes content-types to non-tarball format
            throw new Error(`ERROR: Unexpected content-type: ${contentType}`);
          }
        }
        else {
          try {
            var errorObj = JSON.parse(body);
            reject(cliUtils.toJsonPretty(errorObj));
          }
          catch (ex) {
            console.error(`got error code: ${response.statusCode} calling ${method} ${path}\n${body}`);
            reject(body);
          }
        }
      });
    });
}

// This is for non-Tarball gets and all POST/PUT actions that return JSON or string bodies
function sendEdgeRequest(pth: string, method: string, body, headers) {
  const edge = envUtils.getEdgeGrid();
  var path = pth;
  var qs: string = "&";
  if (accountKey) {
    // Check if query string already included in path, if not use ? otherwise use &
    if (path.indexOf("?") == -1)
      qs = "?";
    path += `${qs}accountSwitchKey=${accountKey}`;
  }

  return new Promise<any>(
    (resolve, reject) => {
      edge.auth({
        path,
        method,
        headers,
        body
      });

      edge.send(function (error, response, body) {
        if (error) {
          reject(error);
        } else if (isOkStatus(response.statusCode)) {
          var obj: any = {
            response,
            body: !!body ? cliUtils.parseIfJSON(body) : undefined
          };
          resolve(obj);
        } else {
          try {
            var errorObj = JSON.parse(body);
            reject(cliUtils.toJsonPretty(errorObj));
          } catch (ex) {
            console.error(`got error code: ${response.statusCode} calling ${method} ${path}\n${body}`);
            reject(body);
          }
        }
      });
    });
}

function postJson(path: string, body) {
  return sendEdgeRequest(path, 'POST', body, {
    'Content-Type': 'application/json'
  });
}

function putJson(path: string, body) {
  return sendEdgeRequest(path, 'PUT', body, {
    'Content-Type': 'application/json'
  });
}

function getJson(path: string) {
  return sendEdgeRequest(path, 'GET', '', {});
}

function postTarball(path: string, edgeworkerTarballPath) {
  return sendEdgeRequest(path, 'POST', new Uint8Array(fs.readFileSync(edgeworkerTarballPath, { encoding: null })), {
    'Content-Type': 'application/gzip'
  });
}

function getTarball(path: string, downloadPath: string) {
  return fetchTarball(path, 'GET', '', {}, downloadPath);
}

export function getGroup(groupId: string) {
  return getJson(`${EDGEWORKERS_API_BASE}/groups/${groupId}`).then(r => r.body);
}

export function getAllGroups() {
  return getJson(`${EDGEWORKERS_API_BASE}/groups`).then(r => r.body);
}

export function getEdgeWorkerId(ewId: string) {
  return getJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}`).then(r => r.body);
}

export function getAllEdgeWorkerIds(groupId?: string) {
  var qs: string = "?groupId=";
  if (groupId === undefined || groupId === null) {
    qs = '';
    groupId = '';
  }
  return getJson(`${EDGEWORKERS_API_BASE}/ids${qs}${groupId}`).then(r => r.body);
}

export function createEdgeWorkerId(groupId: string, name: string) {
  var body = { "groupId": groupId, "name": name };
  return postJson(`${EDGEWORKERS_API_BASE}/ids`, body).then(r => r.body);
}

export function updateEdgeWorkerId(ewId: string, groupId: string, name: string) {
  var body = { "groupId": groupId, "name": name };
  return putJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}`, body).then(r => r.body);
}

export function getAllVersions(ewId: string) {
  return getJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}/versions`).then(r => r.body);
}

export function getVersionId(ewId: string, versionId: string) {
  return getJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}/versions/${versionId}`).then(r => r.body);
}

export function uploadTarball(ewId: string, tarballPath: string) {
  return postTarball(`${EDGEWORKERS_API_BASE}/ids/${ewId}/versions`, tarballPath).then(r => r.body);
}

export function downloadTarball(ewId: string, versionId: string, downloadPath: string) {
  return getTarball(`${EDGEWORKERS_API_BASE}/ids/${ewId}/versions/${versionId}/content`, downloadPath).then(r => r.state);
}

export function getAllActivations(ewId: string) {
  return getJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}/activations`).then(r => r.body);
}

export function getActivationID(ewId: string, activationId: string) {
  return getJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}/activations/${activationId}`).then(r => r.body);
}

export function getVersionActivations(ewId: string, versionId: string) {
  var qs: string = "?version=";
  if (versionId === undefined || versionId === null) {
    qs = '';
    versionId = '';
  }
  return getJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}/activations${qs}${versionId}`).then(r => r.body);
}

export function createActivationId(ewId: string, network: string, versionId: string) {
  var body = { "network": network, "version": versionId };
  return postJson(`${EDGEWORKERS_API_BASE}/ids/${ewId}/activations`, body).then(r => r.body);
}
