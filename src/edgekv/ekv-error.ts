// temporary solution to parse error until edgeKV team comes up with proper design
export function handleError(err) {
    err = JSON.parse(err);
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
        return {
            isError: true,
            error_reason: err["detail"]
        }
    }
}