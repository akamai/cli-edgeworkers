import {ErrorMessage} from '../utils/http-error-message';

export function handleError(err, commandId) {
    try {
        err = JSON.parse(err);
    } catch (e) {
        return {
            isError: true,
            error_reason: ""
        }
    }

    let status = err.status;
    if (status) {
        switch (status) {
            case 404: {
                return {
                    isError: true,
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + ErrorMessage[commandId + "_404"]
                }
            }
            case 403: {
                return {
                    isError: true,
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + ErrorMessage.GENERIC_403
                }
            }
            case 401: {
                let detail = err["title"] == undefined ? "" : err["title"];
                return {
                    isError: true,
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + detail
                }
            }    
            case 400: {
                return {
                    isError: true,
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + ErrorMessage[commandId + "_400"]
                }
            }    
            default: {
                let detail = err["detail"] == undefined ? "" : err["detail"];
                return {
                    isError: true,
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + detail
                }
            }    

        }
    }
}