#!/usr/bin/env node

/**
 * Exporting edgekv and edgeworker command into the entry point
 */

module.exports = {
  EdgeKV: require("./src/edgekv/ekv-cli-main"),
  EdgeWorkers: require("./src/edgeworkers/ew-cli-main")
};
