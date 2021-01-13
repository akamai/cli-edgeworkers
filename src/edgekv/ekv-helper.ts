import * as cliUtils from '../utils/cli-utils';
import jwt_decode from "jwt-decode";
import * as response from './ekv-response';

const fs = require('fs');
var path = require('path')
const untildify = require('untildify');
var tar = require('tar-stream')
var zlib = require('zlib');
const tkn_var = "var edgekv_access_tokens = {";
const tkn_export = "\n}\nexport { edgekv_access_tokens };"

/**
 * converts seconds to years, months and days
 * @example docs - https://stackoverflow.com/questions/8942895/convert-a-number-of-days-to-days-months-and-years-with-jquery/8943500
 * @param seconds 
 */
export function convertRetentionPeriod(seconds) {
    if(seconds == 0) {
        return "Indefinite";
    }

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

export function validateNetwork(network: string) {
    if (network.toUpperCase() !== 'STAGING' && network.toUpperCase() !== 'PRODUCTION') {
        cliUtils.logAndExit(1, `ERROR: Environment parameter must be either STAGING or PRODUCTION - was: ${network}`);
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
        cliUtils.logAndExit(1, `ERROR: Json file provided in the path (${itemFilePath}) is not found.`);
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

export function checkIfFileExists(filePath) {
    var jsFilePath = untildify(filePath);
    return fs.existsSync(jsFilePath);
}

export function getFileExtension(filePath) {
    return path.extname(filePath);
}

export function saveTokenToBundle(savePath, overWrite, createdToken, decodedToken, nameSpaceList) {
    let tokenContent = [];
    var data = "";
    let updateFile = false;
    let msg = `Token in ${savePath}/edgekv_tokens.js was successfully updated.`

    var extract = tar.extract();
    var pack = tar.pack();

    // if tar bundle does not exist in the specified location
    if (getFileExtension(savePath) != ".tgz" || !checkIfFileExists(savePath)) {
        cliUtils.logWithBorder(`ERROR: Tar bundle not found in the specified location. Add the token in file edgekv_tokens.js and place it in your tar bundle`);
        response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
        process.exit(1);
    }

    var oldTarBallStream = fs.createReadStream(savePath);
    oldTarBallStream.on('error', function(err) {
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
                let tokenList = data.split("=");

                if (tokenList.length == 0) {
                    cliUtils.logWithBorder("ERROR : Not a valid EdgeKV Access Token file (missing 'edgekv_access_tokens' var assignment)!");
                    response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
                    process.exit(1);
                }

                tokenList[1] = tokenList[1].replace('}export', '} export').replace('export{', 'export {')
                    .replace('{edgekv_access_tokens', '{ edgekv_access_tokens').replace('edgekv_access_tokens}', 'edgekv_access_tokens }')
                    .replace("export { edgekv_access_tokens };", "");

                // token content from the existing file
                try {
                    tokenContent = JSON.parse(tokenList[1]);
                } catch(ex) {
                    cliUtils.logWithBorder(`ERROR: Not a valid EdgeKV access token file. Delete or re-create the edgekv token file. ${ex}`);
                    response.logToken(createdToken["name"], createdToken["value"], decodedToken, nameSpaceList, false);
                    process.exit(1);
                }

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
                            process.exit(1);
                        }
                    }
                }
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

function constructTokenFile(tokenContent) {
    let token = [];
    Object.keys(tokenContent).forEach(function (key) {
        let tokenData = tokenContent[key];
        let nameSpaceContent = `\n"${key}" : { \n"name": "${tokenData["name"]}",\n"value" : "${tokenData["value"]}"\n}`;
        token.push(nameSpaceContent);
    });
    return tkn_var + token.toString() + tkn_export;
}