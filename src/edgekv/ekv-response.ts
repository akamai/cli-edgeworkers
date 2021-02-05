import * as ekvhelper from './ekv-helper';
import * as cliUtils from '../utils/cli-utils'
import {ErrorMessage} from './http-error-message';
require('console.table');

export function logNamespace(nameSpaceId: string, createdNameSpace) {
    let retentionPeriod = ekvhelper.convertRetentionPeriod(createdNameSpace["retention_period"]);
    var createNameSpace = {
        Namespace: nameSpaceId,
        RetentionPeriod: retentionPeriod
    }
    console.table([createNameSpace]);
}  

export function logInitialize(initializedEdgekv) {
    let initializeStatus = {
        AccountStatus: initializedEdgekv["account_status"],
        ProductionStatus: initializedEdgekv["production_status"],
        StagingStatus: initializedEdgekv["staging_status"],
        Cpcode: initializedEdgekv["cpcode"]
    }
    console.table([initializeStatus]);
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

export function logToken(tokenName: string, tokenValue, decodedToken, nameSpaceList, savePath:boolean) {
    const shortMnthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let expiryDate = ekvhelper.convertTokenDate(decodedToken['exp']);
    let issueDate = ekvhelper.convertTokenDate(decodedToken['iat'])
    let env = decodedToken["env"];
    let staging = false;
    let production = false;
    env.forEach(function(value) {
        if(value === 's') {
            staging = true;
        } else if(value === 'p') {
            production = true;
        }
    })

    console.log(
      'Token Name:          ', tokenName+'\n'  
    + 'CpCode used:         ', decodedToken["cpc"]+'\n' 
    + 'Valid for EWIDs:     ', decodedToken["ewids"]+'\n'
    + 'Valid on Production: ', production+'\n'
    + 'Valid on Staging:    ', staging+'\n'
    + `Expiry date:          ${weekday[expiryDate.getDay()]},${expiryDate.getDate()} ${shortMnthNames[expiryDate.getMonth()]} ${expiryDate.getFullYear()}\n`
    + `Issue date:           ${weekday[issueDate.getDay()]},${issueDate.getDate()} ${shortMnthNames[issueDate.getMonth()]} ${issueDate.getFullYear()}`);
    
    // if save path is not provided print the token value
    if(!savePath) {
        console.log("value:                "+tokenValue);
    }
    
    console.log('Namespace Permissions:')

    for (let ns of nameSpaceList) {
        let permission = decodedToken[ns];
            let permissionList = [];
            permission.forEach(function(value) {
                permissionList.push(permissions[value]);
            });
            console.log('  '+ ns.substring(ns.indexOf('-')+1)+':  [' + permissionList+']');
    }    
}

export function getNameSpaceFromToken(decodedToken) {
    let nameSpaceList = [];
    Object.keys(decodedToken).forEach(function(key){
        if(key.includes("namespace-")){
            nameSpaceList.push(key);
        }
    })
}

enum permissions {
r = "READ",
w = "WRITE",
d = "DELETE"
}
