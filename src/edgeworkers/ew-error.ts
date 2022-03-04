import {ErrorMessage} from '../utils/http-error-message';

export function handleError(err, commandId) {
    try {
        if(typeof err == 'object')
            err = err.response.data;
        else{
            err = JSON.parse(err); 
        }
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
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + err["detail"]
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
                let errorMessage = ErrorMessage[commandId + "_400"];
                if (errorMessage === undefined) {
                  errorMessage = err.detail
                }

                return {
                    isError: true,
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + errorMessage
                }
            }
            case 504: {
                return {
                    isError: true,
                    error_reason: ErrorMessage[commandId + "_ERROR"] + " " + ErrorMessage.EW_TIMEOUT_ERROR
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