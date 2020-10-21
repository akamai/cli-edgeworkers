import * as httpEdge from '../edgeworkers-http';

const EDGEKV_API_BASE = '/edgekv/v1';

export function getNameSpaceList(network: string) {
  return httpEdge.getJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces`).then(r => r.body);
}

export function createNameSpace(network: string, namespace: string) {
  var body = { "name": namespace };
  return httpEdge.postJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces`, body).then(r => r.body);
}

export function getNameSpace(network: string, nameSpace: string) {
  return httpEdge.getJson(`${EDGEKV_API_BASE}/networks/${network}/namespaces/${nameSpace}`).then(r => r.body);
}