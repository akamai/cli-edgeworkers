<!--esi 
<esi:assign name="dac_stylesheets" value="['/stylesheets/screen.css']" />
<esi:assign name="dac_footer_js" value="['/javascripts/app/toc.js']" />
<esi:eval src="/internal/header.html?http" dca="esi" />
-->

# EdgeWorkers CLI
EdgeWorkers CLI
The EdgeWorkers command line interface (CLI) expedites the process of registering, uploading, activating and testing EdgeWorkers functions on the Akamai Edge network.

Go to [Akamai CLI for EdgeKV](docs/edgekv_cli.md) for information on how to manage EdgeKV databases and call the EdgeKV API from the command line.

## Technical Setup Requirements
To use this tool you need:
* [Akamai CLI](https://github.com/akamai/cli) installed. If you have a Mac with brew installed, run this command: `brew install akamai`.
* An API client that contains the EdgeWorkers APIs with read-write access. Follow the steps in [Get Started with APIs](https://developer.akamai.com/api/getting-started) to learn how to configure credentials to access the API.
* Node version 7+

## Installing EdgeWorkers CLI
Use the following Akamai CLI command to install the latest EdgeWorkers CLI package:

`akamai install edgeworkers`
___

## Overview of Commands
EdgeWorkers CLI enables you to manage EdgeWorkers functions by calling the [EdgeWorkers API](https://developer.akamai.com/api/web_performance/edgeworkers/v1.html).

Conventions:
* optional args `[]`
* required args `<>`

Usage:  
`akamai edgeworkers [options] [command]`

Options:
 
| Syntax | Description |
| - | - |
| -V, --version | Display the version number for the EdgeWorkers CLI program. |
| --debug | Show debug information. |
| --edgerc `<path>` | Use credentials in `edgerc` file for command. (Default file location is _~/.edgerc_) |
| --section `<name>` | Use this section in `edgerc` file. (Default section is _[default]_)|
| --json `[path]` | Write CLI output as JSON to optionally provided path.  If not path provided, write JSON output to CLI home directory |
| -h, --help | Display usage information for EdgeWorkers CLI. |
 
Commands:

| Command \| Alias | Description |
| - | - |
| help `[command]` | Display usage information for the given command. |
| list-groups \| lg `[group-identifier]` | Customer Developer can find their EdgeWorkers access level per Luna Access Control Group. |
| list-ids \| li `[options] [edgeworker-identifier]` | List EdgeWorker ids currently registered. |
| register \| create-id `<group-identifier> <edgeworker-name>` | Register a new EdgeWorker id to reference in Property Manager behavior. |
| update-id \| ui `<edgeworker-identifier> <group-identifier> <edgeworker-name>` | Allows Customer Developer to update an existing EdgeWorker Identifier's Luna ACG or Name attributes. |
| list-versions \| lv `<edgeworker-identifier> [version-identifier]` | List Version information of a given EdgeWorker Id. |
| upload \| create-version `[options] <edgeworker-identifier>` | Creates a new version of a given EdgeWorker Id which includes the code bundle. |
| download \| download-version `[options] <edgeworker-identifier> <version-identifier>` | Download the code bundle of an EdgeWorker version. |
| status \| list-activations `[options] <edgeworker-identifier>` | List Activation status of a given EdgeWorker Id. |
| activate \| av `<edgeworker-identifier> <network> <versionId>` | Activate a Version for a given EdgeWorker Id on an Akamai Network. |
| validate \| vv `<bundlePath>` | Validates a code bundle version without uploading the code bundle. |
| create-auth-token \| auth `[options] <secretKey>` | Generates an authentication token that can be used to get detailed EdgeWorker debug response headers. |
| generate-secret \| secret `[options]` | Generates a secret key that can be used to generate auth token or in property variable. |

### List Permission Groups with EdgeWorkers Access
Customer Developer can find their EdgeWorkers access level per Luna Access Control Group.  

Usage: `akamai edgeworkers list-groups [options] [group-identifier]`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| group-identifier | optional | Luna Access Group value (usually number) to check for EdgeWorkers permissions |

#### Key Details
1. Output is filtered to only those Luna Access Control Groups that have at least one EdgeWorkers capability.

2. Capabilities can be: VIEW,VIEW_VERSION,EDIT,VIEW_ACTIVATION,CREATE_VERSION,ACTIVATE

### List Existing EdgeWorker Identifiers
List EdgeWorker ids currently registered.

Usage: `akamai edgeworkers list-ids [options] [edgeworker-identifier]`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --groupId `<groupId>` | Filter EdgeWorker Id list by Permission Group |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | optional | A unique integer handle to an EdgeWorkers instance |

### Register New EdgeWorker Identifier
Register a new EdgeWorker id to reference in Property Manager behavior.

Usage: `akamai edgeworkers register [options] <group-identifier> <edgeworker-name>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| group-identifier | required | Luna Access Group value (usually number) to check for EdgeWorkers permissions |
| edgeworker-name | required | Human readable short label describing an EdgeWorkers instance |

#### Key Details
1. Location response header will be provided with new EdgeWorker Id.

2. EdgeWorker id details response body (JSON) will be provided with 201 response code.

### Update EdgeWorker Identifier's Information
Allows Customer Developer to update an existing EdgeWorker Identifier's Luna ACG or Name attributes.

Usage: `akamai edgeworkers update-id [options] <edgeworker-identifier> <group-identifier> <edgeworker-name>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |
| group-identifier | required | Luna Access Group value (usually number) to check for EdgeWorkers permissions |
| edgeworker-name | required | Human readable short label describing an EdgeWorkers instance |

#### Key Details
1. API requires that both groupId and name be provided even if only changing one of these attributes.

2. EdgeWorker id details response body (JSON) will be provided with 200 response code.

### List EdgeWorker Versions
List Version information of a given EdgeWorker Id.

Usage: `akamai edgeworkers list-versions [options] <edgeworker-identifier> [version-identifier]`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |
| version-identifier | optional | A unique integer handle to version of an EdgeWorkers instance |

#### Key Details
1. Result set is sorted by an upload sequence value that is not displayed (an internal incremented integer).

2. EdgeWorker versions are customer defined strings.

### Upload New EdgeWorker Version
Creates a new version of a given EdgeWorker Id which includes the code bundle.

Usage: `akamai edgeworkers upload [options] <edgeworker-identifier>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --bundle `<bundlePath>` | Path to bundle file in tgz format |
| --codeDir `<workingDirectory>` | Working directory that includes main.js and bundle.json files |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |

#### Key Details
1. One of either `--bundle` or `--codeDir` (but not both) must be provided.

2. Code bundles paths and files must be found on the local filesystem.

3. `--bundle` expects a tgz file already built per EdgeWorkers specification.

4. `--codeDir` expects a directory path which contains both the main.js (events file) and bundle.json (manifest file).

5. `--codeDir` option will provide bundle.json format validation.

6. `--codeDir` does not pack other directories or code beyond main.js and bundle.json.

7. `--codeDir` will build the tarball (tgz) file if file validation succeeds.

8. Service will compare new tarball's checksum with previously uploaded tarballs for the same EdgeWorker id (`ewId`). If a match is found, the new version creation is disallowed.

9. `versionId` is customer generated and will be pulled from bundle.json.

10. Location response header will be provided with new EdgeWorker Version id.

11. EdgeWorker version details response body (JSON) will be provided with 201 response code.

### Download an EdgeWorkers Code Bundle
Download the code bundle of an EdgeWorker version.

Usage: `akamai edgeworkers download [options] <edgeworker-identifier> <version-identifier>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --downloadPath `<downloadPath>` | Path to store downloaded bundle file; defaults to CLI home directory if not provided. |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |
| version-identifier | required | A unique integer handle to version of an EdgeWorkers instance |

#### Key Details
1. If `--downloadPath` is not provided or is not found on local filesystem, an AkamaiCLI cache sub-directory will be used:
_`<CLI_CACHE_PATH>/edgeworkers-cli/edgeworkers/<ewid>/`_

### List EdgeWorker Version Activation Status
List Activation status of a given EdgeWorker Id.

Usage: `akamai edgeworkers status [options] <edgeworker-identifier>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --versionId `<versionId>` | Version Identifier |
| --activationId `<activationId>` | Activation Identifier |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |

#### Key Details
1. You may not provide both the Version and the Activation identifiers.

### Activate an EdgeWorker
Activate a Version for a given EdgeWorker Id on an Akamai Network.

Usage: `akamai edgeworkers activate [options] <edgeworker-identifier> <network> <version-identifier>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |
| network | required | Label for which Akamai Network (STAGING or PRODUCTION) activation should be sent to
| version-identifier | required | A unique integer handle to version of an EdgeWorkers instance |

#### Key Details
1. Network must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.

2. Location response header will be provided with new EdgeWorker Activation id.

3. EdgeWorker activation details response body (JSON) will be provided with 201 response code.

### Validate an EdgeWorkers Code Bundle
Validates a code bundle version without uploading the code bundle

Usage: `akamai edgeworkers validate [options] <bundlePath>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| bundlePath | required | Path to bundle file in tgz format |

#### Key Details
1. Code bundle path must be found on the local filesystem.

2. Code bundle expects a tgz file already built per EdgeWorkers specification.

### Create an EdgeWorkers Authentication Token
Generates an authentication token that can be used to get detailed EdgeWorker debug response headers.

Usage: `akamai edgeworkers create-auth-token [options] <secretKey>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --acl `<aclPath>` | Path prefix of the response pages which require debugging |
| --url `<urlPath>` | Exact path of response page which requires debugging |
| --expiry `<expiry>` | Expiry duration of token, in minutes. |

| Argument | Existence | Description |
| - | - | - |
| secretKey | required | The secret key (hex-digit based, minimum 64 characters) that is configured for the Akamai property in which the EdgeWorker executes |

#### Key Details
1. The `--acl` and `--url` options are mutually exclusive to each other.

2. The `--url` value is not explicitly part of the final token, but is used as a salt in the HMAC computation.

3. The `--acl` value can be a pattern that matches multiple pages, and is explicitly part of the final token. The default is `/*`.

4. The `--expiry` value must be between 1 and 60 minutes. The default is `15`.

### Generate a Random Secret Key
Generates a random secret key that can be used to create edgeworkers authentication token and in property PMUSER_EW_DEBUG_KEY.

Usage: `akamai edgeworkers generate-secret`

___
## Resources
For more information on EdgeWorkers, refer to the following resources:
* [EdgeWorkers Developer Page](https://developer.akamai.com/edgeworkers)
* [EdgeWorkers User Guide](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-4CC14D7E-D92D-4F2D-9292-17F8BE6E2DAE.html)
* [EdgeWorkers API Guide](https://developer.akamai.com/api/web_performance/edgeworkers/v1.html)

## Reporting Issues
You are all set, happy coding! If you experience any issues with the EdgeWorkers CLI, raise them as a [github issue](https://github.com/akamai/cli-edgeworkers/issues). Feel free to create a pull request with the fix or suggestion.

<!--esi 
<esi:eval src="/internal/footer.html?http" dca="esi" />
-->
