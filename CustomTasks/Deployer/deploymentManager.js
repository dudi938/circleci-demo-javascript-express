var fs = require('fs');
var path = require('path');

const { exec } = require('child_process');
var tokenReplacer = require('../tokenize/tokenize.js').tokensReplacer;
var tokens2value = require('../tokenize/tokenize.js').tokens2value;
var replace = require('../tokenize/tokenize.js').replace;


var inputArgs = process.argv.slice(2);
//inputs
var resourceGroup = inputArgs[0];
var action = inputArgs[1];
var gridsQuantity = inputArgs[2];
var firefoxNodsQuantity = inputArgs[3];
var chromeNodsQuantity = inputArgs[4];
var edgeNodsQuantity = inputArgs[5];
var ie11NodsQuantity = inputArgs[6];
var location = inputArgs[7];
var controllerBlobsContainerCS = inputArgs[8];
var app_id = inputArgs[9];
var app_key = inputArgs[10];
var tenant = inputArgs[11];

//quantity of each nods server type 
var bigChromeServer = 0;
var smallChromeServer = 0;
var bigFirefoxServer = 0;
var smallFirefoxServer = 0;
var bigEdgeServer = 0;
var bigIE11Server = 0;

//xml host lines for the grid
var chromeXMLNodsHostsLines = '';
var firefoxXMLNodsHostsLines = '';
var edgeXMLNodsHostsLines = '';
var ie11XMLNodsHostsLines = '';

//Noeds Deployed Quantity
var chromeNodesDeployed = 0;
var firefoxNodesDeployed = 0;
var edgeNodesDeployed = 0;
var ie11NodesDeployed = 0;
//Servers Deployed Quantity
var chromeServersDeployed = 0;
var firefoxServersDeployed = 0;
var edgeServersDeployed = 0;
var ie11ServersDeployed = 0;

//VM TYPS
const BIG_NODES_SERVER = "Standard_D4s_v3";
const SMALL_NODES_SERVER = "Standard_F2s";
const EDGE_IMAGE = "edge_image";
const IE11_IMAGE = "ie11_image";

//ARM TEMPLATE FOR GRID'S
const GRID_TEMPLATE_BASE = "./Templates/Grid/templateWithTokens.json";
const GRID_TEMPLATE = "./Templates/Grid/template.json";
const GRID_PARAMETERS_BASE = "./Templates/Grid/parametersWithTokens.json";
const GRID_PARAMETERS = "./Templates/Grid/parameters.json";
//ARM TEMPLATE FOR NOD'S
const NODE_TEMPLATE_BASE = "./Templates/nods/templateWithTokens.json";
const NODE_TEMPLATE = "./Templates/nods/template.json";
const NODE_PARAMETERS_BASE = "./Templates/nods/parametersWithTokens.json";
const NODE_PARAMETERS = "./Templates/nods/parameters.json";

const PUBLIC_KEY_PATH = './sshkey.pub';



//XML test  file
const TEST_XML_BASE = "./testWithTokens.xml";
const TEST_XML = "./test.xml";

//MACHINE_SIZE_LIMITS
const SMALL_MACHINE_MAX_NODS = 4;
const BIG_MACHINE_MAX_NODS = 10;
//BROWSER_TYPES
const CHROME_BROWSER = 'chrome';
const FIREFOX_BROWSER = 'firefox';
const EDGE_BROWSER = 'edge';
const IE_BROWSER = 'ie11';

//action typs
const ACTION_GRID_DEPLOY = 'GRID_DEPLOY';
const ACTION_NODS_DEPLOY = 'NODS_DEPLOY';
const ACTION_CREATE_RESOURCE_GROUP = 'ACTION_CREATE_RESOURCE_GROUP';

//azure region
const AZURE_REGION = 'WESTUS2';


var resourceGroupExist = new String("NULL");;


//put ssh public key on the template
function addSSHPublicKeyToTemplate(publikKeyPath, disTemplatePath, disTemplatePathNew, callback) {
    console.log('publikKeyPath = ' + publikKeyPath);
    console.log('disTemplatePath = ' + disTemplatePath);
    console.log('disTemplatePathNew = ' + disTemplatePathNew);
    fs.readFile(publikKeyPath, { encoding: "utf8" }, function(err, data){
        if(err){
            console.log(err);
        }
            //delete " " + "\r\n" from the string...
            var keyArry = data.split(" ");
            var key = keyArry[0] + keyArry[1] + keyArry[2]; 

            console.log('New key: ' + key);
        replace('__PUBLIC_KEY__', disTemplatePath, key , disTemplatePathNew, callback);
    });
}



function uploadFileToBlob(file, container, connectionString, callback) {
    console.log('***Start upload test.xml file.......');
    var fileName = path.basename(file);
    exec('az storage blob upload -f ' + file + ' -c ' + container + ' -n ' + fileName + ' --connection-string ' + '"' + connectionString + '"', (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
        console.log(stdout);

    }).on('close', function () {
        if (typeof (callback) == 'function') {
            callback()
        }
    });
}


function getNextNodsQuanity(browser) {
    if (browser === CHROME_BROWSER) {

        if ((chromeNodsQuantity - chromeNodesDeployed) > BIG_MACHINE_MAX_NODS) {
            chromeNodesDeployed += BIG_MACHINE_MAX_NODS;
            return chromeNodesDeployed;
        } else {
            chromeNodesDeployed = chromeNodsQuantity - chromeNodesDeployed;
            return chromeNodesDeployed;
        }

    } else if (browser === FIREFOX_BROWSER) {

        if ((firefoxNodsQuantity - firefoxNodesDeployed) > BIG_MACHINE_MAX_NODS) {
            firefoxNodesDeployed += BIG_MACHINE_MAX_NODS;
            return firefoxNodesDeployed;
        } else {
            firefoxNodesDeployed = firefoxNodsQuantity - firefoxNodesDeployed;
            return firefoxNodesDeployed;
        }
    }
}

function getAllIPbyResourceGroup(resourceGroup, calbback) {
    var ipArr;
    exec('az vm list-ip-addresses  -g ' + resourceGroup, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            return;
        }
        ipArr = stdout;
        //console.log(ipArr);
    }).on('close', function () {
        if (typeof (calbback) == 'function') {
            calbback();
        }
    });
}

function getVmIp(rg, vmName, calback) {
    var data;
    var myIP;
    console.log('rg = ' + rg);
    console.log('vmName = ' + vmName);

    exec('az vm list-ip-addresses -g ' + rg + ' -n  ' + vmName, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            return;
        }
        data = stdout;
        console.log('data = ' + data);
    }).on('close', function () {
        console.log(JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0]);
        myIP = JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0].ipAddress;
        if (typeof (calback) == 'function') {
            calback(myIP);
        }
    });
};


function deployNodsServer(browser, vmQuantity, machineType, callback) {

    if (browser == EDGE_BROWSER || browser == IE_BROWSER) {
        //TODO handle deploy nods type ie/edge
        callback();
    } else if (vmQuantity === 0) {
        console.log('vmQuantity = ' + vmQuantity);
        callback();
    } else {

        console.log('deploy nodes server' + 'browser = ' + browser + '. vmQuantity = ' + vmQuantity + '. machineType = ' + machineType);

        //replace tokens
        //replace machine size in the parameters.json file

        replace('__AZURE_REGION__', NODE_PARAMETERS_BASE, AZURE_REGION, NODE_PARAMETERS, function () {
            replace('__VIRTUAL_MACHINE_SIZE__', NODE_PARAMETERS_BASE, machineType, NODE_PARAMETERS, function () {
                var serverIndex;
                if (browser == CHROME_BROWSER) {
                    serverIndex = chromeServersDeployed;
                } else if (browser == FIREFOX_BROWSER) {
                    serverIndex = firefoxServersDeployed;
                }

                //replace index of resource's in the parameters.json file
                var currentVmName = 'VM-Node' + '-' + browser.slice(0, 3) + serverIndex;
                tokens2value(NODE_PARAMETERS, '-' + browser.slice(0, 3) + serverIndex, NODE_PARAMETERS, function () {


                    //calc memory size
                    var memorySize;
                    if (machineType === BIG_NODES_SERVER) {
                        memorySize = 15;
                    } else {
                        memorySize = 7;
                    }


                    var currentNodsQantity = getNextNodsQuanity(browser);
                    console.log('***currentNodsQantity = ' + currentNodsQantity + '***');

                    replace('__START_UP_SCRIPT_PARAMETERS__', NODE_TEMPLATE_BASE, browser + '  ' + currentNodsQantity + '  ' + memorySize, NODE_TEMPLATE, function () {
                        addSSHPublicKeyToTemplate(PUBLIC_KEY_PATH, NODE_TEMPLATE, NODE_TEMPLATE, function () {
                            exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + NODE_TEMPLATE + '   --parameters  ' + NODE_PARAMETERS, (err, stdout, stderr) => {

                                if (err) {
                                    console.log(err);
                                }


                                console.log(stdout);
                            }).on('close', function () {

                                if (browser == CHROME_BROWSER) {

                                    chromeServersDeployed++;
                                } else if (browser == FIREFOX_BROWSER) {
                                    firefoxServersDeployed++;

                                } else if (browser == EDGE_BROWSER) {
                                    edgeServersDeployed++;

                                } else if (browser == FIREFOX_BROWSER) {
                                    ie11ServersDeployed++;
                                }

                                var ip;
                                getVmIp(resourceGroup, currentVmName, function (IP) {

                                    console.log('IP = ' + IP);

                                    if (browser == CHROME_BROWSER) {

                                        chromeXMLNodsHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodsQantity + '"/>';
                                        console.log('chromeXMLNodsHostsLines = ' + chromeXMLNodsHostsLines);
                                    } else if (browser == FIREFOX_BROWSER) {
                                        firefoxXMLNodsHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodsQantity + '"/>';
                                        console.log('chromeXMLNodsHostsLines = ' + firefoxXMLNodsHostsLines);
                                    } else if (browser == IE_BROWSER) {
                                        ie11XMLNodsHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodsQantity + '"/>';
                                    } else if (browser == EDGE_BROWSER) {
                                        edgeXMLNodsHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodsQantity + '"/>';
                                    }


                                    deployNodsServer(browser, vmQuantity - 1, machineType, callback);
                                });


                            });
                        });
                    });

                });
            });
        });
    }
}


//deploy grids vm's
function deployGridsServers(calback) {

    replace('__AZURE_REGION__', GRID_PARAMETERS_BASE, AZURE_REGION, GRID_PARAMETERS, function () {
        //deploy grid vm
        exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + GRID_TEMPLATE + '   --parameters  ' + GRID_PARAMETERS, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
        }).on('close', function () {
            if (typeof (calback) == 'function') {
                calback();
            }
        });
    });
}

//check if the resource group still exist
function checkResourceGroupExist(name, calback) {


    //run azure cli command to check if the resource group exist
    exec('az group exists -n ' + name, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
        }
        //console.log(stdout);
        resourceGroupExist = stdout.toString();

    }).on('close', function () {
        if (resourceGroupExist.trim() == 'true') {
            console.log('THE RESOURCE GROUP IS EXIST. STOPING THE DEPLOYMENT!!!');
        } else {
            console.log('THE RESOURCE GROUP STILL NOT EXIST.');
        }
        if (typeof (calback) == 'function') {
            calback();
        }
    });
}

//checkResourceGroupExist(resourceGroup);

function calcServersByNods(calback) {
    //check wich vm's need for chrome browser
    bigChromeServer = parseInt(chromeNodsQuantity / BIG_MACHINE_MAX_NODS);
    var temp = chromeNodsQuantity % BIG_MACHINE_MAX_NODS;
    if (temp > SMALL_MACHINE_MAX_NODS) {
        bigChromeServer++;
    } else {
        smallChromeServer = 1;
    }

    //check wich vm's need for firefox browser
    bigFirefoxServer = parseInt(firefoxNodsQuantity / BIG_MACHINE_MAX_NODS);
    temp = firefoxNodsQuantity % BIG_MACHINE_MAX_NODS;
    if (temp > SMALL_MACHINE_MAX_NODS) {
        bigFirefoxServer++;
    } else {
        smallFirefoxServer = 1;
    }

    bigEdgeServer = edgeNodsQuantity;
    bigIE11Server = ie11NodsQuantity;

    console.log('bigChromeServer = ' + bigChromeServer);
    console.log('bigFirefoxServer = ' + bigFirefoxServer);

    calback();
}

function main() {
    console.log('action = ' + action);
    switch (action) {

        case ACTION_NODS_DEPLOY:
            calcServersByNods(function () {
                //deploy chrome nod's server 
                deployNodsServer(CHROME_BROWSER, bigChromeServer, BIG_NODES_SERVER, function () {
                    deployNodsServer(CHROME_BROWSER, smallChromeServer, SMALL_NODES_SERVER, function () {
                        deployNodsServer(FIREFOX_BROWSER, bigFirefoxServer, BIG_NODES_SERVER, function () {
                            deployNodsServer(FIREFOX_BROWSER, smallFirefoxServer, SMALL_NODES_SERVER, function () {
                                deployNodsServer(EDGE_BROWSER, bigEdgeServer, EDGE_IMAGE, function () {
                                    deployNodsServer(IE_BROWSER, bigIE11Server, IE11_IMAGE, function () {

                                        console.log('Deploy nods servers DONE !!!');

                                        //add hosts information to the test.xml file
                                        replace('__CHROME_HOSTS__', TEST_XML_BASE, chromeXMLNodsHostsLines, TEST_XML, function () {
                                            replace('__FIREFOX_HOSTS__', TEST_XML, firefoxXMLNodsHostsLines, TEST_XML, function () {
                                                replace('__EDGE_HOSTS__', TEST_XML, edgeXMLNodsHostsLines, TEST_XML, function () {
                                                    replace('__IE_HOSTS__', TEST_XML, ie11XMLNodsHostsLines, TEST_XML, function () {

                                                        //publish test.xml file
                                                        uploadFileToBlob(TEST_XML, 'controller', controllerBlobsContainerCS, function () {
                                                            var testXMLContent = fs.readFileSync(TEST_XML);
                                                            console.log('**** Finish deploy all nodes ****');
                                                            console.log('**** Servers mapping date exist in ' + TEST_XML + ' file.');
                                                            console.log('Content of test.xml file is :  ' + testXMLContent);

                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });

                            });
                        });
                    });
                });
            });
            break;

        case ACTION_GRID_DEPLOY:

            addSSHPublicKeyToTemplate(PUBLIC_KEY_PATH, GRID_TEMPLATE_BASE, GRID_TEMPLATE, function () {
                var template_file = fs.readFileSync(GRID_TEMPLATE);
                console.log('TEMPLATE = ' + template_file);
                deployGridsServers(function () {
                    console.log('Deploy grids servers DONE !!!');
                    //getVmIp()
                });
            });

            break;

        case ACTION_CREATE_RESOURCE_GROUP:
            console.log('Check if need to create the resource group...');
            checkResourceGroupExist(resourceGroup, function () {
                if (resourceGroupExist.trim() != 'true') {
                    //run azure cli command to create a resource group
                    exec('az group create --name ' + resourceGroup + ' --location ' + location, (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        console.log(stdout);
                    });
                }
            });
            break;
    }
}

// main function.
main();