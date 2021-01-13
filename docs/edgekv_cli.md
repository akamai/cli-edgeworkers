# EdgeKV CLI
The EdgeKV command line interface (CLI) expedites the process of initializing, creating namespace, creating tokens, reading items, writing items and deleting  EdgeKV items on the Akamai Edge network.

___

## Overview of Commands
EdgeKV CLI enables you to manage EdgeKV functions by calling the [EdgeKV API](https://developer.akamai.com/api/web_performance/edgeworkers/v1.html).

Conventions:
* optional args `[]`
* required args `<>`

Usage:  
`akamai edgekv [options] [command]`

Options:
 
| Syntax | Description |
| - | - |
| -V, --version | Display the version number for the EdgeKV CLI program. |
| --debug | Show debug information. |
| --edgerc `<path>` | Use credentials in `edgerc` file for command. (Default file location is _~/.edgerc_) |
| --section `<name>` | Use this section in `edgerc` file. (Default section is _[default]_)|
| -h, --help | Display usage information for EdgeKV CLI. 

Commands:

| Command \| Alias | Description |
| - | - |
| help `[command]` | Display usage information for the given command. |
| initialize \| init | Initialize the EdgeKV. |
| show status | Shows status of EdgeKV instances provisioned. |
| create ns `<environment> <namespace>` | Creates an EdgeKV namespace for the given namespace id on an Akamai environment. |
| show ns `<environment> <namespace>`| Retrieves an EdgeKV namespace for a given namespace id on an Akamai environment. |
| list ns `<environment>` | Lists the namespaces provisioned on an Akamai environment. |
| write `<itemType> <environment> <namespace> <groupId> <itemId> <items>` | Writes the text or jsonfile items for the given namespace id, group id, item id on an Akamai environment. |
| read item `<environment> <namespace> <groupId> <itemId>` | Read an item for the given namespace id, group id, item id on an Akamai environment. |
| delete item \| del item `<environment> <namespace> <groupId> <itemId>` | Deletes an item for the given namespace id, group id, item id on an Akamai environment. |
| list items `<environment> <namespace> <groupId>` | List the items for the group id, namespace id on an Akamai environment. |
| create token \| create tkn `<tokenName> [options]` | Creates an EdgeKV access token for the specifed token name. | 

### Initialize EdgeKV
Initialize the EdgeKV database to build data-driven EdgeWorker applications.

Usage: `akamai edgekv initialize`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

### Get Initialization Status
Check on the current initialization status

Usage: `akamai edgekv show status`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

### Create Namespace
Create a namespace

Usage: `akamai edgekv create ns <environment> <nameSpace>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| environment | required | Label for which Akamai Network (STAGING or PRODUCTION) namespace should be created |
| nameSpace | required | Namespace Identifier

#### Key Details
1. Environment must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.
2. Length of namespace name is 32 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".

### Get Namespace
Retrieve a single namespace

Usage: `akamai edgekv show ns <environment> <nameSpace>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| environment | required | Label for which Akamai Network (STAGING or PRODUCTION) namespace should be created |
| nameSpace | required | Namespace Identifier

#### Key Details
1. Environment must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.
2. Length of namespace name is 32 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".

### List NameSpace
Retrieve a list of all namespaces

Usage: `akamai edgekv list ns <environment>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| environment | required | Label for which Akamai Network (STAGING or PRODUCTION) namespace should be created |

#### Key Details
1. Environment must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.

### UPSERT item 
UPSERT a single item in a namespace/group

Usage: `akamai edgekv write <itemType> <environment> <namespace> <groupId> <itemId> <value>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| itemType | required | Item type can be 'text' or 'jsonfile' |
| environment | required | Label for which Akamai Network (STAGING or PRODUCTION) namespace should be created |
| nameSpace | required | Namespace Identifier |
| groupId | required | group Identifier |
| itemId | required | Item Identifier |
| value | required | Value can be text or json file |

#### Key Details
1. Group name will be created on the fly.
2. Environment must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.
3. Length of namespace name is 32 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
4. Length of group id is 128 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
5. Length of item id is 512 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
6. Value can be text or json or json file

### Read item 
Retrieve an item from a namespace/group

Usage: `akamai edgekv read item <environment> <nameSpace> <groupId> <itemId>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| environment | required | Label for which Akamai Network (STAGING or PRODUCTION) namespace should be created |
| nameSpace | required | Namespace Identifier |
| groupId | required | group Identifier |
| itemId | required | Item Identifier |

#### Key Details
1. Environment must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.
2. Length of namespace name is 32 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
3. Length of group id is 128 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
4. Length of item id is 512 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".

### Delete item
Delete an item in a namespace/group

Usage: `akamai edgekv delete item <environment> <nameSpace> <groupId> <itemId>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| environment | required | Label for which Akamai Network (STAGING or PRODUCTION) namespace should be created |
| nameSpace | required | Namespace Identifier |
| groupId | required | group Identifier |
| itemId | required | Item Identifier |

#### Key Details
1. Environment must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.
2. Length of namespace name is 32 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
3. Length of group id is 128 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
4. Length of item id is 512 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".

### List items
List all items within a namespace/group

Usage: `akamai edgekv list items <environment> <nameSpace> <groupId>`

| Option | Description |
| - | - |
| -h, --help  | output usage information |

| Argument | Existence | Description |
| - | - | - |
| environment | required | Label for which Akamai Network (STAGING or PRODUCTION) namespace should be created |
| nameSpace | required | Namespace Identifier |
| groupId | required | group Identifier |

#### Key Details
1. Environment must be either STAGING or PRODUCTION. Capitalization will be normalized to uppercase.
2. Length of namespace name is 32 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".
3. Length of group id is 128 characters and must only use "A-Z", "a-z", "0-9", "_" or "-".

### Access Token
Create an access token

Usage: `akamai edgekv create token <tokenName> --save_path=<path> --overwrite --staging={allow|deny} --production={allow|deny} --expiry=<date> --ewids={all|<comma_separated_list_of_ewids> --namespace=<namespace_id>+permissions,<namespace_id>+permissions`

Example: ` edgekv create token token1 --save_path=/Documents/hellomgmt.tgz --overwrite --staging=allow --production=deny --ewids=all --namespace=default+rwd,marketing+r --expiry=2020-12-30`

| Option | Existence | Description |
| - | - | - |
| --save_path | Optional | Path of the edgeworker bundle where the token file should be created or updated. If the path is provided, token file will be automatically added to the bundle. |
| -o, --overwrite | Optional | Token in the file will be overwritten if this option is provided. |
| --staging | Required | Created token can be allowed or denied in staging environment. |
| -- production | Required | Created token can be allowed or denied in production environment. |
| -- ewids | Required | Maximum of 8 EWIDs can be applied per token or can be applied to all. |
| --namespace | Required | Permissions for the namespace. Maximum 20 namespace permissions can be created per token. |
| --expiry | Required | Expiry Date of the token. Format of the expiry date is yyyy-mm-dd. |
| -h, --help  | Optional | output usage information |

___
## Resources
For more information on EdgeWorkers, refer to the following resources:
* [EdgeKV User Guide](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgekv-getting-started-guide/GUID-FA85D8AF-F277-4FD0-B789-17312DBD3DDE.html)
* [EdgeKV API](https://github.com/akamai/edgeworkers-examples/tree/master/edgekv/apis)

## Reporting Issues
You are all set, happy coding! If you experience any issues with the EdgeWorkers CLI, raise them as a [github issue](https://github.com/akamai/cli-edgeworkers/issues). Feel free to create a pull request with the fix or suggestion.
