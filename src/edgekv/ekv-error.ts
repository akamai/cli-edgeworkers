import {ErrorMessage} from '../utils/http-error-message';

// temporary solution to parse error until edgeKV team comes up with proper design
export function handleError(err) {

    try {
        err = JSON.parse(err);
    } catch (e) {
        return {
            isError: true,
            error_reason: '',
            traceId: '-'
        };
    }

    const statusCode = err['status'] == undefined ? '' : err['status'];
    const traceIdVal = err['traceId'] == undefined ? '' : err['traceId'];

    if (statusCode == 504) {
        return {
            isError: true,
            error_reason: ErrorMessage.EKV_TIMEOUT_ERROR
        };
    }

    // this is sent by edgeKV
    if (Object.prototype.hasOwnProperty.call(err, 'errors')) {
        const errors = err['errors'];
        if (errors.length > 0) {
            return  {
                isError: true,
                error_reason: errors[0]['detail'],
                status: statusCode,
                traceId: traceIdVal
            };
        }
    }
    else {
        const errDetail = err['detail'] == undefined ? '' : err['detail'];
        return {
            isError: true,
            error_reason: errDetail,
            status: statusCode,
            traceId: traceIdVal
        };
    }
}