#!/usr/bin/env node

/**
 * Exporting edgekv and edgeworker command into the entry point
 */

module.exports = {
  EdgeKV: require("./src/edgekv/ekvcommand"),
  Edgeworker: require("./src/edgeworkers/ewcommand")
};
