import {ErrorMessage} from '../utils/http-error-message';

// temporary solution to parse error until edgeKV team comes up with proper design
export function handleError(err) {

    try {
        err = JSON.parse(err);
    } catch (e) {
        return {
            isError: true,
            error_reason: "",
            traceId: "-"
        }
    }

    let statusCode = err["status"] == undefined ? "" : err["status"];
    let traceIdVal = err["traceId"] == undefined ? "" : err["traceId"];

    if (statusCode == 504) {
        return {
            isError: true,
            error_reason: ErrorMessage.EKV_TIMEOUT_ERROR
        }
    }

    // this is sent by edgeKV
    if (err.hasOwnProperty("errors")) {
        let errors = err["errors"];
        if (errors.length > 0) {
            return  {
                isError: true,
                error_reason: errors[0]["detail"],
                status: statusCode,
                traceId: traceIdVal
            }
        }
    }
    // additional details is sent by pulsar
    else if (err.hasOwnProperty("additionalDetail")) {
        let additionalDetail = err["additionalDetail"];
        if(additionalDetail["detail"]!= undefined && additionalDetail["detail"]!="NO_MESSAGE" && additionalDetail["detail"] != ""){
            return  {
                isError: true,
                error_reason: additionalDetail["detail"],
                status: statusCode,
                traceId: traceIdVal
            }
        } else {
            return {
                isError: true,
                error_reason: "",
                status: statusCode,
                traceId: traceIdVal
            }
        }
    } 
    else {
        let errDetail = err["detail"] == undefined ? "" : err["detail"];
        return {
            isError: true,
            error_reason: errDetail,
            status: statusCode,
            traceId: traceIdVal
        }
    }
}