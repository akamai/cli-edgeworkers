import * as ekvhelper from './ekv-helper';
import * as cliUtils from '../utils/cli-utils'
import {ErrorMessage} from '../utils/http-error-message';
import { type } from 'os';
import Table from 'table-layout'
require('console.table');

const shortMnthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function logNamespace(nameSpaceId: string, createdNameSpace) {
    let retentionPeriod = ekvhelper.convertRetentionPeriod(createdNameSpace["retentionInSeconds"]);
    let groupId = (createdNameSpace["groupId"] == undefined) ? 0 : createdNameSpace["groupId"];
    var createNameSpace = {
        Namespace: nameSpaceId,
        RetentionPeriod: retentionPeriod,
        GeoLocation: createdNameSpace["geoLocation"],
        GroupId: groupId
    }
    console.table([createNameSpace]);
}

export function logAuthGroups(retrievedAuthGroups, ewGrpCapabilities: Map<number, String>, includeEwGroups: boolean) {
  if (retrievedAuthGroups["groups"]) {
    let groups = []; // array for table-layout since console table does not auto wrap the lines
    const getBorder = cliUtils.getBorder("EwCapabilities");
    groups.push({ GroupId: "GroupId", GroupName: "GroupName", EdgeKVCapabilities: "EdgeKVCapabilities" }) // dirty hack for header
    groups.push({ GroupId: getBorder, GroupName: getBorder, EdgeKVCapabilities: getBorder}) // dirty hack for border
    if (includeEwGroups) {
      groups[0]["EwCapabilities"] = "EwCapabilities";
      groups[1]["EwCapabilities"] = getBorder;
    }
    retrievedAuthGroups["groups"].forEach(group => {
      let groupInfo = getGroup(group, ewGrpCapabilities, includeEwGroups);
      groups.push(groupInfo);
    });
    const table = new Table(groups);
    console.log(table.toString());
  } else {
    //logs single group
    let groupInfo = getGroup(retrievedAuthGroups, ewGrpCapabilities, includeEwGroups);
    console.table([groupInfo]);
  }
}

function getGroup(group, ewGrpCapabilities: Map<number, String>, includeEwGroups: boolean) {
  var groupInfo = {
    GroupId: group["groupId"],
    GroupName: group["groupName"],
    EdgeKVCapabilities: group["capabilities"].toString().split(',').join(', ') // need to be formatted for table-layout lib
  }
  if (includeEwGroups) {
    groupInfo["EwCapabilities"] =  ewGrpCapabilities.get(group["groupId"]).toString().split(',').join(', '); // need to be formatted for table-layout lib
  }
  return groupInfo;
}

export function logInitialize(initializedEdgekv) {
    let initializeStatus = {
        AccountStatus: initializedEdgekv["accountStatus"],
        ProductionStatus: initializedEdgekv["productionStatus"],
        StagingStatus: initializedEdgekv["stagingStatus"],
        Cpcode: initializedEdgekv["cpcode"]
    }
    console.table([initializeStatus]);
}

export function logTokenList(tokenList) {
    let tokens = [];
    tokenList["tokens"].forEach(token => {
        let expiry = new Date(new Date(token["expiry"]).setUTCHours(23, 59, 59));
        let difference = Math.floor(ekvhelper.getDateDifference(expiry));
        let warning = "-";

        if (difference >=0 && difference <= 30) {
            warning = `Will EXPIRE in less than ${difference} days`;
        } else if (difference <= -1) {
            warning = `Token already expired`;
        }
        let tokenContent = {
            TokenName: token["name"],
            ExpiryDate: `${weekday[expiry.getDay()]},${expiry.getDate()} ${shortMnthNames[expiry.getMonth()]} ${expiry.getFullYear()}`,
            Warning: warning
        }
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

export function logToken(tokenName: string, tokenValue, decodedToken, nameSpaceList, savePath: boolean) {
    let expiryDate = ekvhelper.convertTokenDate(decodedToken['exp']);
    let issueDate = ekvhelper.convertTokenDate(decodedToken['iat'])
    let env = decodedToken["env"];
    let staging = false;
    let production = false;
    env.forEach(function (value) {
        if (value === 's') {
            staging = true;
        } else if (value === 'p') {
            production = true;
        }
    })

    console.log(
        'Token Name:          ', tokenName + '\n'
    + 'CpCode used:         ', decodedToken["cpc"] + '\n'
    + 'Valid for EWIDs:     ', decodedToken["ewids"] + '\n'
    + 'Valid on Production: ', production + '\n'
    + 'Valid on Staging:    ', staging + '\n'
    + `Issue date:           ${weekday[issueDate.getDay()]},${issueDate.getDate()} ${shortMnthNames[issueDate.getMonth()]} ${issueDate.getFullYear()} \n`
    + `Expiry date:          ${weekday[expiryDate.getDay()]},${expiryDate.getDate()} ${shortMnthNames[expiryDate.getMonth()]} ${expiryDate.getFullYear()}`);

    let difference = Math.floor(ekvhelper.getDateDifference(expiryDate));
    if(difference >=0 && difference <= 30) {
        console.log(`       *** WARNING: Access Token will EXPIRE in less than ${difference} days! ***`);
    } else if (difference <= -1) {
        console.log(`       *** Token already expired ***`);
    }

    // if save path is not provided print the token value
    if (!savePath) {
        console.log("value:                " + tokenValue);
    }

    console.log('Namespace Permissions:')

    for (let ns of nameSpaceList) {
        let permission = decodedToken[ns];
        let permissionList = [];
        permission.forEach(function (value) {
            permissionList.push(permissions[value]);
        });
        console.log('  ' + ns.substring(ns.indexOf('-') + 1) + ':  [' + permissionList + ']');
    }
}

export function getNameSpaceFromToken(decodedToken) {
    let nameSpaceList = [];
    Object.keys(decodedToken).forEach(function (key) {
        if (key.includes("namespace-")) {
            nameSpaceList.push(key);
        }
    })
}

function getEwCapabilities() {

}

enum permissions {
    r = "READ",
    w = "WRITE",
    d = "DELETE"
}
