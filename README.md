<<<<<<< HEAD
# EdgeWorkers CLI
The EdgeWorkers command line interface (CLI) expedites the process of creating, testing and deploying EdgeWorkers functions to the Akamai Edge network.

## Technical Setup Requirements
To use this tool you need:
* [Akamai CLI](https://github.com/akamai/cli) installed. If you have a Mac with brew installed, run this command: `brew install akamai`.
* An API client that contains the EdgeWorkers APIs with read-write access. Follow the steps in [Get Started with APIs](https://developer.akamai.com/api/getting-started) to learn how to configure credentials to access the API.
* Node version 8+

## Quick Start

### Step 1: Install EdgeWorkers CLI 

`akamai install edgeworkers`

### Step 2: ----Add interesting things here ----


### Debug and report issues
You are all set, happy coding! If you experience any issues with the EdgeWorkers CLI, raise them as a [github issue](https://github.com/akamai/cli-edgeworkers/issues). Feel free to create a pull request with the fix or suggestion.
___

## Overview of Commands
EdgeWorkers CLI enables you to manage EdgeWorkers functions by calling the [EdgeWorkers API](https://developer.akamai.com/api/web_performance/edgeworkers/v1.html).

optional args `[]`
required args `<>`

Usage:  `[options] [command]`

Options:
 
| Syntax | Description |
| - | - |
| -V, --version | Display the version number for the EdgeWorkers CLI program. |
| --debug | Show debug information. |
| --edgerc `<path>` | Use credentials in `edgerc` file for command. (Default file location is _~/.edgerc_) |
| --section `<name>` | Use this section in `edgerc` file. (Default section is _[default]_|
| -h, --help | Display usage information for EdgeWorkers CLI. |
 
Commands:

| Command | Description |
| - | - |
| help [command] | Display usage information for the given command. |


## Resources
For more information on EdgeWorkers, refer to the [User Guide](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-4CC14D7E-D92D-4F2D-9292-17F8BE6E2DAE.html).
=======
# cli-edgeworkers
Akamai CLI for Edgeworkers, allows you to interact with EdgeWorkers APIs via a command line interface
>>>>>>> 054b97bfc906e9c952cd93bb2e4b43e426f08f29
