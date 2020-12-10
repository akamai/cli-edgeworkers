import * as cliUtils from '../utils/cli-utils';
import jwt_decode from "jwt-decode";

const fs = require('fs');
const untildify = require('untildify');

/**
 * converts seconds to years, months and days
 * @example docs - https://stackoverflow.com/questions/8942895/convert-a-number-of-days-to-days-months-and-years-with-jquery/8943500
 * @param seconds 
 */
export function convertRetentionPeriod(seconds) {
    let days = Math.floor(seconds / 86400); // converting seconds to days
    let y = 365;
    let m = 30;
    var remainder = days % y;
    let remDays = remainder % m;
    let year = (days - remainder) / y;
    let month = (remainder - remDays) / m;
    let result: string = "";

    if (year >= 1) {
        result += year + ((year == 1) ? " year " : " years ");
    }
    if (month >= 1) {
        result += month + ((month == 1) ? " month " : " months ");
    }
    if (remDays >= 1) {
        result += remDays + ((remDays == 1) ? " day" : " days");
    }
    return result;
}

function validateNameSpace(namespace: string) {
    let regex: RegExp = /^[a-zA-Z0-9_-]{1,32}$/;
    let validateNs = validateString(regex, namespace, "NameSpace");
    if (validateNs != undefined && !validateNs.isValid) {
        cliUtils.logAndExit(1, validateNs.error_reason);
    }
}

function validateGroup(group: string) {
    let regex: RegExp = /^[a-zA-Z0-9_-]{1,128}$/;
    let validateGroup = validateString(regex, group, "Group");
    if (validateGroup != undefined && !validateGroup.isValid) {
        cliUtils.logAndExit(1, validateGroup.error_reason);
    }
}

function validateItemKey(itemKey: string) {
    let regex: RegExp = /^[a-zA-Z0-9_-]{1,512}$/;
    let validateItemKey = validateString(regex, itemKey, "ItemKey");
    if (validateItemKey != undefined && !validateItemKey.isValid) {
        cliUtils.logAndExit(1, validateItemKey.error_reason);
    }
}

function validateString(regex: RegExp, input: string, errorFieldName: string) {
    if (!regex.test(input)) {
        return {
            isValid: false,
            version: undefined,
            error_reason: `ERROR: ${errorFieldName} contains invalid characters. ${errorFieldName} must contain only characters: [0-9a-zA-Z_-]`
        }
    }
}

function validateNetwork(network: string) {
    if (network.toUpperCase() !== 'STAGING' && network.toUpperCase() !== 'PRODUCTION') {
        cliUtils.logAndExit(1, `ERROR: Environment parameter must be either STAGING or PRODUCTION - was: ${network}`);
    }
}

/**
 * Validates network, namespace, group and item key
 * @param network 
 * @param namespace 
 * @param group 
 * @param item 
 */
export function validateInputParams(network: string, namespace?: string, group?: string, item?: string) {
    if (typeof network != 'undefined') {
        validateNetwork(network);
    }
    if (typeof namespace != 'undefined') {
        validateNameSpace(namespace)
    }
    if (typeof group != 'undefined') {
        validateGroup(group);
    }
    if (typeof item != 'undefined') {
        validateItemKey(item);
    }
}

/**
 * Validates if json file exists in the specified location
 * and validates json content of the file
 * @param items 
 */
export function validateInputFile(items) {

    // validate if json file exists in the specified location
    var jsFilePath = untildify(items);
    if (!fs.existsSync(jsFilePath)) {
        cliUtils.logAndExit(1, `ERROR: Json file provided in the path (${jsFilePath}) is not found.`);
    }

    //validate json content of the file
    let validJsonFile = validateJson(items);

    if (validJsonFile != undefined && !validJsonFile.isValid) {
        cliUtils.logAndExit(1, validJsonFile.error_reason);
    }
}

function validateJson(items) {
    try {
        let jsonContent = fs.readFileSync(items).toString();
        JSON.parse(jsonContent);
    } catch (ex) {
        return {
            isValid: false,
            error_reason: `ERROR: JSON file provided is invalid. ${ex}\n`
        }
    }
}

// converts jwt token to date format 
export function convertTokenDate(seconds) {
    let convertedDate = new Date(seconds*1000);
    return convertedDate;
}

export function decodeJWTToken(token) {
try {
    let decodedToken = jwt_decode(token)
    return decodedToken;
} catch (ex) {
    cliUtils.logAndExit(1, "Error while trying to decode the JWT token");
}
}

export function getNameSpaceListFromJWT(decodedToken) {
    let nameSpaceList = [];
    Object.keys(decodedToken).forEach(function(key){
        if(key.includes("namespace-")){
            nameSpaceList.push(key);
        }
    });
    return nameSpaceList;  
}

export function checkIfFileExists(filePath) {
    var jsFilePath = untildify(filePath);
    return fs.existsSync(jsFilePath);
}

// export function saveTokenToBundle() {
//     saveToBundle = true;
//       msg = `Token in ${options.save_path}/edgekv_tokens.js was successfully updated.`

//       var extract = tar.extract();
//       var pack = tar.pack();

//       var oldTarBallStream = fs.createReadStream(options.save_path);
//       // because the archive is .tgz we need to gunzip, .pipe extract invokes the extraction
//       oldTarBallStream.pipe(zlib.createGunzip()).pipe(extract); 

//       let tokenContent = `var edgekv_access_tokens = {\n "namespace_default" : {\n "name": ${createdToken["name"]},\n "value" : ${createdToken["value"]}\n } \n } \n export { edgekv_access_tokens };`;
//       pack.entry({ name: '/edgekv_tokens.js'}, tokenContent);   // add the entry before extracting

//       extract.on('entry', function(header, stream, callback) {
//         // write the new entry to the pack stream

//         stream.on('data', function(chunk) {
//           if (header.name == 'documents.json')
//               data += chunk;
//           });

//         stream.pipe(pack.entry(header, callback))   
//       });
      
      

//       extract.on('finish', function() {
//         // adding token to the pack
//         pack.finalize(); // no more changes, pack is finalized

//         var newTarBallStream =   fs.createWriteStream(options.save_path);// create writestream at the last stage
//         pack.pipe(zlib.createGzip()).pipe(newTarBallStream)// gzips and writes the contents to the new tarball
//       });
// }