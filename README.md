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
* [Akamai CLI](https://github.com/akamai/cli) installed. 
    * If you do not have the CLI and are using [Homebrew](https://brew.sh/) on a Mac, run this command: `brew install akamai`
    * You may also [download](https://github.com/akamai/cli) OS-specific CLI binaries or a Docker image
* Valid EdgeGrid credentials configured via Akamai Control Center (see [Get Started with APIs](https://developer.akamai.com/api/getting-started))
* Node version 14 or higher


## Install or Update the EdgeWorkers
* If you do not have the EdgeWorkers CLI package installed, use the following Akamai CLI command to install the latest EdgeWorkers CLI package:

Usage:  
`akamai install edgeworkers`

* If you already have the CLI installed, use the following Akamai CLI command to install the latest EdgeWorkers CLI package that includes EdgeKV functionality:

Usage:  
`akamai update edgeworkers`

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
| --timeout `<timeout>` | You can specify a timeout value for a command in seconds to override the 2 minute default. For example, if you add "--timeout 10" to a command, it will timeout if the server takes more than 10 second to respond. |
| --json `[path]` | Write CLI output as JSON to optionally provided path.  If not path provided, write JSON output to CLI home directory |
| --jsonout | Write CLI output as JSON to stdout. |
| -h, --help | Display usage information for EdgeWorkers CLI. |
 
Commands:

| Command \| Alias | Description |
| - | - |
| help `[command]` | Display usage information for the given command. |
| list-groups \| lg `[group-identifier]` | Customer Developer can find their EdgeWorkers access level per Luna Access Control Group. |
| list-ids \| li `[options] [edgeworker-identifier]` | List EdgeWorker ids currently registered. |
| register \| create-id `<group-identifier> <edgeworker-name>` | Register a new EdgeWorker id to reference in Property Manager behavior. |
| update-id \| ui `<edgeworker-identifier> <group-identifier> <edgeworker-name> [options]` | Allows Customer Developer to update an existing EdgeWorker Identifier's Luna ACG or Name attributes. |
| delete-id \| delete-id `[options] <edgeworker-identifier>` | Permanently delete an existing EdgeWorker Id. |
| list-versions \| lv `<edgeworker-identifier> [version-identifier]` | List Version information of a given EdgeWorker Id. |
| upload \| create-version `[options] <edgeworker-identifier>` | Creates a new version of a given EdgeWorker Id which includes the code bundle. |
| delete-version \| delete-version `[options] <edgeworker-identifier> <version-identifier>` | Permanently delete an existing version of a given EdgeWorker Id. |
| download \| download-version `[options] <edgeworker-identifier> <version-identifier>` | Download the code bundle of an EdgeWorker version. |
| status \| list-activations `[options] <edgeworker-identifier>` | List Activation status of a given EdgeWorker Id. |
| activate \| av `<edgeworker-identifier> <network> <versionId>` | Activate a Version for a given EdgeWorker Id on an Akamai Network. |
| deactivate \| deact `<edgeworker-identifier> <network> <versionId>` | Deactivate a Version for a given EdgeWorker Id on an Akamai Network. |
| validate \| vv `<bundlePath>` | Validates a code bundle version without uploading the code bundle. |
| create-auth-token \| auth `[options] <hostName>` | Generates an authentication token that can be used to get detailed EdgeWorker debug response headers. |
| generate-secret \| secret `[options]` | Generates a secret key that can be used to generate auth token or in property variable. |
| clone \| clone `<edgeworker-identifier> <resourceTierId> [options]` | Clones an EdgeWorker from the existing EdgeWorker Id. |
| list-contracts \| li-contracts `[options]` | List of contract ids that user has access to. |
| list-properties \| lp `<edgeworker-identifier> [options]` | List of properties associated with a given EdgeWorker Id. |
| list-limits \| li-limits | View the various limits EdgeWorkers imposes on the number of activations, EdgeWorkers IDs, and versions you can deploy. |
| list-restiers \| li-restiers `[options]` | List Resource Tiers that can be used to create or clone EdgeWorker Id. |
| show-restier \| show-restier `<edgeworker-identifier>` | Customers can get Resource Tier details for a specific EdgeWorker Id. |
| get reports | Get a list of all available EdgeWorkers reports. |
| get report `<reportId> <edgeworker-identifier> [options]` | Get an EdgeWorkers report for a specific EdgeWorker ID. |

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
| --resourceTierId `<resourceTierId>` | Filter EdgeWorker Id by Resource Tier |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | optional | A unique integer handle to an EdgeWorkers instance |

### Register New EdgeWorker Identifier
Register a new EdgeWorker id to reference in Property Manager behavior.

Usage: `akamai edgeworkers register [options] <group-identifier> <edgeworker-name>`

| Option | Description |
| - | - |
| --resourceTierId | New Resource tier id to which the EdgeWorker will be associated. |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| group-identifier | required | Luna Access Group value (usually number) to check for EdgeWorkers permissions |
| edgeworker-name | required | Human readable short label describing an EdgeWorkers instance |

#### Key Details
1. Location response header will be provided with new EdgeWorker Id.

2. EdgeWorker id details response body (JSON) will be provided with 201 response code.

3. To disable prompts for automation purpose "resourceTierId" can be provided as input.

### Update EdgeWorker Identifier's Information
Allows Customer Developer to update an existing EdgeWorker Identifier's Luna ACG or Name attributes.

Usage: `akamai edgeworkers update-id [options] <edgeworker-identifier> <group-identifier> <edgeworker-name>`

| Option | Description |
| - | - |
| --resourceTierId | New Resource tier id to which the EdgeWorker will be associated |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |
| group-identifier | required | Luna Access Group value (usually number) to check for EdgeWorkers permissions |
| edgeworker-name | required | Human readable short label describing an EdgeWorkers instance |

#### Key Details
1. API requires that both groupId and name be provided even if only changing one of these attributes.

2. EdgeWorker id details response body (JSON) will be provided with 200 response code.

3. Resource Tier ID provided should be same as the one the EdgeWorker ID already has. In order to provide a different resource tier id, please use the clone operation.

### Delete Existing EdgeWorker Identifier
Permanently delete an existing EdgeWorker Identifier.

Usage: `akamai edgeworkers delete-id [options] <edgeworker-identifier>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --noPrompt | Skip the deletion confirmation prompt |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |

#### Key Details
1. Deleting an EdgeWorker ID is only possible if it doesn't have any version currently active or being activated on the Akamai network.

2. Ensure that there are no active properties associated with an EdgeWorker before deletion.

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

### Delete Existing EdgeWorker Version
Permanently delete an existing version of a given EdgeWorker Id.

Usage: `akamai edgeworkers delete-version [options] <edgeworker-identifier> <version-identifier>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --noPrompt | Skip the deletion confirmation prompt |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | A unique integer handle to an EdgeWorkers instance |
| version-identifier | required | A unique integer handle to version of an EdgeWorkers instance |

#### Key Details
1. Deleting a version is only possible if it is not currently active or being activated on the Akamai network.

2. If the version is currently active, it will have to be deactivated before it can be deleted.

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
| --versionId `<versionId>` | Version identifier |
| --activationId `<activationId>` | Activation identifier |

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

### Deactivate an EdgeWorker
Deactivate a Version for a given EdgeWorker Id on an Akamai Network.

Usage: `akamai edgeworkers deactivate [options] <edgeworker-identifier> <network> <version-identifier>`

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

### Create an EdgeWorkers Authentication Token
Generates an authentication token that can be used to get detailed EdgeWorker debug response headers.

Usage: `akamai edgeworkers create-auth-token [options] <hostName>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --expiry `<expiry>` | Expiry duration of token, in minutes. |
| --format `<format>` | Format in which the output will be printed |

| Argument | Existence | Description |
| - | - | - |
| hostName | opional | HostName of the property. If no hostname is provided then token is created for all hosts(`/*`) under the property. Eg: www.test.com, www.test1.com |

#### Key Details
1. The `--expiry` value must be between 1 and 720 minutes (12 hours). The default is `8 hours`.

### Generate a Random Secret Key
Generates a random secret key that can be used to create edgeworkers authentication token and in property PMUSER_EW_DEBUG_KEY.

Usage: `akamai edgeworkers generate-secret`

### Clone an EdgeWorker Id
Allows customer to clone an EdgeWorker from an existing EdgeWorker Id.

Usage: `akamai edgeworkers clone <edgeworker-identifier> <resourceTierId> [options]`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --ewName | Name of the EdgeWorker |
| --groupId | Group identifier |

| Argument | Existence | Description |
| - | - | - |
| resourceTierId | required | Resource tier id to which the EdgeWorker will be cloned.

#### Key Details
1. This endpoint allows user to select a different Resource Tier ID for a specific EdgeWorker id by cloning it. Cloning to the same resource tier will fail.

### List Contracts
List of contract ids that user has access to.

Usage: `akamai list-contracts`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

### List Properties
List of properties associated to a specific EdgeWorker Id.

Usage: `akamai edgeworkers list-properties <edgeworker-identifier> [options]`

| Option | Description |
| - | - |
| -h, --help  | output usage information |
| --activeOnly | Returns only active properties |

| Argument | Existence | Description |
| - | - | - |
| edgeworker-identifier | required | EdgeWorker identifier.

#### Key Details
1. Note that the returned boolean limitedAccessToProperties is true if the user doesn't have access to the top level group under the account, or if they don't have the admin role for this group.

### List Limits
List the various limits EdgeWorkers imposes on the number of activations, EdgeWorkers IDs, and versions you can deploy.

Usage: `akamai edgeworkers list-limits [options]`

| Option | Description |
| - | - |
| -h, --help  | output usage information |


### List Resource Tiers for a specific Contract ID
Allows customers to list Resource Tiers that can be used to create or clone EdgeWorker IDs. 

Usage: `akamai list-restiers`

| Option | Description |
| - | - |
| --contractId | Resource tiers for the specified contract id. |
| -h, --help  | output usage information |

#### Key Details
1. User will be prompted with list of contract ids that user has access to. The selected contract id will be used to fetch resource tier.
2. To disable prompt for automation purpose, contract id can be provided as input.

### Fetch the Resource Tier for a specific EdgeWorker Id
Customers can get Resource Tier details for a specific EdgeWorker Id.

Usage: `akamai show-restier <edgeworkerId>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| edgeworkerId | required | EdgeWorker identifier.

### Get Available EdgeWorkers Report Types
Allows customers to list the available report types that can be generated for an EdgeWorker ID.

Usage: `akamai get reports`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

#### Key Details
1. The user will be given a table with reportIds and a description of each report. Use a given reportId with the `get report` command to get a report for a given EdgeWorker.

### Get EdgeWorker Report
Allows customers to get a report for a given EdgeWorker ID.

Usage: `akamai get report <reportId> <edgeworker-identifier>`

| Option | Existence| Description |
| - | - | - |
| -h, --help  | optional | output usage information |
| -s, --startDate `<startDate>` | required | ISO 8601 timestamp indicating the start time of the EdgeWorkers report. |
| -e, --endDate `<startDate>` | optional | ISO 8601 timestamp indicating the end time of the EdgeWorkers report. If not specified, the end time defaults to the current time. |
| --status `<status>` | optional | Comma-separated string to filter by EdgeWorkers status. Values: `success`, `genericError`, `unknownEdgeWorkerId`, `unimplementedEventHandler`, `runtimeError`, `executionError`, `timeoutError`, `resourceLimitHit`, `cpuTimeoutError`, `wallTimeoutError`, `initCpuTimeoutError`, `initWallTimeoutError`. |
| --ev, --eventHandlers `<eventHandlers>` | optional | Comma-separated string to filter EdgeWorkers by the event that triggers them. Values: `onClientRequest`, `onOriginRequest`, `onOriginResponse`, `onClientResponse`, `responseProvider`. |

| Argument | Existence | Description |
| - | - | - |
| reportId | required | Report Type. |
| edgeworker-identifier | required | EdgeWorker identifier. |

#### Key Details
1. For a list of available report IDs, use the `get reports` command.
2. The `startDate` option is a required option.

## Resources
For more information on EdgeWorkers, refer to the following resources:
* [EdgeWorkers Developer Page](https://developer.akamai.com/edgeworkers)
* [EdgeWorkers User Guide](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-4CC14D7E-D92D-4F2D-9292-17F8BE6E2DAE.html)
* [EdgeWorkers API Guide](https://developer.akamai.com/api/web_performance/edgeworkers/v1.html)

## Reporting Issues
You are all set, happy coding! If you experience any issues with the EdgeWorkers CLI, raise them as a [github issue](https://github.com/akamai/cli-edgeworkers/issues). Feel free to create a pull request with the fix or suggestion.

## Contributing
We welcome contributions from Akamai staff, customers, or others. Before opening up a PR please double check the following:
1. Please add some test cases to accompany your PR. This verifies the functionality added or modified in the PR and proves to others that your code works :)
2. Please make sure that your code passes all pre-commit checks. Your code should build successfully, pass all unit tests, and have no linting issues.
3. All PR's should be targeting develop, not master. Merges to master will immediately release to all customers.

<!--esi
<esi:eval src="/internal/footer.html?http" dca="esi" />
-->
