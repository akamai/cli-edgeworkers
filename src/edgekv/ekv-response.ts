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
    const tokenName = token['name'] ?? 'N/A';
    const tokenActivationStatus = token['tokenActivationStatus'] ?? 'N/A';
    let formattedIssueDate= 'N/A';
    let formattedLatestRefreshDate = 'N/A';
    let formattedNextScheduledRefreshDate = 'N/A';
    if (token['issueDate']) {
      const issueDate = new Date(new Date(token['issueDate']).setUTCHours(23, 59, 59));
      formattedIssueDate = `${weekday[issueDate.getDay()]}, ${issueDate.getDate()} ${shortMnthNames[issueDate.getMonth()]} ${issueDate.getFullYear()}`;
    }
    if (token['latestRefreshDate']) {
      const latestRefreshDate = new Date(new Date(token['latestRefreshDate']).setUTCHours(23, 59, 59));
      formattedLatestRefreshDate = `${weekday[latestRefreshDate.getDay()]}, ${latestRefreshDate.getDate()} ${shortMnthNames[latestRefreshDate.getMonth()]} ${latestRefreshDate.getFullYear()}`;
    }
    if (token['nextScheduledRefreshDate']) {
      const nextScheduledRefreshDate = new Date(new Date(token['nextScheduledRefreshDate']).setUTCHours(23, 59, 59));
      formattedNextScheduledRefreshDate = `${weekday[nextScheduledRefreshDate.getDay()]}, ${nextScheduledRefreshDate.getDate()} ${shortMnthNames[nextScheduledRefreshDate.getMonth()]} ${nextScheduledRefreshDate.getFullYear()}`;
    }
    const tokenContent = {
        TokenName: tokenName,
        TokenActivationStatus: tokenActivationStatus,
        IssueDate: formattedIssueDate,
        LatestRefreshDate: formattedLatestRefreshDate,
        NextScheduledRefreshDate: formattedNextScheduledRefreshDate,
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

export function logToken(token) {
  const tokenName = token['name'] ?? 'N/A';
  const tokenUuid = token['uuid'] ?? 'N/A';
  let formattedIssueDate= 'N/A';
  let formattedExpiryDate = 'N/A';
  let formattedLatestRefreshDate = 'N/A';
  let formattedNextScheduledRefreshDate = 'N/A';
  if (token['issueDate']) {
    const issueDate = new Date(new Date(token['issueDate']).setUTCHours(23, 59, 59));
    formattedIssueDate = `${weekday[issueDate.getDay()]}, ${issueDate.getDate()} ${shortMnthNames[issueDate.getMonth()]} ${issueDate.getFullYear()}`;
  }
  if (token['expiry']) {
    const expiryDate = new Date(new Date(token['expiry']).setUTCHours(23, 59, 59));
    formattedExpiryDate = (expiryDate.getFullYear() >= 9999) ? 'INDEFINITE' : `${weekday[expiryDate.getDay()]}, ${expiryDate.getDate()} ${shortMnthNames[expiryDate.getMonth()]} ${expiryDate.getFullYear()}`;
  }
  if (token['latestRefreshDate']) {
    const latestRefreshDate = new Date(new Date(token['latestRefreshDate']).setUTCHours(23, 59, 59));
    formattedLatestRefreshDate = `${weekday[latestRefreshDate.getDay()]}, ${latestRefreshDate.getDate()} ${shortMnthNames[latestRefreshDate.getMonth()]} ${latestRefreshDate.getFullYear()}`;
  }
  if (token['nextScheduledRefreshDate']) {
    const nextScheduledRefreshDate = new Date(new Date(token['nextScheduledRefreshDate']).setUTCHours(23, 59, 59));
    formattedNextScheduledRefreshDate = `${weekday[nextScheduledRefreshDate.getDay()]}, ${nextScheduledRefreshDate.getDate()} ${shortMnthNames[nextScheduledRefreshDate.getMonth()]} ${nextScheduledRefreshDate.getFullYear()}`;
  }
  const tokenActivationStatus = token['tokenActivationStatus']  ?? 'N/A';
  const tokenCpcode = token['cpcode'] ?? 'N/A';
  const tokenEwids = token['ewids'] ? token['ewids'].join(', ') : 'N/A';
  const staging = token['allowOnStaging'] ?? 'N/A';
  const production = token['allowOnProduction'] ?? 'N/A';

  console.log(
    'Token Name:          ', tokenName + '\n'
  + 'Token UUID:          ', tokenUuid + '\n'
  + 'Issue date:          ', formattedIssueDate + '\n'
  + 'Expiry date:         ', formattedExpiryDate + '\n'
  + 'Activation status:   ', tokenActivationStatus + '\n'
  + 'Latest refresh date: ', formattedLatestRefreshDate + '\n'
  + 'Next scheduled refresh date: ', formattedNextScheduledRefreshDate + '\n'
  + 'CpCode used:         ', tokenCpcode + '\n'
  + 'Valid for EWIDs:     ', tokenEwids + '\n'
  + 'Valid on Production: ', production + '\n'
  + 'Valid on Staging:    ', staging + '\n'
  + 'Namespace Permissions:');

  for (const ns in token['namespacePermissions']) {
      const permission = token['namespacePermissions'][ns];
      const permissionList = [];
      permission.forEach((value) => {
          permissionList.push(permissions[value]);
      });
      console.log('  ' + ns + ':  [' + permissionList + ']');
  }
}

export const logTokenToJson = (token, nameSpaceList) => ({ token, nameSpaceList });

enum permissions {
    r = 'READ',
    w = 'WRITE',
    d = 'DELETE'
}
