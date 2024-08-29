import * as ekvhelper from './ekv-helper';
import * as cliUtils from '../utils/cli-utils';
import {ErrorMessage} from '../utils/http-error-message';
import Table from 'table-layout';
import {isJWTToken} from './ekv-helper';
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
    if (('expiry' in token && (new Date(token['expiry']).getFullYear()) !== 9999)) {
      const expiry = new Date(new Date(token['expiry']).setUTCHours(23, 59, 59));
      const difference = Math.floor(ekvhelper.getDateDifference(expiry));
      let warning = '-';

      if (difference >= 0 && difference <= 30) {
        warning = `Will EXPIRE in less than ${difference} days`;
      } else if (difference <= -1) {
        warning = 'Token already expired';
      }
      const tokenContent = {
        TokenName: token['name'],
        ExpiryDate: `${weekday[expiry.getDay()]},${expiry.getDate()} ${shortMnthNames[expiry.getMonth()]} ${expiry.getFullYear()}`,
        Warning: warning
      };
      tokens.push(tokenContent);
    } else {
      const tokenName = token['name'] ?? 'N/A';
      const tokenActivationStatus = token['tokenActivationStatus'] ?? 'N/A';
      let formattedIssueDate = 'N/A';
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
    }
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

export function logToken(token, savePath = false) {
  if (isJWTToken(token)) {
    const expiryDate = ekvhelper.convertTokenDate(token['exp']);
    const issueDate = ekvhelper.convertTokenDate(token['iat']);
    const env = token['env'];
    let staging = false;
    let production = false;
    env.forEach(function (value) {
      if (value === 's') {
        staging = true;
      } else if (value === 'p') {
        production = true;
      }
    });

    console.log(
      'Token Name:          ', token['name'] + '\n'
      + 'CpCode used:         ', token['cpc'] + '\n'
      + 'Valid for EWIDs:     ', token['ewids'] + '\n'
      + 'Valid on Production: ', production + '\n'
      + 'Valid on Staging:    ', staging + '\n'
      + `Issue date:           ${weekday[issueDate.getDay()]},${issueDate.getDate()} ${shortMnthNames[issueDate.getMonth()]} ${issueDate.getFullYear()} \n`
      + `Expiry date:          ${weekday[expiryDate.getDay()]},${expiryDate.getDate()} ${shortMnthNames[expiryDate.getMonth()]} ${expiryDate.getFullYear()}`);

    const difference = Math.floor(ekvhelper.getDateDifference(expiryDate));
    if(difference >=0 && difference <= 30) {
      console.log(`       *** WARNING: Access Token will EXPIRE in less than ${difference} days! ***`);
    } else if (difference <= -1) {
      console.log('       *** Token already expired ***');
    }

    // if save path is not provided print the token value
    if (!savePath) {
      console.log('value:                ' + token['value']);
    }

    console.log('Namespace Permissions:');

    const nameSpaceList = ekvhelper.getNameSpaceListFromJWT(token);
    for (const ns of nameSpaceList) {
      const permission = token[ns];
      const permissionList = [];
      permission.forEach(function (value) {
        permissionList.push(permissions[value]);
      });
      console.log('  ' + ns.substring(ns.indexOf('-') + 1) + ':  [' + permissionList + ']');
    }
  } else {
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
    const tokenEwids = token['restrictToEdgeWorkerIds'] ? token['restrictToEdgeWorkerIds'].join(', ') : 'N/A';
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
}

export const logTokenToJson = (token, nameSpaceList) => ({ token, nameSpaceList });

enum permissions {
    r = 'READ',
    w = 'WRITE',
    d = 'DELETE'
}
