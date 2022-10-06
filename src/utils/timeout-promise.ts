export const promiseTimeout = function (ms, promise) {
  let timeoutHandle;
   // Create a promise that rejects in <ms> milliseconds
  const timeoutPromise = new Promise<never>((resolve, reject) => {
    const timeoutObj = { 'status': 504 };
    timeoutHandle = setTimeout(() => reject(JSON.stringify(timeoutObj)),ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([ 
    promise, 
    timeoutPromise, 
  ]).then((result) => {
    clearTimeout(timeoutHandle);
    return result;
  });
};