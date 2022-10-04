export enum ErrorMessage {
    permissionError = 'ERROR: Operation could not be performed. The identity is not authorized to manage any context.',
    CLONE_EW_404 = 'The requested resource Tier is not found.',
    GENERIC_403 = 'Permission is invalid.',
    REGISTER_EW_ERROR = 'ERROR: Unable to create Edgeworker.',
    UPDATE_EW_ERROR = 'ERROR: Unable to update Edgeworker.',
    DELETE_EW_ERROR = 'ERROR: Unable to delete Edgeworker.',
    DELETE_VERSION_ERROR = 'ERROR: Unable to delete Edgeworker version.',
    CLONE_EW_ERROR = 'ERROR: Unable to clone the specified edgeworker.',
    LISTALL_EW_ERROR = 'ERROR: Unable to retrieve Edgeworkers list.',
    GET_CONTRACT_ERROR = 'ERROR: Unable to retrieve contracts for your account.',
    GET_PROPERTIES_ERROR = 'ERROR: Unable to retrieve properties for the specified Edgeworker id.',
    GET_RESTIER_ERROR = 'ERROR: Unable to retrieve resource tiers for the contract.',
    GET_RESTR_FOR_EW_ERROR = 'ERROR: Unable to retrieve resource tiers for the specified Edgeworker id.',
    GET_RESTR_FOR_EW_404 = 'Unable to find the requested EdgeWorker id.',
    LISTALL_EW_404 = 'The requested resource Tier is not found.',
    UPDATE_EW_400 = 'Cloning an EdgeWorkers id is required in order to edit the Resource Tier id.',
    AUTH_TOKEN_ERROR = 'ERROR: Unable to create authentication token.',
    EKV_TIMEOUT_ERROR = 'The EdgeKV service was unable to respond in time. Please retry the request later.',
    EW_TIMEOUT_ERROR = 'The EdgeWorkers service was unable to respond in time. Please retry the request later.',
    DOWNLOAD_TARBALL_ERROR = 'Failed to download tarball.'

}
