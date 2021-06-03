import * as cliUtils from '../utils/cli-utils';
import jwt_decode from "jwt-decode";
import * as response from './ekv-response';
import { fromSeconds } from 'from-seconds';

const fs = require('fs');
var path = require('path')
const untildify = require('untildify');
var tar = require('tar-stream')
var zlib = require('zlib');
const tkn_var = "var edgekv_access_tokens = {";
const tkn_export = "\n}\nexport { edgekv_access_tokens };"

/**
 * converts seconds to years, months and days
 * @param seconds 
 */
export function convertRetentionPeriod(seconds) {
    if (seconds == 0) {
        return "Indefinite";
    }
    let convResult = fromSeconds(seconds);
    let yearConv = convResult.toYears();
    let year = yearConv["years"];
    let month = yearConv["months"];
    let days = yearConv["days"];
    let totalDays = convResult.toDays()["days"];
    let result: string = "";

    if (year >= 1) {
        result += year + ((year == 1) ? " year " : " years ");
    }
    if (month >= 1) {
        result += month + ((month == 1) ? " month " : " months ");
    }
    if (days >= 1) {
        result += days + ((days == 1) ? " day" : " days");
    }
    result += " (" + totalDays + "days)";
    return result;
}

export function validateNetwork(network: string) {
    if (network.toUpperCase() !== cliUtils.staging && network.toUpperCase() !== cliUtils.production) {
        cliUtils.logAndExit(1, `ERROR: Environment parameter must be either staging or production - was: ${network}`);
    }
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
    let validJsonFile = validateJson(itemFilePath);

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
        let jsonContent = fs.readFileSync(itemFilePath).toString();
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
    let convertedDate = new Date(seconds * 1000);
    return convertedDate;
}

// decode JWT token returned by API
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
    Object.keys(decodedToken).forEach(function (key) {
        if (key.includes("namespace-")) {
            nameSpaceList.push(key);
        }
    });
    return nameSpaceList;
}

// check if file exisits and file has read / write permissions
export function checkIfFileExists(filePath) {
    try {
        var jsFilePath = untildify(filePath);
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
    var regEx = /^\d{4}-\d{2}-\d{2}$/;
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
 * @param decodedToken 
 * @param nameSpaceList 
 */
export function saveTokenToBundle(savePath, overWrite, createdToken, decodedToken, nameSpaceList) {
    let tokenContent = [];
    var data = "";
    let updateFile = false;
    let msg = `Token in ${savePath}/edgekv_tokens.js was successfully updated.`

    var extract = tar.extract();
    var pack = tar.pack();

    var oldTarBallStream = fs.createReadStream(savePath);

    oldTarBallStream.on('error', function (err) {
        cliUtils.logWithBorder(`ERROR: Unable to read the tar bundle. Add the token in file edgekv_tokens.js and place it in your tar bundle`);
        response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
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
                let existingTokenContent = validateAndGetExistingTokenContent(data, createdToken, decodedToken, nameSpaceList);
                // updated content
                tokenContent = updateTokenContent(existingTokenContent, nameSpaceList, createdToken, decodedToken, overWrite);

            });
            callback();
        }
    });

    extract.on('finish', function () {
        // write the new entry to the pack stream
        let tokenFileContent = "";
        if (!updateFile) {
            for (let ns of nameSpaceList) {
                tokenContent[ns] = { "name": createdToken["name"], "value": createdToken["value"] };
            }
        }
        tokenFileContent = constructTokenFile(tokenContent);
        pack.entry({ name: 'edgekv_tokens.js' }, tokenFileContent);
        pack.finalize(); // no more changes, pack is finalized

        var newTarBallStream = fs.createWriteStream(savePath);// create writestream at the last stage
        pack.pipe(zlib.createGzip()).pipe(newTarBallStream)// gzips and writes the contents to the new tarball

        cliUtils.logWithBorder(msg);
        response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, true);
    });
}

/**
 * Constructs the token file with static constants
 * @param tokenContent 
 */
function constructTokenFile(tokenContent) {
    let token = [];
    Object.keys(tokenContent).forEach(function (key) {
        let tokenData = tokenContent[key];
        let nameSpaceContent = `\n"${key}" : { \n"name": "${tokenData["name"]}",\n"value" : "${tokenData["value"]}"\n}`;
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
 * @param decodedToken 
 * @param nameSpaceList 
 */
export function createTokenFileWithoutBundle(savePath, overWrite, createdToken, decodedToken, nameSpaceList) {

    let msg = `Token in ${savePath}/edgekv_tokens.js was successfully updated.`;
    let tokenFilePath = savePath;
    // if token file does not exist, create new file
    if (savePath.indexOf("edgekv_tokens.js") == -1) {
        tokenFilePath = savePath + "/edgekv_tokens.js";
    }
    let tokenFileContent = "";
    let tokenContent = [];
    if (!checkIfFileExists(tokenFilePath)) {
        for (let ns of nameSpaceList) {
            tokenContent[ns] = { "name": createdToken["name"], "value": createdToken["value"] };
        }
    }
    // update existing token file
    else {
        var text = fs.readFileSync(tokenFilePath, 'utf8');
        // get existing token content from file
        let existingTokenContent = validateAndGetExistingTokenContent(text, createdToken, decodedToken, nameSpaceList);
        // updated content
        tokenContent = updateTokenContent(existingTokenContent, nameSpaceList, createdToken, decodedToken, overWrite);
    }
    tokenFileContent = constructTokenFile(tokenContent);
    fs.writeFile(tokenFilePath, tokenFileContent, function (err, file) {
        if (err) {
            cliUtils.logWithBorder(`ERROR: Unable to create a token file. Add the token in file edgekv_tokens.js and place it in your tar bundle`);
            response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
            process.exit(1);
        }
    });
    cliUtils.logWithBorder(msg);
    response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, true);
}

/**
 * Validates the static content of the token 
 * If valid parses the content and returns it
 * @param data 
 * @param createdToken 
 * @param decodedToken 
 * @param nameSpaceList 
 */
function validateAndGetExistingTokenContent(data, createdToken, decodedToken, nameSpaceList) {
    let tokenList = data.split("=");
    let tokenContent = [];

    if (tokenList.length == 0 || tokenList[0].indexOf("var edgekv_access_tokens") == -1) {
        cliUtils.logWithBorder("ERROR : Not a valid EdgeKV Access Token file (missing 'edgekv_access_tokens' var assignment)!");
        response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
        process.exit(1);
    }

    tokenList[1] = tokenList[1].replace('}export', '} export').replace('export{', 'export {')
        .replace('{edgekv_access_tokens', '{ edgekv_access_tokens').replace('edgekv_access_tokens}', 'edgekv_access_tokens }');

    if (tokenList[1].indexOf("export { edgekv_access_tokens };") == -1) {
        cliUtils.logWithBorder("ERROR : Not a valid EdgeKV Access Token file (missing 'edgekv_access_tokens' export assignment)!");
        response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
        process.exit(1);
    }

    tokenList[1] = tokenList[1].replace("export { edgekv_access_tokens };", "");
    
    // Parse token content from the existing file
    try {
        tokenContent = JSON.parse(tokenList[1]);
    } catch (ex) {
        cliUtils.logWithBorder(`ERROR: Not a valid EdgeKV access token file. Delete or re-create the edgekv token file. ${ex}`);
        response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
        process.exit(1);
    }
    return tokenContent;
}

/**
 * Add or update token to the existing token content
 * @param tokenContent 
 * @param nameSpaceList 
 * @param createdToken 
 * @param decodedToken 
 * @param overWrite 
 * @returns updated token content value
 */
function updateTokenContent(tokenContent, nameSpaceList, createdToken, decodedToken, overWrite) {
    for (let ns of nameSpaceList) {
        // if the namespace/token value does not exist in file add it
        if (!tokenContent.hasOwnProperty(ns)) {
            let nameSpaceContent = { "name": createdToken["name"], "value": createdToken["value"] };
            tokenContent[ns] = nameSpaceContent;
        }
        // if namespace already exists, if overwrite option is specified overwrite token value in file else display token 
        else if (tokenContent.hasOwnProperty(ns)) {
            let tokenName = tokenContent[ns]["name"];
            if (tokenName === createdToken["name"]) {
                if (overWrite) {
                    let nameSpaceContent = { "name": createdToken["name"], "value": createdToken["value"] };
                    tokenContent[ns] = nameSpaceContent;
                } else {
                    let tokenValue = tokenContent[ns]["value"];
                    if (tokenValue != createdToken["value"]) {
                        cliUtils.logWithBorder(`Token value mismatch for token ${tokenName}! Not updating token value. Use '-o' to overwrite token value. Place the below token in edgekv_tokens.js manually`);
                    } else {
                        cliUtils.logWithBorder(`Token value matches for token ${tokenName}. Not updating token value. Use '-o' to overwrite token value.`);
                    }
                    response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
                    process.exit(1);
                }
            } else {
                cliUtils.logWithBorder(`ERROR: Token ${createdToken["name"]} for namespace ${ns} not found in the file`);
                response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
                process.exit(1);
            }
        }
    }
    return tokenContent;
}

export function getDateDifference(date) {
    let Difference_In_Time = date.getTime() - new Date().getTime();
  
    // To calculate the no. of days between two dates 
    let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
    return Difference_In_Days;
}

export function convertDaysToSeconds(days: number) {
    if (!isNaN(days) && days >= 0) {
        return days * 86400;
    } else {
        cliUtils.logAndExit(1, "ERROR: Retention period specified is invalid. Please specify the retention in number of days.");
    }
}