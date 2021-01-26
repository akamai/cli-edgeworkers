import * as cliUtils from '../utils/cli-utils';

// temporary solution to parse error until edgeKV team comes up with proper design
export function handleError(err) {
    err = JSON.parse(err);

    //In case of 401 this is generic message
    if (err.status == 401) {
        cliUtils.logAndExit(1, `ERROR: Operation could not be performed. The identity is not authorized to manage any context.`);
    }

    // this is sent by edgeKV
    if (err.hasOwnProperty("errors")) {
        let errors = err["errors"];
        if (errors.length > 0) {
            return  {
                isError: true,
                error_reason: errors[0]["detail"]
            }
        }
    }
    // additional details is sent by pulsar
    else if (err.hasOwnProperty("additionalDetail")) {
        let additionalDetail = err["additionalDetail"];
        if(additionalDetail["detail"]!="NO_MESSAGE" && additionalDetail["detail"] != ""){
            return  {
                isError: true,
                error_reason: additionalDetail["detail"]
            }
        } else {
            return {
                isError: true,
                error_reason: ""
            }
        }
    } 
    else {
        let errDetail = err["detail"] == undefined ? "" : err["detail"];
        return {
            isError: true,
            error_reason: errDetail
        }
    }
}