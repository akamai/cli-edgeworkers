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
    * [ Modify Namespace](###modify-namespace)
    * [ Create or Update item](###create-or-update-item)
    * [ Read Item](###read-item)
    * [ Delete Item](###delete-item)
    * [ List Items](###list-items)
    * [ Create an Access Token](###create-an-access-token)
    * [ List Access Tokens](###list-access-tokens)
    * [ Retrieve Access Token](###retrieve-access-token)
    * [ Revoke access token](###revoke-access-token)
    * [ List permission groups](###list-permission-groups)
    * [ Modify permission group](###modify-permission-group)
    * [ List Default Config Properties](###list-all-default-values-of-a-section-in-config-file)
    * [ Get a Default Config Property](###get-a-default-value-of-a-section-in-config-file)
    * [ Set a Default Config Property](###set/update-a-default-value-of-a-section-in-config-file)
    * [ Unset a Default Config Property](###unset-a-default-value-of-a-section-in-config-file)
    * [ Bulk Save Default Config Properties](###bulk-save-default-properties-of-a-section-in-config-file)
* [ Resources](##resources)
* [ Reporting Issues](##reporting-issues)

## Overview

The command-line interface (CLI) is a downloadable utility you can use to control EdgeKV functionality. It lets you administer EdgeKV without writing code against Akamai’s administrative APIs or using the Akamai Control Center UI. The CLI also enables you to script EdgeKV behaviors. This CLI is fully integrated with the EdgeWorkers CLI, enabling both products to be administered from a single interface.

You can issue commands to trigger activities including database initialization, namespace management, token creation, and CRUD operations.

## Technical Setup Requirements

To use this tool you need:
* [Akamai CLI](https://github.com/akamai/cli) installed. 
    * If you do not have the CLI and are using [Homebrew](https://brew.sh/) on a Mac, run this command: `brew install akamai`
    * You may also [download](https://github.com/akamai/cli) OS-specific CLI binaries or a Docker image
* Valid EdgeGrid credentials configured via Akamai Control Center (see [Get Started with APIs](https://developer.akamai.com/api/getting-started))
* Node version 14 or higher

## Install or Update the EdgeWorkers and EdgeKV CLI

* If you do not have the EdgeWorkers CLI package installed, use the following Akamai CLI command to install the latest EdgeWorkers CLI package:

Usage:  
`akamai install edgeworkers`

* If you already have the CLI installed, use the following Akamai CLI command to install the latest EdgeWorkers CLI package that includes EdgeKV functionality:

Usage:  
`akamai update edgeworkers`


## Provide Default Config Properties

The EdgeWorkers CLI lets you set default values for the command options. There are two ways to create a config file:  

1. Create a config file `~/.akamai-cli/ew-config`, and store the properties as follows:
```bash
[default]
edgeworkerName=testEW
groupId=12345
versionId=1-0-2
```

2. Use the `config` command to set default properties:
`akamai edgeworkers config set <key> <value>`

Available property names are displayed [here](../src/utils/constants.ts).

## Known Issues

1. When installing the Akamai CLI using the "akamai install edgeworkers" command you may run into a *"Package directory already exists"* error. This is likely because you already have the EdgeWorkers CLI package installed. In this case, please try updating the EdgeWorkers CLI package using “akamai update edgeworkers”.

    If you continue to encounter this error when trying to update the Akamai CLI using the “akamai update edgeworkers” command,  uninstall the Akamai CLI using the “akamai uninstall edgeworkers” command. This will remove the existing installation, allowing you to reinstall using the “akamai install edgeworkers” command.

2. Docker installation error  
    When installing Akamai CLI using docker, you may run into "Error: Cannot find module. '.bin/src/edgekv/ekv-cli-main.js".

    Build-time workaround - use this when building the Docker image  
    RUN `akamai install edgeworkers && cd $AKAMAI_CLI_HOME/.akamai-cli/src/cli-edgeworkers/ && npm run build`

    Runtime workaround - use this if Docker is already running  
    `cd ~/.akamai-cli/src/cli-edgeworkers/ && npm install --unsafe-perm`

3. The EdgeKV CLI --overwrite option for the token create and download commands does not work when you change the token name associated with a namespace.

    As a workaround, you can manually delete the token in question from the edgekv_tokens.js file before using the --save_path option. You can then use the token create and download CLI commands with the --save_path option to update the edgekv_tokens.js file.

For a broader list of all known EdgeKV issues please refer to the Akamai TechDocs [here](https://techdocs.akamai.com/edgekv/docs/known-issues]).

## Overview of Commands

EdgeKV CLI enables you to manage the EdgeKV database by calling the [EdgeKV API](https://techdocs.akamai.com/edgekv/reference/api) from within the utility.

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
| --edgerc `<path>` | Use credentials in edgerc file for command. (Default file location is ~/.edgerc). Refer to [Get Started with APIs](https://techdocs.akamai.com/developer/docs/set-up-authentication-credentials) for more information. |
| --section `<name>` | Use this section in `edgerc` file. (Default section is _[default]_)|
| --configSection `<configSection>` | Use this section in the `ew-config` file that contains the default config properties set. (Default section is _[default]_)|
| --timeout `<timeout>` | You can specify a timeout value for a command in seconds to override the 1 minute default. For example, if you add "--timeout 10" to a command, it will timeout if the server takes more than 10 second to respond. |
| -h, --help | Display information on how to use this EdgeKV command. | 

Commands:

| Command \| Alias | Description |
| - | - |
| help `[command]` | Display information on how to use the given command. |
| initialize \| init | Initialize an EdgeKV database. |
| show status | Show the status of an EdgeKV database. |
| create ns `<environment> <namespace> --retention <retention>` | Create an EdgeKV namespace in an Akamai environment. Specify the retention period of the namespace in days. |
| show ns `<environment> <namespace>`| Retrieve an EdgeKV namespace in an Akamai environment. |
| list ns `<environment>` | List the namespaces provisioned in an Akamai environment. |
| modify ns `<environment> <nameSpace>` | Modify an EdgeKV namespace in an Akamai environment. |
| write `<itemType> <environment> <namespace> <groupId> <itemId> <items>` | Write the text item or JSON item supplied in a file for the given namespace, group id, and item id in an Akamai environment. |
| read item `<environment> <namespace> <groupId> <itemId>` | Read an item for the given namespace, group id, and item id in an Akamai environment. |
| delete item \| del item `<environment> <namespace> <groupId> <itemId>` | Delete an item for the given namespace, group id, and item id in an Akamai environment. |
| list items `<environment> <namespace> <groupId>` | List the items for the given namespace and group id in an Akamai environment. |
| create token \| create tkn `<tokenName> [options]` |  Create an EdgeKV access token. |
| list tokens `[options]`| List of all tokens the user has permission to download. |
| download token `<tokenName> [options]` | Download an edgekv token. |
| revoke token `<tokenName>` | Revoke an EdgKV access token. |
| list auth-groups `[options]`| List the permission groups with EdgeKV Access. |
| list groups `<environment> <nameSpace>` | List the data groups for a given namespace in an Akamai environment.|
| modify auth-group `<namespaceId> <groupId>` | Modify the permission group associated with the namespace. |
| config list | Get all values in the config file. |
| config get `<key>` | Get a config value from a section in the config file. |
| config set `<key> <value>` | Set a config value in a section. |
| config save `-p <properties>` | Save config properties in a section. |
| config unset `<key>` | Unset a config value in a section. |


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

| Option | Existence | Description |
| - | - | - |
| -h, --help  | optional | Display information on how to use this EdgeKV command. |
| --retention | Required | Retention period of the namespace in days. |
| --groupId | Required | Group identifier. Set it to 0 to allow all groups in your account to access the namespace. If you want to restrict the namespace to a specific group, enter the group id. This value MUST be the same for both the staging and production instances of a namespace. |
| --geolocation | optional | Specifies the persistent storage location for data when creating a namespace on the production network. This can help optimize performance by storing data where most or all of your users are located. The value defaults to `US` on the `STAGING` and `PRODUCTION` networks. For more information refer to the [EdgeKV Documenation](https://techdocs.akamai.com/edgekv/docs/edgekv-data-model#namespace).|

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment on which to create this namespace, either “staging” or “production” |
| namespace | required | Namespace identifier. |

#### Important Notes
1. The namespace identifier can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The namespace identifier can be between 1 and 32 characters in length.
3. You cannot use the word "default" as the namespace identifier. The “default” namespace is already created during initialization.
4. Specifying "0" retention means indefinite retention.
5. A non-zero retention cannot be less than 1 day or more than 3650 days.

### List NameSpace

Retrieve a list of all namespaces

Usage: `akamai edgekv list ns <environment>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command. |
| -d, --details | Displays details of the namespace. |
| --order-by | Choose column to order by when displaying detailed namespace list. |
| --asc, --ascending | Sort using acscending order (default). |
| --desc, --descending | Sort using descending order. |

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

### Modify Namespace

Modify the namespace

Usage: `akamai edgekv modify ns <environment> <nameSpace>`

| Option | Existence | Description |
| - | - | - |
| -h, --help  | optional | Display information on how to use this EdgeKV command. |
| --retention | Required | Retention period of the namespace in days. |

#### Important Notes
1. The namespace identifier can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The namespace identifier can be between 1 and 32 characters in length.
3. You cannot modify the retention period for the "default" namespace.
4. A non-zero retention cannot be less than 1 day or more than 3650 days.

### Create or Update item

Create or update (upsert) a single item into a namespace and group.

Usage: `akamai edgekv write <itemType> <environment> <namespace> <groupId> <itemId> <value>`

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command |
| --sandboxId| optional |`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.|

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
| --sandboxId| optional |`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.|

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
| --sandboxId| optional |`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.|

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

| Option | Existence | Description |
| - | - | - |
| -h, --help  | Optional | Display information on how to use this EdgeKV command |
| --maxItems  | Optional | Maximum number of items to return per request, up to the system [limits](https://techdocs.akamai.com/edgekv/docs/limits) |
| --sandboxId| optional |`sandbox-id` to use for the data operation. You can use the `akamai sandbox list` CLI command to view a list of available sandboxes.|


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
| --save_path | Optional | Path specifying where to save the edgekv_tokens.js token file. We recommend that you save the token file in the same location as the EdgeWorkers code bundle file (.tgz). The EdgeWorkers code bundle is then automatically updated every time this command updates the edgekv_tokens.js token file. If a path is not provided the token value is displayed. This token must be securely stored and manually added to the edgekv_tokens.js token file and EdgeWorkers code bundle. |
| -o, --overwrite | Optional | This option is used in conjunction with the --save_path option to overwrite the value of an existing token with the same name in the edgekv_tokens.js file. |
| --staging | Required | Acceptable value: 'allow', 'deny'. <br />Specifies whether the token will be allowed or denied in the staging environment. |
| -- production | Required | Acceptable value: 'allow', 'deny'. <br />Specifies whether the token will be allowed or denied in the production environment. |
| -- ewids | Required | Acceptable value: <br /> - 'all', <br /> - A comma separated list of up to a maximum of 8 EdgeWorker IDs. This  restricts token usage to the specified  EdgeWorker IDs. |
| --namespace | Required | Value: A comma separated list of up to a maximum of 20 namespace identifier and permission combinations. This list specifies where the token can be used. The permissions format is any combination of the following letters: <br /> - 'r' to authorize the token for read operations <br /> - 'w' to authorize the token for write operations <br /> - 'd' to authorize the token for delete operations.  <br /> Example: "myNamespace1+rwd,myNamespace2+rw" |
| --expiry | Required | Expiration date of the token. Format of the expiry date is ISO 8601 format: yyyy-mm-dd. |
| -h, --help  | Optional | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| tokenName | required | token name |

#### Important Notes
1. The token name can only include alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash characters.
2. The token name can be between 1 and 32 characters in length.
3. The expiry date must be at least 1 day in the future and no more than 6 months from the current date.

### List Access Tokens
 
List of all tokens the user has permission to download.
 
Usage: `akamai edgekv list tokens`
 
| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command. |
| --include-expired | Retrieves both expired and valid tokens. |

#### Important Notes
1. Note that --include-expired returns all the tokens that count towards your account's token limit. For more details, See [Akamai EdgeKV getting started guide](https://techdocs.akamai.com/edgekv/docs/limits)
 
### Retrieve Access Token
 
Retrieve an EdgeKV access token.
 
Usage:
`akamai edgekv download token <tokenName> --save_path=<path> --overwrite`
 
| Option | Existence | Description |
| - | - | - |
| --save_path | Optional | Path specifying where to save the edgekv_tokens.js token file. We recommend that you save the token file in the same location as the EdgeWorkers code bundle file (.tgz). The EdgeWorkers code bundle is then automatically updated every time this command updates the edgekv_tokens.js token file. If a path is not provided the token value is displayed. This token must be securely stored and manually added to the edgekv_tokens.js token file and EdgeWorkers code bundle. |
| -o, --overwrite | Optional | This option is used in conjunction with the --save_path option to overwrite the value of an existing token with the same name in the edgekv_tokens.js file. |
| -h, --help  | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| tokenName | required | token name |

### Revoke Access Token

Revoke an EdgKV access token.

Usage:
`akamai edgekv revoke token <tokenName>`

| Argument | Existence | Description |
| - | - | - |
| tokenName | required | token name |

### List Groups in Namespace

List the data groups for a given namespace in an Akamai environment.
Usage:
`akamai edgekv list groups <environment> <namespace>`

Example:
`akamai edgekv list groups production default `

| Option | Description |
| - | - |
| -h, --help  | Display information on how to use this EdgeKV command. |

| Argument | Existence | Description |
| - | - | - |
| environment | required | The Akamai environment from which to retrieve a list of groups, either “staging” or “production”. |
| namespace | required | Namespace identifier |

#### Important Notes
1. Note that this operation returns up to 10,000 groups. If the namespace contains more than 10,000 groups, the operation returns a random set of 10,000 groups.


### List Permission Groups

List the permission groups with EdgeKV access

Usage:
`edgekv list auth-groups [options]`

Example:
`edegkv list auth-groups --groupId gid1,gid2 --include_ew_groups`

| Option | Description |
| - | - |
| --groupIds | List the EdgeKV access capabilities for the specified permission groups, separated by a comma |
| --include_ew_groups | List all permission groups with EdgeKV or EdgeWorkers access capabilities |
| -h, --help  | Display information on how to use this EdgeKV command |

### Modify Permission Group

Modify the permission group associated with the namespace

Usage:
`edgekv modify auth-group <namespaceId> <groupId>`

| Argument | Existence | Description |
| - | - | - |
| namespaceId | required | Namespace identifier |
| groupid | required | Group identifier |

### List All Default Values of a Section in Config File
Get all default properties in a section of the config file.

Usage: `akamai config list`

| Option | Existence| Description |
| - | - | - |
| -h, --help  | optional | output usage information |

#### Key Details
1. By default the config section is `default`. To use a different section, specify the `akamai edgeworkers` command with option `--configSection <configSeciont>`.
2. Use the same approach with the following `config` commands.

### Get a Default Value of a Section in Config File
Get one specific default value in a section of the config file.

Usage: `akamai config get <key>`

| Option | Existence| Description |
| - | - | - |
| -h, --help  | optional | output usage information |

| Argument | Existence | Description |
| - | - | - |
| key | required | Name of default property |

### Set/Update a Default Value of a Section in Config File
Allows customers set/update a specific default value in a section of the config file.

Usage: `akamai config set <key> <value>`

| Option | Existence| Description |
| - | - | - |
| -h, --help  | optional | output usage information |

| Argument | Existence | Description |
| - | - | - |
| key | required | Name of default property |
| value | required | Value of default property |

### Unset a Default Value of a Section in Config File
Allows customers unset a specific default value in a section of the config file.

Usage: `akamai config unset <key>`

| Option | Existence| Description |
| - | - | - |
| -h, --help  | optional | output usage information |

| Argument | Existence | Description |
| - | - | - |
| key | required | Name of default property |

### Bulk Save Default Properties of a Section in Config File
Allows customers save the default values in bulk.

Usage: `akamai config save [options]`

| Option | Existence| Description |
| - | - | - |
| -h, --help  | optional | output usage information |
| -p, --properties  | required | Config properties. Use format \'key=value\' to set a property and white space to split them. |

#### Key Details
1. If the context contain invalid item, the command will skip that item and continue.

___
## Resources

For more information on EdgeKV, refer to the following resources:

* [EdgeKV User Guide](https://techdocs.akamai.com/edgekv/docs)
* [EdgeKV API Reference](https://techdocs.akamai.com/edgekv/reference/api)

## Reporting Issues

If you experience any issues with the CLI or feel like there's anything missing, let us know or simply create an [issue](https://github.com/akamai/cli-edgeworkers/issues) or a PR on the repo. 

<!--esi
<esi:eval src="/internal/footer.html?http" dca="esi" />
-->
