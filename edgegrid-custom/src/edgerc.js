// Copyright 2014 Akamai Technologies, Inc. All Rights Reserved
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var fs = require('fs'),
  logger = require('./logger');

function getSection(lines, sectionName) {
  var match = /^\s*\[(.*)\]/
  ,   section;

  lines.some(function(line, i) {
    var lineMatch = line.match(match)
    ,   isMatch = lineMatch !== null && lineMatch[1] === sectionName;

    if (isMatch) {
      // go through section until we find a new one
      section = [];
      lines.slice(i + 1, lines.length).some(function(line) {
        var isMatch = line.match(match) !== null;
        if (!isMatch) {
          section.push(line);
        }
        return isMatch;
      });
    }
    return isMatch;
  });
  return section;
}

function validatedConfig(config) {

  if (!(config.host && config.access_token &&
        config.client_secret && config.client_token)) {
          var errorMessage = "";
          var tokens = 
            ['client_token', 'client_secret','access_token','host'];
          tokens.forEach(function(token) {
            if (!config[token]) {
              errorMessage += "\nMissing: " + token;
            }
          })
          console.log('Missing part of the configuration:\n' + errorMessage);
          return {};
        }

  if (config.host.indexOf('https://') > -1) {
    return config;
  }

  config.host = 'https://' + config.host;
      
  return config;
}

function buildObj(configs) {
  var result = {},
    index,
    key,
    val,
    parsedValue,
    isComment;

  configs.forEach(function(config) {
    config = config.trim();
    isComent = config.indexOf(";") === 0;
    index = config.indexOf('=');
    if (index > -1 && !isComment) {
      key = config.substr(0, index);
      val = config.substring(index + 1);
      // remove inline comments
      parsedValue = val.replace(/^\s*(['"])((?:\\\1|.)*?)\1\s*(?:;.*)?$/, "$2");
      if (parsedValue === val) {
        // the value is not contained in matched quotation marks
        parsedValue = val.replace(/\s*([^;]+)\s*;?.*$/, "$1");
      }
      // Remove trailing slash as if often found in the host property
      if (parsedValue.endsWith("/")) {
        parsedValue = parsedValue.substr(0, parsedValue.length - 1);
      }

      result[key.trim()] = parsedValue;
    }
  });

  return validatedConfig(result);
}

function readEnv(section) {
  // If any are set, we're committed
  var envConf = {};
  var envPrefix = "AKAMAI_" + section.toUpperCase()
  var tokens = 
    ['client_token', 'client_secret','access_token','host'];

  tokens.forEach(function(token){
    var envcheck = envPrefix + "_" + token.toUpperCase()
    if (process.env[envcheck]) {
      envConf[token] = process.env[envcheck];
    }
  })
  
  if (Object.keys(envConf).length > 0) {
    console.log("Using configuration from environment variables")
    return validatedConfig(envConf);
  }
  return {};
}

module.exports = function(path, conf) {
  var confSection = conf || 'default'
  var envConf = readEnv(confSection);
  if (envConf['host']) {
    return envConf;
  }

  if (!path) {
    if (process.env.EDGEGRID_ENV !== 'test') {
      logger.error('No .edgerc path');
    }

    throw new Error('No edgerc path');
  }
  var edgerc = fs.readFileSync(path).toString().split('\n'),
    confSection,
    confData = getSection(edgerc, confSection);

  if (!confData) {
    throw new Error('An error occurred parsing the .edgerc file. You probably specified an invalid section name.');
  }

  return buildObj(confData);
};
