
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
var location = inputArgs[6];
var app_id = inputArgs[7];
var app_key = inputArgs[8];
var tenant = inputArgs[9];

//quantity of each nods server type 
var bigChromeServer=0;
var smallChromeServer=0;
var bigFirefoxServer=0;
var smallFirefoxServer=0;



//Noeds Deployed Quantity
var chromeNodesDeployed = 0;
var firefoxNodesDeployed = 0;
//Servers Deployed Quantity
var chromeServersDeployed = 0;
var firefoxServersDeployed = 0;

//VM TYPS
const BIG_NODES_SEVER = "Standard_D4s_v3";
const SMALL_NODES_SEVER = "Standard_F2s";

//ARM TEMPLATE FOR GRID'S
const GRID_TEMPLATE         = "./Templates/Grid/template.json";
const GRID_PARAMETERS_BASE  = "./Templates/Grid/parametersWithTokens.json";
const GRID_PARAMETERS       = "./Templates/Grid/parameters.json";
//ARM TEMPLATE FOR NOD'S
const NODE_TEMPLATE_BASE    = "./Templates/nods/templateWithTokens.json";
const NODE_TEMPLATE         = "./Templates/nods/template.json";
const NODE_PARAMETERS_BASE  = "./Templates/nods/parametersWithTokens.json";
const NODE_PARAMETERS       = "./Templates/nods/parameters.json";
//MACHINE_SIZE_LIMITS
const SMALL_MACHINE_MAX_NODS = 4;
const BIG_MACHINE_MAX_NODS = 10;
//BROWSER_TYPES
const CHROME_BROWSER = 'chrome';
const FIREFOX_BROWSER = 'firefox';

//action typs
const  ACTION_GRID_DEPLOY = 'GRID_DEPLOY';
const  ACTION_NODS_DEPLOY = 'NODS_DEPLOY';
const  ACTION_CREATE_RESOURCE_GROUP = 'ACTION_CREATE_RESOURCE_GROUP';

//azure region
const AZURE_REGION = 'WESTUS2';




var resourceGroupExist = new String("NULL");;

function getNextNodsQuanity(browser){
    if(browser === CHROME_BROWSER){

        if((chromeNodsQuantity - chromeNodesDeployed) > BIG_MACHINE_MAX_NODS){
            chromeNodesDeployed += BIG_MACHINE_MAX_NODS;
            return chromeNodesDeployed;
        }else{
            chromeNodesDeployed = chromeNodsQuantity - chromeNodesDeployed;
            return chromeNodesDeployed;
        }

    }else if(browser === FIREFOX_BROWSER){
        
        if((firefoxNodsQuantity - firefoxNodesDeployed) > BIG_MACHINE_MAX_NODS){
            firefoxNodesDeployed += BIG_MACHINE_MAX_NODS;
            return firefoxNodesDeployed;
        }else{
            firefoxNodesDeployed = firefoxNodsQuantity - firefoxNodesDeployed;
            return firefoxNodesDeployed;
        }
    }
}

function deployNodsServer(browser, vmQuantity, machineType, callback){

    if(vmQuantity === 0){
            callback();      
    }else{

        console.log('deploy nodes server' +  'browser = ' + browser + '. vmQuantity = ' + vmQuantity + '. machineType = ' + machineType);

        //replace tokens
        //replace machine size in the parameters.json file

        replace('__AZURE_REGION__', NODE_PARAMETERS_BASE,  AZURE_REGION, NODE_PARAMETERS, function(){
            replace('__VIRTUAL_MACHINE_SIZE__', NODE_PARAMETERS_BASE,  machineType, NODE_PARAMETERS, function(){

                    var serverIndex;
                    if(browser == CHROME_BROWSER){
                        serverIndex = chromeServersDeployed;
                    }else if(browser == FIREFOX_BROWSER){
                        serverIndex = firefoxServersDeployed;
                    }

                    //replace index of resource's in the parameters.json file
                    tokens2value(NODE_PARAMETERS, '-' + browser.slice(0,3) + serverIndex, NODE_PARAMETERS, function(){


                        //calc memory size
                        var memorySize;
                        if(machineType === BIG_NODES_SEVER){
                            memorySize = 15;
                        }else{
                            memorySize = 7;
                        }


                        var currentNodsQantity = getNextNodsQuanity(browser);
                        console.log('***currentNodsQantity = '  + currentNodsQantity + '***');

                        replace('__START_UP_SCRIPT_PARAMETERS__', NODE_TEMPLATE_BASE, browser + '  ' + currentNodsQantity + '  ' + memorySize  , NODE_TEMPLATE, function(){

                            exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + NODE_TEMPLATE + '   --parameters  ' + NODE_PARAMETERS , (err, stdout, stderr) => {
                                
                                if(err){
                                    console.log(err);
                                }
                
                
                                console.log(stdout);
                            }).on('close',function(){       
                                
                                if(browser == CHROME_BROWSER){
                                    chromeServersDeployed++;
                                }else if(browser == FIREFOX_BROWSER){
                                    firefoxServersDeployed++;
                                }
                                

                                deployNodsServer(browser, vmQuantity - 1, machineType, callback);

                            });
                        });

                });
            });
    });
    }
}


//deploy grids vm's
function deployGridsServers(){  

    replace('__AZURE_REGION__', GRID_PARAMETERS_BASE,  AZURE_REGION, GRID_PARAMETERS, function(){
        //deploy grid vm
        exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + GRID_TEMPLATE + '   --parameters  ' + GRID_PARAMETERS , (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
            });  
    });
}

//check if the resource group still exist
function checkResourceGroupExist(name, calback){


    //run azure cli command to check if the resource group exist
    exec('az group exists -n ' +  name, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
        }
        //console.log(stdout);
        resourceGroupExist = stdout.toString();

      }).on('close', function(){
        if(resourceGroupExist.trim() == 'true'){
            console.log('THE RESOURCE GROUP IS EXIST. STOPING THE DEPLOYMENT!!!');            
        }else{
            console.log('THE RESOURCE GROUP STILL NOT EXIST.');        
        }
        if(typeof(calback) == 'function'){
            calback();
        }
      });  
}

//checkResourceGroupExist(resourceGroup);

function calcServersByNods(calback){
    //check wich vm's need for chrome browser
    bigChromeServer = parseInt(chromeNodsQuantity / BIG_MACHINE_MAX_NODS);
    var temp = chromeNodsQuantity % BIG_MACHINE_MAX_NODS;
    if(temp > SMALL_MACHINE_MAX_NODS){
        bigChromeServer++;       
    }else{
        smallChromeServer = 1;
    }

    //check wich vm's need for firefox browser
    bigFirefoxServer = parseInt(firefoxNodsQuantity / BIG_MACHINE_MAX_NODS);
    temp = firefoxNodsQuantity % BIG_MACHINE_MAX_NODS;
    if(temp > SMALL_MACHINE_MAX_NODS){
        bigFirefoxServer++;
    }else{
        smallFirefoxServer = 1;
    }
    console.log('bigChromeServer = ' + bigChromeServer);
    console.log('bigFirefoxServer = ' + bigFirefoxServer);

    calback();
}

function main(){
    console.log('action = ' + action);
    switch(action){

        case ACTION_NODS_DEPLOY:       
                    calcServersByNods(function(){
                        //deploy chrome nod's server 
                        deployNodsServer(CHROME_BROWSER, bigChromeServer, BIG_NODES_SEVER, function(){
                            deployNodsServer(CHROME_BROWSER, smallChromeServer, SMALL_NODES_SEVER, function(){
                                deployNodsServer(FIREFOX_BROWSER, bigFirefoxServer, BIG_NODES_SEVER, function(){
                                    deployNodsServer(FIREFOX_BROWSER, smallFirefoxServer, SMALL_NODES_SEVER, function(){
                                        console.log('Deploy nods servers DONE !!!');
                                    });                       
                                });   
                            });                                                 
                        });            
                });
        break;

        case ACTION_GRID_DEPLOY:
            deployGridsServers();
        break;

        case ACTION_CREATE_RESOURCE_GROUP:
            console.log('Check if need to create the resource group...');
            checkResourceGroupExist(resourceGroup, function(){
                if(resourceGroupExist.trim() != 'true'){
                    //run azure cli command to create a resource group
                    exec('az group create --name ' + resourceGroup +  ' --location ' + location , (err, stdout, stderr) => {
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
    

main();