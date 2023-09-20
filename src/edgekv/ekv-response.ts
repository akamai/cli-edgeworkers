import * as ekvhelper from './ekv-helper';
import * as cliUtils from '../utils/cli-utils';
import {ErrorMessage} from '../utils/http-error-message';
import Table from 'table-layout';
require('console.table');

const shortMnthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function logNamespace(nameSpaceId: string, createdNameSpace) {
    const retentionPeriod = ekvhelper.convertRetentionPeriod(createdNameSpace['retentionInSeconds']);
    const groupId = (createdNameSpace['groupId'] == undefined) ? 0 : createdNameSpace['groupId'];
    const createNameSpace = {
        Namespace: nameSpaceId,
        RetentionPeriod: retentionPeriod,
        GeoLocation: createdNameSpace['geoLocation'],
        GroupId: groupId,
        'Namespace dataAccessPolicy': createdNameSpace['dataAccessPolicy'] ? 'restrictDataAccess=' + createdNameSpace['dataAccessPolicy']['restrictDataAccess'] + ', policyType=' + createdNameSpace['dataAccessPolicy']['policyType'] : 'N/A'
    };
    console.table([createNameSpace]);
}

export function logAuthGroups(retrievedAuthGroups, ewGrpCapabilities: Map<number, string>, includeEwGroups: boolean) {
  if (retrievedAuthGroups['groups']) {
    const groups = []; // array for table-layout since console table does not auto wrap the lines
    const getBorder = cliUtils.getBorder('EwCapabilities');
    groups.push({ GroupId: 'GroupId', GroupName: 'GroupName', EdgeKVCapabilities: 'EdgeKVCapabilities' }); // dirty hack for header
    groups.push({ GroupId: getBorder, GroupName: getBorder, EdgeKVCapabilities: getBorder}); // dirty hack for border
    if (includeEwGroups) {
      groups[0]['EwCapabilities'] = 'EwCapabilities';
      groups[1]['EwCapabilities'] = getBorder;
    }
    retrievedAuthGroups['groups'].forEach(group => {
      const groupInfo = getGroup(group, ewGrpCapabilities, includeEwGroups);
      groups.push(groupInfo);
    });
    const table = new Table(groups);
    console.log(table.toString());
  } else {
    //logs single group
    const groupInfo = getGroup(retrievedAuthGroups, ewGrpCapabilities, includeEwGroups);
    console.table([groupInfo]);
  }
}

function getGroup(group, ewGrpCapabilities: Map<number, string>, includeEwGroups: boolean) {
  const groupInfo = {
    GroupId: group['groupId'],
    GroupName: group['groupName'],
    EdgeKVCapabilities: group['capabilities'].toString().split(',').join(', ') // need to be formatted for table-layout lib
  };
  if (includeEwGroups) {
    groupInfo['EwCapabilities'] =  ewGrpCapabilities.get(group['groupId']).toString().split(',').join(', '); // need to be formatted for table-layout lib
  }
  return groupInfo;
}

export function logInitialize(initializedEdgekv) {
    const initializeStatus = {
        AccountStatus: initializedEdgekv['accountStatus'],
        ProductionStatus: initializedEdgekv['productionStatus'],
        StagingStatus: initializedEdgekv['stagingStatus'],
        Cpcode: initializedEdgekv['cpcode'],
        DataAccessPolicy: initializedEdgekv['dataAccessPolicy'] ? 'restrictDataAccess=' + initializedEdgekv['dataAccessPolicy']['restrictDataAccess'] + ', allowNamespacePolicyOverride=' + initializedEdgekv['dataAccessPolicy']['allowNamespacePolicyOverride'] : 'N/A'
    };
    console.table([initializeStatus]);
}

export function logTokenList(tokenList) {
    const tokens = [];
    tokenList['tokens'].forEach(token => {
        const issueDate = new Date(new Date(token['issueDate']).setUTCHours(23, 59, 59));
        const latestRefreshDate = new Date(new Date(token['latestRefreshDate']).setUTCHours(23, 59, 59));
        const nextScheduledRefreshDate = new Date(new Date(token['nextScheduledRefreshDate']).setUTCHours(23, 59, 59));
        const tokenContent = {
            TokenName: token['name'],
            TokenActivationStatus: token['tokenActivationStatus'],
            IssueDate: `${weekday[issueDate.getDay()]},${issueDate.getDate()} ${shortMnthNames[issueDate.getMonth()]} ${issueDate.getFullYear()}`,
            LatestRefreshDate: `${weekday[latestRefreshDate.getDay()]},${latestRefreshDate.getDate()} ${shortMnthNames[latestRefreshDate.getMonth()]} ${latestRefreshDate.getFullYear()}`,
            NextScheduledRefreshDate: `${weekday[nextScheduledRefreshDate.getDay()]},${nextScheduledRefreshDate.getDate()} ${shortMnthNames[nextScheduledRefreshDate.getMonth()]} ${nextScheduledRefreshDate.getFullYear()}`,
        };
        tokens.push(tokenContent);
    });
    console.table(tokens);
}

/**
 * todo this needs to be updated when open api releases the beta
 * @param status
 */
export function logError(errorObj, message) {
    if (errorObj.status == 401) {
        cliUtils.logAndExit(1, ErrorMessage.permissionError);
    } else {
        cliUtils.logAndExit(1, message);
    }
}

export function logToken(token, nameSpaceList) {
    const tokenName = token['name'] ?? 'N/A';
    const tokenUuid = token['uuid'] ?? 'N/A';
    const issueDate = ekvhelper.convertTokenDate(token['issueDate']);
    const expiryDate = ekvhelper.convertTokenDate(token['expiry']);
    const tokenActivationStatus = token['tokenActivationStatus']  ?? 'N/A';
    const latestRefrestDate = ekvhelper.convertTokenDate(token['latestRefreshDate']);
    const nextRefresh = token['nextScheduledRefreshDate']  ?? 'N/A';
    const tokenCpcode = token['cpcode'] ?? 'N/A';
    const tokenEwids = token['ewids'] ?? 'N/A';
    const staging = token['allowOnStaging'] ?? 'N/A';
    const production = token['allowOnProduction'] ?? 'N/A';

    console.log(
        'Token Name:          ', tokenName + '\n'
    + 'Token UUID:          ', tokenUuid + '\n'
    + `Issue date:           ${weekday[issueDate.getDay()]},${issueDate.getDate()} ${shortMnthNames[issueDate.getMonth()]} ${issueDate.getFullYear()} \n`
    + `Expiry date:          ${weekday[expiryDate.getDay()]},${expiryDate.getDate()} ${shortMnthNames[expiryDate.getMonth()]} ${expiryDate.getFullYear()} \n`
    + 'Activation status:   ', tokenActivationStatus + '\n'
    + `Latest refresh date:  ${weekday[latestRefrestDate.getDay()]},${latestRefrestDate.getDate()} ${shortMnthNames[latestRefrestDate.getMonth()]} ${latestRefrestDate.getFullYear()} \n`
    + 'Next scheduled refresh date: ', nextRefresh + '\n'
    + 'CpCode used:         ', tokenCpcode + '\n'
    + 'Valid for EWIDs:     ', tokenEwids + '\n'
    + 'Valid on Production: ', production + '\n'
    + 'Valid on Staging:    ', staging);

    console.log('Namespace Permissions:');

    for (const ns of nameSpaceList) {
        const permission = token[ns];
        const permissionList = [];
        permission.forEach(function (value) {
            permissionList.push(permissions[value]);
        });
        console.log('  ' + ns.substring(ns.indexOf('-') + 1) + ':  [' + permissionList + ']');
    }
}

export const logTokenToJson = (token, nameSpaceList) => ({ token, nameSpaceList });

export function getNameSpaceFromToken(decodedToken) {
    const nameSpaceList = [];
    Object.keys(decodedToken).forEach(function (key) {
        if (key.includes('namespace-')) {
            nameSpaceList.push(key);
        }
    });
}

enum permissions {
    r = 'READ',
    w = 'WRITE',
    d = 'DELETE'
}
