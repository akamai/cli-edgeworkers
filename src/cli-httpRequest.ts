import * as envUtils from './utils/env-utils';
import * as cliUtils from './utils/cli-utils';
import { promiseTimeout } from './utils/timeout-promise';

export var accountKey: string = null;
export var timeoutVal: number = 120000;

export function setAccountKey(account: string) {
    accountKey = account;
}

/**
 * This is for non-Tarball gets and all POST/PUT actions that return JSON or string bodies 
 * for both edge CLI and edge KV CLI. This method authenticates, sends request and returns promise
 */
export function sendEdgeRequest(pth: string, method: string, body, headers, timeout: number) {
    const edge = envUtils.getEdgeGrid();
    var path = pth;
    var qs: string = "&";
    if (accountKey) {
        // Check if query string already included in path, if not use ? otherwise use &
        if (path.indexOf("?") == -1)
            qs = "?";
        path += `${qs}accountSwitchKey=${accountKey}`;
    }

    let servicePromise = function () {
        return new Promise<any>(
            (resolve, reject) => {
            
                edge.auth({
                    path,
                    method,
                    headers,
                    body
                });

                edge.send(function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else if (isOkStatus(response.statusCode)) {
                        var obj: any = {
                            response,
                            body: (body == "" || body == "null" || !!body) ? cliUtils.parseIfJSON(body) : undefined // adding null and empty string use case for edgekv
                        };
                        resolve(obj);
                    } else {
                        try {
                            var errorObj = JSON.parse(body);
                            errorObj["status"] = response.statusCode;
                            errorObj["traceId"] = response.headers["x-trace-id"]; // adding trace id for debugging purpose
                            reject(cliUtils.toJsonPretty(errorObj));
                        } catch (ex) {
                            console.error(`got error code: ${response.statusCode} calling ${method} ${path}\n${body}`);
                            reject(body);
                        }
                    }
                })

            });
    }
       
    // race promise to set timeout
    return promiseTimeout(timeout, servicePromise());
}

export function postJson(path: string, body, timeout: number) {
    return sendEdgeRequest(path, 'POST', body, {
        'Content-Type': 'application/json'
    }, timeout);
}

export function putJson(path: string, body, timeout: number) {
    return sendEdgeRequest(path, 'PUT', body, {
        'Content-Type': 'application/json'
    }, timeout);
}

export function getJson(path: string, timeout: number) {
    return sendEdgeRequest(path, 'GET', '', {}, timeout);
}

export function deleteReq(path: string, timeout: number) {
    return sendEdgeRequest(path, 'DELETE', '', {}, timeout);
}

export function isOkStatus(code) {
    return code >= 200 && code < 300;
}