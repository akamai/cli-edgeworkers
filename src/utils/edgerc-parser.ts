import * as fs from "fs";

export function parseEdgeGridToSectionArray(edgeGridFilePath) {
  if (!fs.existsSync(edgeGridFilePath)) {
    throw new Error(`edge grid file does not exist: ${edgeGridFilePath}`);
  }
  var data = fs.readFileSync(edgeGridFilePath).toString();
  var lines = data.split('\n')
    .map(s => s.trim()) // remove leading and trailing spaces
    .filter(l => l.length > 0) // remove empty lines
    .filter(l => !isCommentedLine(l)); // remove comments

  var sectionToLines = new Map();
  var currentSection = getSectionNameOrNull(lines[0]);
  if (currentSection === null) {
    currentSection = 'default';
    sectionToLines.set(currentSection, []);
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var sectionName = getSectionNameOrNull(line);
    if (sectionName !== null) {
      if (sectionToLines.has(sectionName)) {
        throw new Error(`Invalid edgerc file format: found section ${sectionName} multiple times`);
      }
      currentSection = sectionName;
      sectionToLines.set(currentSection, []);
    } else {
      sectionToLines.get(currentSection).push(line);
    }
  }

  var sections = [];
  sectionToLines.forEach((lines, key) => {
    var s = parseSectionLinesToConfig(lines, key);
    sections.push(s);
  });
  return sections;
}

function isCommentedLine(line) {
  return line.startsWith(';') || line.startsWith('#');
}

function parseSectionLinesToConfig(lines, sectionName) {
  var m = sectionLinesToMap(lines, sectionName);
  var host = getEdgeProp('host', m, sectionName);
  var clientToken = getEdgeProp('client_token', m, sectionName);
  var clientSecret = getEdgeProp('client_secret', m, sectionName);
  var accessToken = getEdgeProp('access_token', m, sectionName);
  return {
    sectionName,
    host,
    clientToken,
    clientSecret,
    accessToken
  }
}

function getEdgeProp(key, map, sectionName) {
  if (!map.has(key)) {
    throw new Error(`Missing ${key} in edgegrid section: ${sectionName}`);
  }
  return map.get(key);
}

function sectionLinesToMap(lines, sectionName) {
  var r = new Map();
  lines.forEach(l => {
    var kvp = lineToKvp(l);
    if (r.has(kvp.key)) {
      throw new Error(`Duplicate key detected in edgerc section: ${sectionName} key: ${kvp.key}`);
    }
    r.set(kvp.key, kvp.value);
  });
  return r;
}

function lineToKvp(line) {
  var index = line.indexOf('=');
  if (index === -1) {
    throw new Error(`line is invalid: ${line} - no '=' character found`);
  } else if (index === 0) {
    throw new Error(`line is invalid: ${line} - empty string before '=' character`);
  } else if (index === line.length - 1) {
    throw new Error(`line is invalid: ${line} - value is empty`);
  }
  const key = line.substring(0, index).trim();
  const value = line.substring(index + 1, line.length).trim();

  if (key.length === 0) {
    throw new Error(`line is invalid: ${line} - key is empty`);
  } else if (value.length === 0) {
    throw new Error(`line is invalid: ${line} - value is empty`);
  }

  return {
    key,
    value
  };
}

function getSectionNameOrNull(s) {
  if (!s) {
    return null;
  }
  if (s.charAt(0) !== '[') {
    return null;
  }
  if (s.charAt(s.length - 1) !== ']') {
    throw new Error(`Invalid section string no matching closing bracket: ${s}`);
  }
  if (s.length == 2) {
    throw new Error(`Empty section name detected: ${s}`);
  }
  return s.substring(1, s.length - 1);
}
