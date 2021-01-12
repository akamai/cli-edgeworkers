import * as httpEdge from '../cli-httpRequest';
import * as error from './ekv-error';
import * as fs from 'fs';

const EDGEKV_API_BASE = '/edgekv/v1';

export function getNameSpaceList(network: string) {
  return httpEdge.getJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces`).then(r => r.body).catch(err => error.handleError(err));
}

export function createNameSpace(network: string, namespace: string) {
  var body = { "name": namespace };
  return httpEdge.postJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces`, body).then(r => r.body).catch(err => error.handleError(err));
}

export function getNameSpace(network: string, namespace: string) {
  return httpEdge.getJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}`).then(r => r.body).catch(err => error.handleError(err));
}

export function initializeEdgeKV() {
  return httpEdge.putJson(`${EDGEKV_API_BASE}/initialize`, "").then(r => r.body).catch(err => error.handleError(err));
}

export function getInitializedEdgeKV() {
  return httpEdge.getJson(`${EDGEKV_API_BASE}/initialize`).then(r => r.body).catch(err => error.handleError(err));
}

export function writeItems(network: string, namespace: string, groupId: string, itemId: string, itemList) {
  let body = itemList;
  return httpEdge.putJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`, body).then(r => r.body).catch(err => error.handleError(err));
}

export function writeItemsFromFile(network: string, namespace: string, groupId: string, itemId: string, itemPath: string) {
  let path = `${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`;
  return httpEdge.sendEdgeRequest(path, 'PUT', fs.readFileSync(itemPath, { encoding: null }).toString('utf8'), {
    'Content-Type': 'application/json'
  }).then(r => r.body).catch(err => error.handleError(err));
}

export function readItem(network: string, namespace: string, groupId: string, itemId: string) {
  return httpEdge.getJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`).then(r => r.body).catch(err => error.handleError(err));
}

export function deleteItem(network: string, namespace: string, groupId: string, itemId: string) {
  return httpEdge.deleteReq(`${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}/items/${itemId}`).then(r => r.body).catch(err => error.handleError(err));
}

export function getItemsFromGroup(network: string, namespace: string, groupId: string) {
  return httpEdge.getJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces/${namespace}/groups/${groupId}`).then(r => r.body).catch(err => error.handleError(err));
}

export function createEdgeKVToken(tokenName: string, permissionList, allowOnStg: boolean, allowOnProd: boolean, ewids:string, expiry) {
  
  let body = {
    "name": tokenName, "allow_on_production": allowOnProd, "allow_on_staging": allowOnStg, "ewids":ewids ,"expiry": expiry, "namespace_permissions": permissionList
  };
  return httpEdge.postJson(`${EDGEKV_API_BASE}/tokens`, body).then(r => r.body).catch(err => error.handleError(err));
}