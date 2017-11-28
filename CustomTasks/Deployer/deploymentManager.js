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
var firefoxNodesQuantity = inputArgs[3];
var chromeNodesQuantity = inputArgs[4];
var edgeNodesQuantity = inputArgs[5];
var ie11NodesQuantity = inputArgs[6];
var location = inputArgs[7];
var controllerBlobsContainerCS = inputArgs[8];
var app_id = inputArgs[9];
var app_key = inputArgs[10];
var tenant = inputArgs[11];

//quantity of each Nodes server type 
var bigChromeServer = 0;
var smallChromeServer = 0;
var bigFirefoxServer = 0;
var smallFirefoxServer = 0;
var bigEdgeServer = 0;
var bigIE11Server = 0;

//xml host lines for the grid
var chromeXMLNodesHostsLines = '';
var firefoxXMLNodesHostsLines = '';
var edgeXMLNodesHostsLines = '';
var ie11XMLNodesHostsLines = '';

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
const BIG_NODES_SERVER = "Standard_D4s_v3";//16 GB
const SMALL_NODES_SERVER = "Standard_F2s";//4 GB
const BIG_GRID_SERVER = "Standard_DS3_v2";//14 GB
const IE11_EDGE_NODES_SERVER = "Standard_D2s_v3" //8GB


const EDGE_IMAGE = "edge_image";
const IE11_IMAGE = "ie11_image";

//ARM TEMPLATE FOR GRID'S
const GRID_TEMPLATE_BASE = "./Templates/Grid/templateWithTokens.json";
const GRID_TEMPLATE = "./Templates/Grid/template.json";
const GRID_PARAMETERS_BASE = "./Templates/Grid/parametersWithTokens.json";
const GRID_PARAMETERS = "./Templates/Grid/parameters.json";
//ARM TEMPLATE FOR CHROME | FIRFOX NOD'S
const CHFIR_NODE_TEMPLATE_BASE = "./Templates/ndes/templateWithTokens.json";
const CHFIR_NODE_TEMPLATE = "./Templates/ndes/template.json";
const CHFIR_NODE_PARAMETERS_BASE = "./Templates/ndes/parametersWithTokens.json";
const CHFIR_NODE_PARAMETERS = "./Templates/ndes/parameters.json";
//ARM TEMPLATE FOR IE11 | EDGE NOD'S
const IE11_NODE_TEMPLATE_BASE = "./Templates/ndes/win10/templateWithTokens.json";
const IE11_NODE_TEMPLATE = "./Templates/ndes/win10/template.json";
const IE11_NODE_PARAMETERS_BASE = "./Templates/ndes/win10/parametersWithTokens.json";
const IE11_NODE_PARAMETERS = "./Templates/ndes/win10/parameters.json";



const GRID_IP = './grid_ip';
const PUBLIC_KEY_PATH = './sshkey.pub';
const PRIVATE_KEY_PATH = './sshkey';


//XML test  file
const TEST_XML_BASE = "./testWithTokens.xml";
const TEST_XML = "./test.xml";

//MACHINE_SIZE_LIMITS
const SMALL_MACHINE_MAX_Nodes = 4;
const BIG_MACHINE_MAX_Nodes = 10;
//BROWSER_TYPES
const CHROME_BROWSER = 'chrome';
const FIREFOX_BROWSER = 'firefox';
const EDGE_BROWSER = 'edge';
const IE_BROWSER = 'ie11';

//action typs
const ACTION_GRID_DEPLOY = 'GRID_DEPLOY';
const ACTION_Nodes_DEPLOY = 'Nodes_DEPLOY';
const ACTION_CREATE_RESOURCE_GROUP = 'ACTION_CREATE_RESOURCE_GROUP';
const RUN_REPLICATION_SET = 'RUN_REPLICATION_SET';




var resourceGroupExist = new String("NULL");


function execCommand(command, callback) {
    console.log('RUN COMMAND - ' + command);
    var output;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log(stdout);
        output = stdout;
    }).on('close', function () {
        if (typeof (callback) == 'function') {
            callback(output)
        }
    });
}


//put ssh public key on the template
function addSSHPublicKeyToTemplate(publikKeyPath, disTemplatePath, disTemplatePathNew, callback) {
    console.log('publikKeyPath = ' + publikKeyPath);
    console.log('disTemplatePath = ' + disTemplatePath);
    console.log('disTemplatePathNew = ' + disTemplatePathNew);
    fs.readFile(publikKeyPath, { encoding: "utf8" }, function (err, data) {
        if (err) {
            console.log(err);
        }
        //delete " " + "\r\n" from the string...
        //var keyArry = data.split("/r/n");
        //var key = keyArry[0] + keyArry[1] + keyArry[2]; 
        var key = data.slice(0, data.length - 3);
        console.log('New key: ' + key);
        replace('__PUBLIC_KEY__', disTemplatePath, key, disTemplatePathNew, callback);
    });
}



function uploadFileToBlob(file, container, connectionString, callback) {
    console.log('***Start upload test.xml file.......');
    var fileName = path.basename(file);

    execCommand('az storage blob upload -f ' + file + ' -c ' + container + ' -n ' + fileName + ' --connection-string ' + '"' + connectionString + '"', function () {
        if (typeof (callback) == 'function') {
            callback()
        }
    });

    //     exec('az storage blob upload -f ' + file + ' -c ' + container + ' -n ' + fileName + ' --connection-string ' + '"' + connectionString + '"', (err, stdout, stderr) => {
    //         if (err) {
    //             console.log(err);
    //         }
    //         console.log(stdout);

    //     }).on('close', function () {
    //         if (typeof (callback) == 'function') {
    //             callback()
    //         }
    //     });
}


function getNextNodesQuanity(browser) {
    if (browser === CHROME_BROWSER) {

        if ((chromeNodesQuantity - chromeNodesDeployed) > BIG_MACHINE_MAX_Nodes) {
            chromeNodesDeployed += BIG_MACHINE_MAX_Nodes;
            return chromeNodesDeployed;
        } else {
            chromeNodesDeployed = chromeNodesQuantity - chromeNodesDeployed;
            return chromeNodesDeployed;
        }

    } else if (browser === FIREFOX_BROWSER) {

        if ((firefoxNodesQuantity - firefoxNodesDeployed) > BIG_MACHINE_MAX_Nodes) {
            firefoxNodesDeployed += BIG_MACHINE_MAX_Nodes;
            return firefoxNodesDeployed;
        } else {
            firefoxNodesDeployed = firefoxNodesQuantity - firefoxNodesDeployed;
            return firefoxNodesDeployed;
        }
    }
}

function getAllIPbyResourceGroup(resourceGroup, callback) {
    var ipArr;

    execCommand('az vm list-ip-addresses  -g ' + resourceGroup, function () {
        if (typeof (callback) == 'function') {
            callback()
        }
    });

    // exec('az vm list-ip-addresses  -g ' + resourceGroup, (err, stdout, stderr) => {
    //     if (err) {
    //         console.log(err);
    //         return;
    //     }
    //     ipArr = stdout;
    //     //console.log(ipArr);
    // }).on('close', function () {
    //     if (typeof (callback) == 'function') {
    //         callback();
    //     }
    // });
}

function getVmIp(rg, vmName, callback) {
    var data;
    var myIP;
    console.log('rg = ' + rg);
    console.log('vmName = ' + vmName);


    execCommand('az vm list-ip-addresses -g ' + rg + ' -n  ' + vmName, function (data) {
        console.log(JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0]);
        myIP = JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0].ipAddress;
        if (typeof (callback) == 'function') {
            callback(myIP);
        }
    });


    // exec('az vm list-ip-addresses -g ' + rg + ' -n  ' + vmName, (err, stdout, stderr) => {
    //     if (err) {
    //         console.log(err);
    //         return;
    //     }
    //     data = stdout;
    //     console.log('data = ' + data);
    // }).on('close', function () {
    //     console.log(JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0]);
    //     myIP = JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0].ipAddress;
    //     if (typeof (calback) == 'function') {
    //         calback(myIP);
    //     }
    // });
};


function getNVmIps(rg, vmNames, calback) {
    var data;
    var ips = [];
    console.log('rg = ' + rg);
    console.log('vmNames = ' + vmNames);


    execCommand('az vm list-ip-addresses -g ' + rg + ' -n  ' + vmNames, function (data) {

        // console.log(JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0]);
        // ips = JSON.parse(data)[0].virtualMachine.network.publicIpAddresses[0].ipAddress;
        var vmArr = JSON.parse(data);
        console.log('data = ' + data);

        vmArr.array.forEach(function (element, index) {
            ips.push(element.virtualMachine.network.publicIpAddresses[0].ipAddress);
        });
        console.log(ips[0]);
        console.log(ips[1]);

        if (typeof (calback) == 'function') {
            calback(myIP);
        }
    });
};



function deployNodesServer(browser, vmQuantity, machineType, callback) {


    console.log('deploy nodes server' + 'browser = ' + browser + '. vmQuantity = ' + vmQuantity + '. machineType = ' + machineType);


    if (vmQuantity === 0) {
        console.log('vmQuantity = ' + vmQuantity);
        callback();
    } else if (browser == CHROME_BROWSER || browser == FIREFOX_BROWSER) {



        //replace tokens
        //replace machine size in the parameters.json file
                 
        replace('__AZURE_REGION__', CHFIR_NODE_PARAMETERS_BASE, location, CHFIR_NODE_PARAMETERS, function () {
            replace('__VIRTUAL_MACHINE_SIZE__', CHFIR_NODE_PARAMETERS, machineType, CHFIR_NODE_PARAMETERS, function () {
                var serverIndex;
                if (browser == CHROME_BROWSER) {
                    serverIndex = chromeServersDeployed;
                } else if (browser == FIREFOX_BROWSER) {
                    serverIndex = firefoxServersDeployed;
                }

                //replace index of resource's in the parameters.json file
                var currentVmName = 'VM-Node' + '-' + browser.slice(0, 3) + serverIndex;
                tokens2value(CHFIR_NODE_PARAMETERS, '-' + browser.slice(0, 3) + serverIndex, CHFIR_NODE_PARAMETERS, function () {


                    //calc memory size
                    var memorySize;
                    if (machineType === BIG_NODES_SERVER) {
                        memorySize = 15;
                    } else {
                        memorySize = 3;
                    }


                    var currentNodesQantity = getNextNodesQuanity(browser);
                    console.log('***currentNodesQantity = ' + currentNodesQantity + '***');

                    replace('__START_UP_SCRIPT_PARAMETERS__', CHFIR_NODE_TEMPLATE_BASE, browser + '  ' + currentNodesQantity + '  ' + memorySize, CHFIR_NODE_TEMPLATE, function () {
                        addSSHPublicKeyToTemplate(PUBLIC_KEY_PATH, CHFIR_NODE_TEMPLATE, CHFIR_NODE_TEMPLATE, function () {



                            execCommand('az group deployment create --name ' + resourceGroup + 'Deployment' + ' --resource-group  ' + resourceGroup + '  --template-file  ' + CHFIR_NODE_TEMPLATE + '   --parameters  ' + CHFIR_NODE_PARAMETERS, function () {


                                if (browser == CHROME_BROWSER) {

                                    chromeServersDeployed++;

                                } else if (browser == FIREFOX_BROWSER) {

                                    firefoxServersDeployed++;

                                }


                                getVmIp(resourceGroup, currentVmName, function (IP) {

                                    console.log('IP = ' + IP);

                                    if (browser == CHROME_BROWSER) {
                                        chromeXMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodesQantity + '"/>';
                                        console.log('chromeXMLNodesHostsLines = ' + chromeXMLNodesHostsLines);
                                    } else if (browser == FIREFOX_BROWSER) {
                                        firefoxXMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodesQantity + '"/>';
                                        console.log('chromeXMLNodesHostsLines = ' + firefoxXMLNodesHostsLines);
                                    }

                                    deployNodesServer(browser, vmQuantity - 1, machineType, callback);
                                });
                            });



                            // exec('az group deployment create --name '  +   resourceGroup  + 'Deployment' + ' --resource-group  ' + resourceGroup + '  --template-file  ' + CHFIR_NODE_TEMPLATE + '   --parameters  ' + CHFIR_NODE_PARAMETERS, (err, stdout, stderr) => {

                            //     if (err) {
                            //         console.log(err);
                            //     }


                            //     console.log(stdout);
                            // }).on('close', function () {

                            //     if (browser == CHROME_BROWSER) {

                            //         chromeServersDeployed++;
                            //     } else if (browser == FIREFOX_BROWSER) {
                            //         firefoxServersDeployed++;

                            //     } else if (browser == EDGE_BROWSER) {
                            //         edgeServersDeployed++;

                            //     } else if (browser == FIREFOX_BROWSER) {
                            //         ie11ServersDeployed++;
                            //     }

                            //     var ip;
                            //     getVmIp(resourceGroup, currentVmName, function (IP) {

                            //         console.log('IP = ' + IP);

                            //         if (browser == CHROME_BROWSER) {

                            //             chromeXMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodesQantity + '"/>';
                            //             console.log('chromeXMLNodesHostsLines = ' + chromeXMLNodesHostsLines);
                            //         } else if (browser == FIREFOX_BROWSER) {
                            //             firefoxXMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodesQantity + '"/>';
                            //             console.log('chromeXMLNodesHostsLines = ' + firefoxXMLNodesHostsLines);
                            //         } else if (browser == IE_BROWSER) {
                            //             ie11XMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodesQantity + '"/>';
                            //         } else if (browser == EDGE_BROWSER) {
                            //             edgeXMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + currentNodesQantity + '"/>';
                            //         }


                            //         deployNodesServer(browser, vmQuantity - 1, machineType, callback);
                            //     });


                            // });
                        });

                    });

                });
            });
        });
    } else if (browser == EDGE_BROWSER || browser == IE_BROWSER) { //replace tokens
        //replace machine size in the parameters.json file

        replace('__AZURE_REGION__', IE11_NODE_PARAMETERS_BASE, location, IE11_NODE_PARAMETERS, function () {
            
                var serverIndex;
                if (browser == EDGE_BROWSER) {
                    serverIndex = edgeServersDeployed;
                } else if (browser == IE_BROWSER) {
                    serverIndex = ie11ServersDeployed;
                }

                //replace index of resource's in the parameters.json file
                var currentVmName = 'VM-Node' + '-' + browser.slice(0, 3) + serverIndex;
                tokens2value(IE11_NODE_PARAMETERS, '-' + browser.slice(0, 3) + serverIndex, IE11_NODE_PARAMETERS, function () {


                    // //calc memory size
                    // var memorySize;
                    // if (machineType === BIG_NODES_SERVER) {
                    //     memorySize = 15;
                    // } else {
                    //     memorySize = 3;
                    // }

                    replace('__START_UP_SCRIPT_PARAMETERS__', IE11_NODE_TEMPLATE_BASE, browser , IE11_NODE_TEMPLATE, function () {

                            execCommand('az group deployment create --name ' + resourceGroup + 'Deployment' + ' --resource-group  ' + resourceGroup + '  --template-file  ' + IE11_NODE_TEMPLATE + '   --parameters  ' + IE11_NODE_PARAMETERS, function () {


                                if (browser == EDGE_BROWSER) {

                                    edgeServersDeployed++;

                                } else if (browser == IE_BROWSER) {

                                    ie11ServersDeployed++;

                                }


                                getVmIp(resourceGroup, currentVmName, function (IP) {

                                    console.log('IP = ' + IP);

                                    if (browser == EDGE_BROWSER) {
                                        edgeXMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + 1 + '"/>';
                                        console.log('edgeXMLNodesHostsLines = ' + edgeXMLNodesHostsLines);
                                    } else if (browser == IE_BROWSER) {
                                        ie11XMLNodesHostsLines += '<host name="' + IP + '" port="4444" count="' + 1 + '"/>';
                                        console.log('ie11XMLNodesHostsLines = ' + ie11XMLNodesHostsLines);
                                    }

                                    deployNodesServer(browser, vmQuantity - 1, machineType, callback);
                                });
                            });

                    });

                });
        });

    }
}


//deploy grids vm's
function deployGridsServers(calback) {

    replace('__AZURE_REGION__', GRID_PARAMETERS_BASE, location, GRID_PARAMETERS, function () {
        //deploy grid vm


        execCommand('az group deployment create --name ' + resourceGroup + 'Deployment' + ' --resource-group  ' + resourceGroup + '  --template-file  ' + GRID_TEMPLATE + '   --parameters  ' + GRID_PARAMETERS, function () {
            if (typeof (calback) == 'function') {
                calback();
            }

            //write grid's ip address to file
            getVmIp(resourceGroup, 'VM-Grid0', function (ip) {
                fs.appendFileSync(GRID_IP, ip + '\r\n');
                getVmIp(resourceGroup, 'VM-Grid1', function (ip) {
                    fs.appendFileSync(GRID_IP, ip + '\r\n');
                    getVmIp(resourceGroup, 'VM-Grid2', function (ip) {
                        fs.appendFileSync(GRID_IP, ip + '\r\n');
                    });
                });
            });
        });



        // exec('az group deployment create --name '  +   resourceGroup  + 'Deployment' + ' --resource-group  ' + resourceGroup + '  --template-file  ' + GRID_TEMPLATE + '   --parameters  ' + GRID_PARAMETERS, (err, stdout, stderr) => {
        //     if (err) {
        //         console.error(err);
        //         return;
        //     }
        //     console.log(stdout);
        // }).on('close', function () {
        //     if (typeof (calback) == 'function') {
        //         calback();
        //     }

        //     //write grid's ip address to file
        //     getVmIp(resourceGroup, 'VM-Grid0', function (ip) {
        //         fs.appendFileSync(GRID_IP, ip + '\r\n');
        //         getVmIp(resourceGroup, 'VM-Grid1', function (ip) {
        //             fs.appendFileSync(GRID_IP, ip + '\r\n');
        //             getVmIp(resourceGroup, 'VM-Grid2', function (ip) {
        //                 fs.appendFileSync(GRID_IP, ip + '\r\n');
        //             });
        //         });
        //     });

        // });
    });
}

//check if the resource group still exist
function checkResourceGroupExist(name, calback) {
    execCommand('az group exists -n ' + name, function (exist) {

        if (exist.toString().trim() == 'true') {
            console.log('THE RESOURCE GROUP IS EXIST. STOPING THE DEPLOYMENT!!!');
        } else {
            console.log('THE RESOURCE GROUP STILL NOT EXIST.');
        }
        if (typeof (calback) == 'function') {
            calback();
        }
    });

    // //run azure cli command to check if the resource group exist
    // exec('az group exists -n ' + name, (err, stdout, stderr) => {
    //     if (err) {
    //         console.error(err);
    //     }
    //     //console.log(stdout);
    //     resourceGroupExist = stdout.toString();

    // }).on('close', function () {
    //     if (resourceGroupExist.trim() == 'true') {
    //         console.log('THE RESOURCE GROUP IS EXIST. STOPING THE DEPLOYMENT!!!');
    //     } else {
    //         console.log('THE RESOURCE GROUP STILL NOT EXIST.');
    //     }
    //     if (typeof (calback) == 'function') {
    //         calback();
    //     }
    // });
}

//checkResourceGroupExist(resourceGroup);

function calcServersByNodes(calback) {
    //check wich vm's need for chrome browser
    bigChromeServer = parseInt(chromeNodesQuantity / BIG_MACHINE_MAX_Nodes);
    var temp = chromeNodesQuantity % BIG_MACHINE_MAX_Nodes;
    if (temp > SMALL_MACHINE_MAX_Nodes) {
        bigChromeServer++;
    } else {
        if (temp > 0) {
            smallChromeServer = 1;
        }
    }

    //check wich vm's need for firefox browser
    bigFirefoxServer = parseInt(firefoxNodesQuantity / BIG_MACHINE_MAX_Nodes);
    temp = firefoxNodesQuantity % BIG_MACHINE_MAX_Nodes;
    if (temp > SMALL_MACHINE_MAX_Nodes) {
        bigFirefoxServer++;
    } else {
        if (temp > 0) {
            smallFirefoxServer = 1;
        }
    }

    bigEdgeServer = edgeNodesQuantity;
    bigIE11Server = ie11NodesQuantity;

    console.log('bigChromeServer = ' + bigChromeServer);
    console.log('bigFirefoxServer = ' + bigFirefoxServer);

    calback();
}

function main() {
    console.log('action = ' + action);
    switch (action) {

        case ACTION_Nodes_DEPLOY:
            calcServersByNodes(function () {
                //deploy chrome nod's server 
                deployNodesServer(CHROME_BROWSER, bigChromeServer, BIG_NODES_SERVER, function () {
                    deployNodesServer(CHROME_BROWSER, smallChromeServer, SMALL_NODES_SERVER, function () {
                        deployNodesServer(FIREFOX_BROWSER, bigFirefoxServer, BIG_NODES_SERVER, function () {
                            deployNodesServer(FIREFOX_BROWSER, smallFirefoxServer, SMALL_NODES_SERVER, function () {
                                deployNodesServer(EDGE_BROWSER, bigEdgeServer, EDGE_IMAGE, function () {
                                    deployNodesServer(IE_BROWSER, bigIE11Server, IE11_IMAGE, function () {

                                        console.log('Deploy Nodes servers DONE !!!');

                                        //add hosts information to the test.xml file
                                        replace('__CHROME_HOSTS__', TEST_XML_BASE, chromeXMLNodesHostsLines, TEST_XML, function () {
                                            replace('__FIREFOX_HOSTS__', TEST_XML, firefoxXMLNodesHostsLines, TEST_XML, function () {
                                                replace('__EDGE_HOSTS__', TEST_XML, edgeXMLNodesHostsLines, TEST_XML, function () {
                                                    replace('__IE_HOSTS__', TEST_XML, ie11XMLNodesHostsLines, TEST_XML, function () {

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
                //console.log('TEMPLATE = ' + template_file);
                deployGridsServers(function () {
                    console.log('Deploy grids servers DONE !!!');
                });
            });

            break;

        case ACTION_CREATE_RESOURCE_GROUP:
            console.log('Check if need to create the resource group...');
            checkResourceGroupExist(resourceGroup, function () {
                if (resourceGroupExist.trim() != 'true') {
                    //run azure cli command to create a resource group


                    execCommand('az group create --name ' + resourceGroup + ' --location ' + location, function () {
                    });


                    // exec('az group create --name ' + resourceGroup + ' --location ' + location, (err, stdout, stderr) => {
                    //     if (err) {
                    //         console.error(err);
                    //         return;
                    //     }
                    //     console.log(stdout);
                    // });
                }
            });
            break;
        case RUN_REPLICATION_SET:

            var gridsIP = fs.readFileSync(GRID_IP).toString().split('\r\n');


            execCommand('sudo ssh -i ' + PRIVATE_KEY_PATH + '   -oStrictHostKeyChecking=no  yossis@' + gridsIP[0] + ' sh   /home/yossis/configureReplicaset.sh' + ' ' + gridsIP[0] + ' ' + gridsIP[1] + ' ' + gridsIP[2], function () {
            });

            // execCommand('sudo ssh -i ' + PRIVATE_KEY_PATH + '   -oStrictHostKeyChecking=no  yossis@' + gridsIP[0] + '  ./configureReplicaset.sh  ' + ' ' + gridsIP[0] + ' ' + gridsIP[1] + ' ' + gridsIP[2], function () {
            // });

            // exec('sudo ssh -i ' + PRIVATE_KEY_PATH + '   -oStrictHostKeyChecking=no  yossis@' + gridsIP[0] + '  ./configureReplicaset.sh  ' + ' ' + gridsIP[0] + ' ' + gridsIP[1] + ' ' + gridsIP[2], (err, stdout, stderr) => {
            //     if (err) {
            //         console.log(err);
            //         return;
            //     }
            //     console.log(stdout);
            // });
            break;
    }
}


// main function.
main();


