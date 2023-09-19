import * as cliUtils from '../utils/cli-utils';
import jwt_decode from 'jwt-decode';
import * as response from './ekv-response';
import { fromSeconds } from 'from-seconds';

import fs from 'fs';
import path from 'path';
import untildify from 'untildify';
import * as tar from 'tar-stream';
import zlib from 'zlib';
import { ekvJsonOutput } from './client-manager';
const tkn_var = 'var edgekv_access_tokens = {';
const tkn_export = '\n}\nexport { edgekv_access_tokens };';

/**
 * converts seconds to years, months and days
 * @param seconds
 */
export function convertRetentionPeriod(seconds) {
    if (seconds == 0) {
        return 'Indefinite';
    }
    const convResult = fromSeconds(seconds);
    const yearConv = convResult.toYears();
    const year = yearConv['years'];
    const month = yearConv['months'];
    const days = yearConv['days'];
    const totalDays = convResult.toDays()['days'];
    let result = '';

    if (year >= 1) {
        result += year + ((year == 1) ? ' year ' : ' years ');
    }
    if (month >= 1) {
        result += month + ((month == 1) ? ' month ' : ' months ');
    }
    if (days >= 1) {
        result += days + ((days == 1) ? ' day' : ' days');
    }
    result += ' (' + totalDays + 'days)';
    return result;
}

export function validateNetwork(network: string,sandboxId?: string) {
    if(sandboxId){
        if (network.toUpperCase() !== cliUtils.staging) {
            cliUtils.logAndExit(1, `ERROR: Environment parameter must be only staging - was: ${network}`);
        }
    }
    else{
        if (network.toUpperCase() !== cliUtils.staging && network.toUpperCase() !== cliUtils.production) {
            cliUtils.logAndExit(1, `ERROR: Environment parameter must be either staging or production - was: ${network}`);
        }
    }
}

/**
 * Formats a database data access policy option string
 * and returns as an object for use in requests
 * @param dataAccessPolicyStr
 */
export function formatDataAccessPolicy(dataAccessPolicyStr: string) {
  const dataAccessPolicy = {};
  if (dataAccessPolicyStr) {
    const dataAccessPolicyArr = dataAccessPolicyStr.split(',');
    dataAccessPolicyArr.filter(item => item.includes('=')).forEach(item => {
      const property = item.split('=');
      if (property.length !== 2) {
        console.error(`Warning: cannot parse invalid item ['${item}'], skip it.`);
      } else {
        const boolProp = property[1].trim();
        // Avoid setting improper string value to false
        if (boolProp === 'true' || boolProp === 'false') {
          dataAccessPolicy[property[0].trim()] = boolProp === 'true';
        }
      }
    });
  }
  return dataAccessPolicy;
}

/**
 * Validates a database data access policy option string
 * and returns as a formatted object for use in requests
 * @param dataAccessPolicyStr
 */
export function validateDataAccessPolicy(dataAccessPolicyStr: string) {
  const dataAccessPolicy = formatDataAccessPolicy(dataAccessPolicyStr);
  if (dataAccessPolicy['restrictDataAccess'] == undefined || dataAccessPolicy['allowNamespacePolicyOverride'] == undefined) {
    cliUtils.logAndExit(
      1,
      'ERROR: `dataAccessPolicy` option must be of the form `restrictDataAccess=<bool>,allowNamespacePolicyOverride=<bool>` where <bool> can be true or false.'
    );
  }
  return dataAccessPolicy;
}

/**
 * Validates a database data access policy option string
 * and returns as a formatted object for use in requests
 * @param dataAccessPolicyStr
 */
export function validateNamespaceDataAccessPolicy(dataAccessPolicyStr: string) {
  const dataAccessPolicy = formatDataAccessPolicy(dataAccessPolicyStr);
  if (dataAccessPolicy['restrictDataAccess'] == undefined) {
    cliUtils.logAndExit(
      1,
      'ERROR: `dataAccessPolicy` option must be of the form `restrictDataAccess=<bool>` where <bool> can be true or false.'
    );
  }
  return dataAccessPolicy;
}

/**
 * Validates if json file exists in the specified location
 * and validates json content of the file
 * @param items
 */
export function validateInputFile(itemFilePath) {

    // validate if json file exists in the specified location
    if (!checkIfFileExists(itemFilePath)) {
        cliUtils.logAndExit(1, `ERROR: Json file provided in the path (${itemFilePath}) is not found or file does not have permissions.`);
    }
    //validate json content of the file
    const validJsonFile = validateJson(itemFilePath);

    if (validJsonFile != undefined && !validJsonFile.isValid) {
        cliUtils.logAndExit(1, validJsonFile.error_reason);
    }
}

/**
 * Validates the json file content
 * @param itemFilePath
 */
function validateJson(itemFilePath) {
    try {
        const jsonContent = fs.readFileSync(itemFilePath).toString();
        JSON.parse(jsonContent);
    } catch (ex) {
        return {
            isValid: false,
            error_reason: `ERROR: JSON file provided is invalid. ${ex}\n`
        };
    }
}

// converts jwt token to date format
export function convertTokenDate(seconds) {
    const convertedDate = new Date(seconds * 1000);
    return convertedDate;
}

// decode JWT token returned by API
export function decodeJWTToken(token) {
    try {
        const decodedToken = jwt_decode(token);
        return decodedToken;
    } catch (ex) {
        cliUtils.logAndExit(1, 'Error while trying to decode the JWT token');
    }
}

export function getNameSpaceListFromJWT(decodedToken) {
    const nameSpaceList = [];
    Object.keys(decodedToken).forEach(function (key) {
        if (key.includes('namespace-')) {
            nameSpaceList.push(key);
        }
    });
    return nameSpaceList;
}

// check if file exisits and file has read / write permissions
export function checkIfFileExists(filePath) {
    try {
        const jsFilePath = untildify(filePath);
        fs.accessSync(jsFilePath, fs.constants.R_OK && fs.constants.W_OK);
        return true;
    } catch (e) {
        return false;
    }
}

// get extension of a file
export function getFileExtension(filePath) {
    return path.extname(filePath);
}

// This checks if the date string is in format yyyy-mm-dd
export function isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    return dateString.match(regEx) != null;
}

/**
 * If provided save_path is tgz bundle
 * if no token file exists, new file is created.Else the existing file is updated
 * If overwrite option is specified token content will be overwritte else token will be displayed
 * for users to copy to their file
 * @param savePath
 * @param overWrite
 * @param createdToken
 * @param nameSpaceList
 */
export function saveTokenToBundle(savePath, overWrite, createdToken, nameSpaceList) {
    let tokenContent = [];
    let data = '';
    let updateFile = false;
    const msg = `Token in ${savePath}/edgekv_tokens.js was successfully updated.`;

    const extract = tar.extract();
    const pack = tar.pack();

    const oldTarBallStream = fs.createReadStream(savePath);

    oldTarBallStream.on('error', function () {
        const errMsg = 'ERROR: Unable to read the tar bundle. Add the token in file edgekv_tokens.js and place it in your tar bundle';
        if (ekvJsonOutput.isJSONOutputMode()) {
            ekvJsonOutput.writeJSONOutput(
                0,
                errMsg,
                response.logTokenToJson(createdToken, nameSpaceList)
            );
        } else {
            cliUtils.logWithBorder(errMsg);
            response.logToken(createdToken, nameSpaceList);
        }
        process.exit(1);
    });

    // because the archive is .tgz we need to gunzip, .pipe extract invokes the extraction
    oldTarBallStream.pipe(zlib.createGunzip()).pipe(extract);

    extract.on('entry', function (header, stream, callback) {

        if (header.name != 'edgekv_tokens.js') {
            // if the folder already has token we dont want to stream it, it creates duplicate header
            stream.pipe(pack.entry(header, callback));
        } else {
            updateFile = true;
            stream.on('data', function (chunk) {
                data += chunk;
                const existingTokenContent = validateAndGetExistingTokenContent(data, createdToken, nameSpaceList);
                // updated content
                tokenContent = updateTokenContent(existingTokenContent, nameSpaceList, createdToken, overWrite);

            });
            callback();
        }
    });

    extract.on('finish', function () {
        // write the new entry to the pack stream
        let tokenFileContent = '';
        if (!updateFile) {
            for (const ns of nameSpaceList) {
                tokenContent[ns] = { 'name': createdToken['name'], 'reference': createdToken['uuid'] };
            }
        }
        tokenFileContent = constructTokenFile(tokenContent);
        pack.entry({ name: 'edgekv_tokens.js' }, tokenFileContent);
        pack.finalize(); // no more changes, pack is finalized

        const newTarBallStream = fs.createWriteStream(savePath);// create writestream at the last stage
        pack.pipe(zlib.createGzip()).pipe(newTarBallStream);// gzips and writes the contents to the new tarball

        if (ekvJsonOutput.isJSONOutputMode()) {
            ekvJsonOutput.writeJSONOutput(
                0,
                msg,
                response.logTokenToJson(createdToken, nameSpaceList)
            );
        } else {
            cliUtils.logWithBorder(msg);
            response.logToken(createdToken, nameSpaceList);
        }
    });
}

/**
 * Constructs the token file with static constants
 * @param tokenContent
 */
function constructTokenFile(tokenContent) {
    const token = [];
    Object.keys(tokenContent).forEach(function (key) {
        const tokenData = tokenContent[key];
        const nameSpaceContent = `\n"${key}" : { \n"name": "${tokenData['name']}",\n"reference" : "${tokenData['uuid']}"\n}`;
        token.push(nameSpaceContent);
    });
    return tkn_var + token.toString() + tkn_export;
}

/**
 * If only directory is specified without tgz, we create new token file and place it in the save path.
 * If token file already exists, token will be updated. Users can place this token file when they place it in th bundle
 * @param savePath
 * @param overWrite
 * @param createdToken
 * @param nameSpaceList
 */
export function createTokenFileWithoutBundle(savePath, overWrite, createdToken, nameSpaceList) {

    const msg = `Token in ${savePath}/edgekv_tokens.js was successfully updated.`;
    let tokenFilePath = savePath;
    // if token file does not exist, create new file
    if (savePath.indexOf('edgekv_tokens.js') == -1) {
        tokenFilePath = savePath + '/edgekv_tokens.js';
    }
    let tokenFileContent = '';
    let tokenContent = [];
    if (!checkIfFileExists(tokenFilePath)) {
        for (const ns of nameSpaceList) {
            tokenContent[ns] = { 'name': createdToken['name'], 'reference': createdToken['uuid'] };
        }
    }
    // update existing token file
    else {
        const text = fs.readFileSync(tokenFilePath, 'utf8');
        // get existing token content from file
        const existingTokenContent = validateAndGetExistingTokenContent(text, createdToken, nameSpaceList);
        // updated content
        tokenContent = updateTokenContent(existingTokenContent, nameSpaceList, createdToken, overWrite);
    }
    tokenFileContent = constructTokenFile(tokenContent);
    fs.writeFile(tokenFilePath, tokenFileContent, function (err) {
        if (err) {
            const errMsg = 'ERROR: Unable to create a token file. Add the token in file edgekv_tokens.js and place it in your tar bundle';
            if (ekvJsonOutput.isJSONOutputMode()) {
                ekvJsonOutput.writeJSONOutput(
                    0,
                    msg,
                    response.logTokenToJson(createdToken, nameSpaceList)
                );
              } else {
                cliUtils.logWithBorder(errMsg);
                response.logToken(createdToken, nameSpaceList);
              }
            process.exit(1);
        }
    });
    if (ekvJsonOutput.isJSONOutputMode()) {
        ekvJsonOutput.writeJSONOutput(
            0,
            msg,
            response.logTokenToJson(createdToken, nameSpaceList),
        );
      } else {
        cliUtils.logWithBorder(msg);
        response.logToken(createdToken, nameSpaceList);
      }

}

/**
 * Validates the static content of the token
 * If valid parses the content and returns it
 * @param data
 * @param createdToken
 * @param nameSpaceList
 */
function validateAndGetExistingTokenContent(data, createdToken, nameSpaceList) {
    const tokenList = data.split('=');
    let tokenContent = [];

    if (tokenList.length == 0 || tokenList[0].indexOf('var edgekv_access_tokens') == -1) {
        cliUtils.logWithBorder('ERROR : Not a valid EdgeKV Access Token file (missing \'edgekv_access_tokens\' var assignment)!');
        response.logToken(createdToken, nameSpaceList);
        process.exit(1);
    }

    tokenList[1] = tokenList[1].replace('}export', '} export').replace('export{', 'export {')
        .replace('{edgekv_access_tokens', '{ edgekv_access_tokens').replace('edgekv_access_tokens}', 'edgekv_access_tokens }');

    if (tokenList[1].indexOf('export { edgekv_access_tokens };') == -1) {
        cliUtils.logWithBorder('ERROR : Not a valid EdgeKV Access Token file (missing \'edgekv_access_tokens\' export assignment)!');
        response.logToken(createdToken, nameSpaceList);
        process.exit(1);
    }

    tokenList[1] = tokenList[1].replace('export { edgekv_access_tokens };', '');

    // Parse token content from the existing file
    try {
        tokenContent = JSON.parse(tokenList[1]);
    } catch (ex) {
        cliUtils.logWithBorder(`ERROR: Not a valid EdgeKV access token file. Delete or re-create the edgekv token file. ${ex}`);
        response.logToken(createdToken, nameSpaceList);
        process.exit(1);
    }
    return tokenContent;
}

/**
 * Add or update token to the existing token content
 * @param tokenContent
 * @param nameSpaceList
 * @param createdToken
 * @param overWrite
 * @returns updated token content value
 */
function updateTokenContent(tokenContent, nameSpaceList, createdToken, overWrite) {
    for (const ns of nameSpaceList) {
        // if the namespace/token value does not exist in file add it
        if (!Object.prototype.hasOwnProperty.call(tokenContent, ns)) {
            const nameSpaceContent = { 'name': createdToken['name'], 'reference': createdToken['uuid'] };
            tokenContent[ns] = nameSpaceContent;
        }
        // if namespace already exists, if overwrite option is specified overwrite token value in file else display token
        else if (Object.prototype.hasOwnProperty.call(tokenContent, ns)) {
            const tokenName = tokenContent[ns]['name'];
            if (tokenName === createdToken['name']) {
                if (overWrite) {
                    const nameSpaceContent = { 'name': createdToken['name'], 'reference': createdToken['uuid'] };
                    tokenContent[ns] = nameSpaceContent;
                } else {
                    const tokenRef = tokenContent[ns]['reference'];
                    if (tokenRef != createdToken['reference']) {
                        cliUtils.logWithBorder(`Token reference mismatch for token ${tokenName}! Not updating token reference. Use '-o' to overwrite token value. Place the below token in edgekv_tokens.js manually`);
                    } else {
                        cliUtils.logWithBorder(`Token reference matches for token ${tokenName}. Not updating token reference. Use '-o' to overwrite token value.`);
                    }
                    response.logToken(createdToken, nameSpaceList);
                    process.exit(1);
                }
            } else {
                cliUtils.logWithBorder(`ERROR: Token ${createdToken['name']} for namespace ${ns} not found in the file`);
                response.logToken(createdToken, nameSpaceList);
                process.exit(1);
            }
        }
    }
    return tokenContent;
}

export function getDateDifference(date) {
    const Difference_In_Time = date.getTime() - new Date().getTime();

    // To calculate the no. of days between two dates
    const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
    return Difference_In_Days;
}

export function convertDaysToSeconds(days: number) {
    if (!isNaN(days) && days >= 0) {
        if (days != 0 && (days < 1 || days > 3650)){
            // Retention must be either zero or in the range of 86400 sec (1 day) to 315360000 sec (3650 days)
            cliUtils.logAndExit(1, 'ERROR: A non zero value specified for the retention period cannot be less than 1 day or more than 3650 days.');
        }
        return days * 86400;
    } else {
        cliUtils.logAndExit(1, 'ERROR: Retention period specified is invalid. Please specify the retention in number of days.');
    }
}
