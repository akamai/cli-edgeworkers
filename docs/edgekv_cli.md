<!--esi
<esi:assign name="dac_stylesheets" value="['/stylesheets/screen.css']" />
<esi:assign name="dac_footer_js" value="['/javascripts/app/toc.js']" />
<esi:eval src="/internal/header.html?http" dca="esi" />
-->

# EdgeKV CLI

* [ Overview ](##overview)
* [ Technical Setup Requirements ](##technical-setup-requirements)
* [ Install or Update the EdgeWorkers and EdgeKV CLI ](##install-or-update-the-edgeworkers-and-edgekv-cli)
* [ Overview Of Commands ](##overview-of-commands)
    * [ Initialize EdgeKV ](###initialize-edgekv)
    * [ Get Initialization Status](###get-initialization-status)
    * [ Create Namespace](###create-namespace)
    * [ List Namespace](###list-namespace)
    * [ Get Namespace](###get-namespace)
    * [ Create or Update item](###create-or-update-item)
    * [ Read Item](###read-item)
    * [ Delete Item](###delete-item)
    * [ List Items](###list-items)
    * [ Create an Access Token](###create-an-access-token)
    * [ List Access Tokens](###list-access-tokens)
* [ Resources](##resources)
* [ Reporting Issues](##reporting-issues)

## Overview

The command-line interface (CLI) is a downloadable utility you can use to control EdgeKV functionality. It lets you administer EdgeKV without writing code against Akamai’s administrative APIs or using the Akamai Control Center UI. The CLI also enables you to script EdgeKV behaviors.

You can issue commands to trigger activities including database initialization, namespace management, token creation, and CRUD operations.

## Technical Setup Requirements

To use this tool you need:
* [Akamai CLI](https://github.com/akamai/cli) installed. 
    * If you do not have the CLI and are using [Homebrew](https://brew.sh/) on a Mac, run this command: `brew install akamai`
    * You may also [download](https://github.com/akamai/cli) OS-specific CLI binaries or a Docker image
* Valid EdgeGrid credentials configured via Akamai Control Center (see [Get Started with APIs](https://developer.akamai.com/api/getting-started))
* Node version 7 or higher

## Install or Update the EdgeWorkers and EdgeKV CLI

* If you do not have the EdgeWorkers CLI package installed, use the following Akamai CLI command to install the latest EdgeWorkers CLI package:

Usage:  
`akamai install edgeworkers`

* If you already have the CLI installed, use the following Akamai CLI command to install the latest EdgeWorkers CLI package that includes EdgeKV functionality:

Usage:  
`akamai update edgeworkers`

## Known Issues

1. When installing the Akamai CLI using the "akamai install edgeworkers" command you may run into a *"Package directory already exists"* error. This is likely because you already have the EdgeWorkers CLI package installed. In this case, please try updating the EdgeWorkers CLI package using “akamai update edgeworkers”.

If you continue to encounter this error when trying to update the Akamai CLI using the “akamai update edgeworkers” command,  uninstall the Akamai CLI using the “akamai uninstall edgeworkers” command. This will remove the existing installation, allowing you to reinstall using the “akamai install edgeworkers” command.

2. Docker installation error  
When installing Akamai CLI using docker, you may run into "Error: Cannot find module. '.bin/src/edgekv/ekv-cli-main.js".

Build-time workaround - use this when building the Docker image  
RUN `akamai install edgeworkers && cd $AKAMAI_CLI_HOME/.akamai-cli/src/cli-edgeworkers/ && npm run build`

Runtime workaround - use this if Docker is already running  
`cd ~/.akamai-cli/src/cli-edgeworkers/ && npm install --unsafe-perm`



## Overview of Commands

EdgeKV CLI enables you to manage the EdgeKV database by calling the [EdgeKV API](https://github.com/akamai/edgeworkers-examples/tree/master/edgekv/apis) from within the utility.

Conventions:
* optional arguments are denoted by []
* required arguments are denoted by <>

Usage:  
`akamai edgekv [options] [command]`

Options:
 
| Syntax | Description |
| - | - |
| -V, --version | Display the version number for the EdgeKV CLI program |
| --debug | Show debug information. |
| --edgerc `<path>` | Use credentials in edgerc file for command. (Default file location is ~/.edgerc). Refer to [Get Started with APIs](https://developer.akamai.com/api/getting-started#addcred) for more information. |
| --section `<name>` | Use this section in `edgerc` file. (Default section is _[default]_)|
| -h, --help | Display information on how to use this EdgeKV command. | 

Commands:

| Command \| Alias | Description |
| - | - |
| help `[command]` | Display information on how to use the given command. |
| initialize \| init | Initialize an EdgeKV database. |
| show status | Show the status of an EdgeKV database. |
| create ns `<environment> <namespace>` | Create an EdgeKV namespace in an Akamai environment. |
| show ns `<environment> <namespace>`| Retrieve an EdgeKV namespace in an Akamai environment. |
| list ns `<environment>` | List the namespaces provisioned in an Akamai environment. |
| write `<itemType> <environment> <namespace> <groupId> <itemId> <items>` | Write the text item or JSON item supplied in a file for the given namespace, group id, and item id in an Akamai environment. |
| read item `<environment> <namespace> <groupId> <itemId>` | Read an item for the given namespace, group id, and item id in an Akamai environment. |
| delete item \| del item `<environment> <namespace> <groupId> <itemId>` | Delete an item for the given namespace, group id, and item id in an Akamai environment. |
| list items `<environment> <namespace> <groupId>` | List the items for the given namespace and group id in an Akamai environment. |
| create token \| create tkn `<tokenName> [options]` |  Create an EdgeKV access token. |

Return Codes:

| Return Code | Description |
| - | - |
| 0 | Command executed successfully. |
| 1 | Command failed. |

### Initialize EdgeKV

Initialize the EdgeKV database. This action is only required once to initialize your EdgeKV database and provision the *default* EdgeKV namespace on Akamai's staging and production environments. It also creates a new, dedicated CP code used to track your EdgeKV usage. Before you can perform any other EdgeKV operations you must successfully complete this step.

Usage: `akamai edgekv initialize`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command |

### Get Initialization Status

Check the initialization status of the EdgeKV database

Usage: `akamai edgekv show status`

| Option | Description |
| - | - |
| -h, --help  |  Display information on how to use this EdgeKV command |

### Create Namespace

Create a namespace

Usage: `akamai edgekv create ns <environment> <nameSpace>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command |

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment on which to create this namespace, either “staging” or “production” |
| namespace | required | Namespace identifier. |

#### Important Notes
1. The namespace identifier can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The namespace identifier can be between 1 and 32 characters in length.
3. You cannot use the word "default" as the namespace identifier. The “default” namespace is already created during initialization.

### List NameSpace

Retrieve a list of all namespaces

Usage: `akamai edgekv list ns <environment>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment from which to retrieve a list of namespaces, either “staging” or “production”. |

### Get Namespace

Retrieve the details for a single namespace

Usage: `akamai edgekv show ns <environment> <nameSpace>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment from which to retrieve namespace details, either “staging” or “production”. |
| namespace | required | Namespace identifier. |

#### Important Notes
1. The namespace identifier can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The namespace identifier can be between 1 and 32 characters in length.

### Create or Update item

Create or update (upsert) a single item into a namespace and group.

Usage: `akamai edgekv write <itemType> <environment> <namespace> <groupId> <itemId> <value>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command |

| Argument | Existence | Description |
| - | - | - |
| itemType | required | Item type can be 'text' or 'jsonfile' |
| environment | required | The Akamai environment on which to create or update this item, either “staging” or “production” |
| namespace | required | Namespace identifier |
| groupid | required | Group identifier |
| itemid | required | Item identifier |
| value | required | If the itemType is 'text' the value can be a text string. If the itemType is 'jsonfile' the value can be the path/name of a file containing the item value in valid JSON format. |

#### Important Notes
1. The *namespace* must have been already created, while the *group* will be automatically created for you if it does not exist.
2. The namespace, group, and item identifiers can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
3. The namespace identifier can be between 1 and 32 characters in length.
4. The group identifier can be between 1 and 128 characters in length.
5. The item identifier can be between1 and 512 characters in length.


### Read item 

Retrieve an item from a namespace and group

Usage: `akamai edgekv read item <environment> <nameSpace> <groupId> <itemId>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment on which to read this item, either “staging” or “production”. |
| namespace | required | Namespace identifier |
| groupid | required | Group identifier |
| itemid | required | Item identifier |

#### Important Notes
1. The namespace, group, and item identifiers can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The namespace identifier can be between 1 and 32 characters in length.
3. The group identifier can be between 1 and 128 characters in length.
4. The item identifier can be between1 and 512 characters in length.
5. Items written to EdgeKV are usually read within 10 seconds or less. When writing a new item, a "404 Not Found" response status code may occur during the inconsistency window. This is normal behavior for EdgeKV, an eventually consistent database.
6. The returned value is always displayed as text.

### Delete item

Delete an item in a namespace and group

Usage: `akamai edgekv delete item <environment> <nameSpace> <groupId> <itemId>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment on which to delete this item, either “staging” or “production”. |
| namespace | required | Namespace identifier |
| groupid | required | Group identifier |
| itemid | required | Item identifier |

#### Important Notes
1. The namespace, group, and item identifiers can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The namespace identifier can be between 1 and 32 characters in length.
3. The group identifier can be between 1 and 128 characters in length.
4. The item identifier can be between1 and 512 characters in length.
5. It usually takes 10 seconds or less before a deleted item is no longer readable. This is normal behavior for EdgeKV, an eventually consistent database.

### List items

List items within a namespace and group

Usage: `akamai edgekv list items <environment> <nameSpace> <groupId>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command |

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment on which to list the items, either “staging” or “production” |
| namespace | required | Namespace identifier |
| groupid | required | Group identifier |

#### Important Notes
1. The namespace and group identifiers can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The namespace identifier can be between 1 and 32 characters in length.
3. The group identifier can be between 1 and 128 characters in length.
4. If there are more than 100 items in the namespace/group, a random set of 100 items in that namespace/group will be returned since EdgeKV is a NoSQL-style database.


### Create an Access Token

Create an access token to use within the EdgeWorkers code bundle to authorize access to the EdgeKV database.

Usage: 
`akamai edgekv create token <tokenName> --save_path=<path> --overwrite --staging={allow|deny} --production={allow|deny} --expiry=<date> --ewids={all|<comma_separated_list_of_ewids> --namespace=<namespace_id>+permissions,<namespace_id>+permissions`

Example: 
` edgekv create token token1 --save_path=/Documents/hellomgmt.tgz --overwrite --staging=allow --production=deny --ewids=all --namespace=default+rwd,marketing+r --expiry=2020-12-30`

| Option | Existence | Description |
| - | - | - |
| --save_path | Optional | Path specifying where to save the edgekv_tokens.js token file. We recommend that you save the token file in the same location as the EdgeWorkers code bundle file (.tgz). The EdgeWorkers code bundle is then automatically updated every time this command updates the edgekv_tokens.js token file.If a path is not provided the token value is displayed. This token must be securely stored and manually added to the edgekv_tokens.js token file and EdgeWorkers code bundle. |
| -o, --overwrite | Optional | This option is used in conjunction with the --save_path option to overwrite the value of an existing token with the same name in the edgekv_tokens.js file. |
| --staging | Required | Acceptable value: 'allow', 'deny'. <br />Specifies whether the token will be allowed or denied in the staging environment. |
| -- production | Required | Acceptable value: 'allow', 'deny'. <br />Specifies whether the token will be allowed or denied in the production environment. |
| -- ewids | Required | Acceptable value: <br /> - 'all', <br /> - A comma separated list of up to a maximum of 8 EdgeWorker IDs. This  restricts token usage to the specified  EdgeWorker IDs. |
| --namespace | Required | Value: A comma separated list of up to a maximum of 20 namespace identifier and permission combinations. This list specifies where the token can be used. The permissions format is any combination of the following letters: <br /> - 'r' to authorize the token for read operations <br /> - 'w' to authorize the token for write operations <br /> - 'd' to authorize the token for delete operations. |
| --expiry | Required | Expiration date of the token. Format of the expiry date is ISO 8601 format: yyyy-mm-dd. |
| -h, --help  | Optional | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| tokenname | required | Token name |

#### Important Notes
1. The token name can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The token name can be between 1 and 32 characters in length.
3. The expiry date must be at least 1 day in the future and no more than 6 months from the current date.

### List Access Tokens

List of all tokens for which the user has permission to download.

Usage: `akamai edgekv list tokens`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command |

___
## Resources

For more information on EdgeKV, refer to the following resources:

* [EdgeKV User Guide](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgekv-getting-started-guide/GUID-FA85D8AF-F277-4FD0-B789-17312DBD3DDE.html)
* [EdgeKV API Reference](https://github.com/akamai/edgeworkers-examples/tree/master/edgekv/apis)

## Reporting Issues

If you experience any issues with the CLI or feel like there's anything missing, let us know or simply create an [issue](https://github.com/akamai/cli-edgeworkers/issues) or a PR on the repo. 

<!--esi
<esi:eval src="/internal/footer.html?http" dca="esi" />
-->