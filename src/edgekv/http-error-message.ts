export enum ErrorMessage {
    permissionError = "ERROR: Operation could not be performed. The identity is not authorized to manage any context.",
    initializeError_403 = "ERROR: EdgeKV Initialization failed (You don't have permission to access that resource.). Please make sure you have the EdgeKV product added to your contract.",
    initStatusError_403 = "ERROR: Unable to retrieve EdgeKV status. You don't have permission to access that resource. Please make sure you have the EdgeKV product added to your contract."
}