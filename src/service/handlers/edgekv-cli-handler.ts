import * as edgekvSvc from '../edgekv/edgekv-svc';
import * as cliUtils from '../../utils/cli-utils';

export async function listNameSpaces(network: string) {
  let nameSpaceList = await edgekvSvc.getNameSpaceList(network);
  console.table(nameSpaceList);
}

export async function createNamespace(network: string, nameSpace: string) {
  let msg = `Namespace ${nameSpace} has been created successfully.\n`
  let createdNamespace = cliUtils.toJsonPretty(await edgekvSvc.createNameSpace(network, nameSpace));
  cliUtils.logWithBorder(msg + createdNamespace);
}

export async function getNameSpace(network: string, nameSpace: string) {
  let msg = `Namespace ${nameSpace} retrieved successfully.\n`
  let namespace = cliUtils.toJsonPretty(await edgekvSvc.getNameSpace(network, nameSpace));
  cliUtils.logWithBorder(msg + namespace);
}