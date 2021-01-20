import * as envUtils from './utils/env-utils';
import * as cliUtils from './utils/cli-utils';

var accountKey: string = null;

export function setAccountKey(account: string) {
    accountKey = account;
}

/**
 * This is for non-Tarball gets and all POST/PUT actions that return JSON or string bodies 
 * for both edge CLI and edge KV CLI. This method authenticates, sends request and returns promise
 */
export function sendEdgeRequest(pth: string, method: string, body, headers) {
    const edge = envUtils.getEdgeGrid();
    var path = pth;
    var qs: string = "&";
    if (accountKey) {
        // Check if query string already included in path, if not use ? otherwise use &
        if (path.indexOf("?") == -1)
            qs = "?";
        path += `${qs}accountSwitchKey=${accountKey}`;
    }

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
                        body: !!body ? cliUtils.parseIfJSON(body) : undefined
                    };
                    resolve(obj);
                } else {
                    try {
                        var errorObj = JSON.parse(body);
                        errorObj["status"] = response.statusCode;
                        reject(cliUtils.toJsonPretty(errorObj));
                    } catch (ex) {
                        console.error(`got error code: ${response.statusCode} calling ${method} ${path}\n${body}`);
                        reject(body);
                    }
                }
            });
        });
}

export function postJson(path: string, body) {
    return sendEdgeRequest(path, 'POST', body, {
        'Content-Type': 'application/json'
    });
}

export function putJson(path: string, body) {
    return sendEdgeRequest(path, 'PUT', body, {
        'Content-Type': 'application/json'
    });
}

export function getJson(path: string) {
    return sendEdgeRequest(path, 'GET', '', {});
}

export function deleteReq(path: string) {
    return sendEdgeRequest(path, 'DELETE', '', {});
}

export function isOkStatus(code) {
    return code >= 200 && code < 300;
}