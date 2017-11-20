
const { exec } = require('child_process');
var tokenReplacer = require('../tokenize/tokenize.js').tokensReplacer;
var tokens2value = require('../tokenize/tokenize.js').tokens2value;
var replace = require('../tokenize/tokenize.js').replace;


var inputArgs = process.argv.slice(2);
//inputs
var resourceGroup = inputArgs[0]; 
var deployType = inputArgs[1]; 
var gridsQuantity = inputArgs[2]; 
var firefoxNodsQuantity = inputArgs[3]; 
var chromeNodsQuantity = inputArgs[4]; 
var edgeNodsQuantity = inputArgs[5]; 
var location = inputArgs[6];
var app_id = inputArgs[7];
var app_key = inputArgs[8];
var tenant = inputArgs[9];


var bigChromeServer;
var smallChromeServer;
var bigFirefoxServer;
var smallFirefoxServer;

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



var resourceGroupExist = false;

console.log('*********************Deployment task**********************');



function deployNodsServer(browser, vmQuantity, machineType){

    if(vmQuantity === 0){
        return;
    }else{
        //replace tokens
        //replace machine size in the parameters.json file
        replace('__VIRTUAL_MACHINE_SIZE__', NODE_PARAMETERS_BASE,  machineType, NODE_PARAMETERS, function(){
                console.log('********************calback tryrun*************************');
                //replace index of resource's in the parameters.json file
                tokens2value(NODE_PARAMETERS, vmQuantity, NODE_PARAMETERS, function(){

                    var memorySize;
                    if(machineType === BIG_NODES_SEVER){
                        memorySize = 15;
                    }else{
                        memorySize = 7;
                    }

                    replace('__START_UP_SCRIPT_PARAMETERS__', NODE_TEMPLATE_BASE, browser + '  ' + ' 5 ' + memorySize  , NODE_TEMPLATE, function(){

                        exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + NODE_TEMPLATE + '   --parameters  ' + NODE_PARAMETERS , (err, stdout, stderr) => {
                            
                            if(err){
                                console.log(err);
                            }
            
            
                            console.log(stdout);
                        }).on('close',function(){

                            deployNodsServer(browser, vmQuantity - 1, machineType);

                        });
                    });

            });
        });
    }
}




//check if the resource group still exist
function checkResourceGroupExist(name){


    //run azure cli command to check if the resource group exist
    exec('az group exists -n ' +  name, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(stdout);
        resourceGroupExist =  stdout;
        console.log('ResourceGroup exist =  ' + resourceGroupExist );


        if(resourceGroupExist === "true"){
            console.log('THE RESOURCE GROUP STILL EXIST.\r\n STOPING THE DEPLOYMENT!!!');
            return;
        }else{

            console.log('THE RESOURCE GROUP STILL NOT EXIST.\r\n STARTING THE DEPLOYMENT!!!');

           //run azure cli command to create a resource group
            exec('az group create --name ' + name +  ' --location ' + location , (err, stdout, stderr) => {
                if (err) {
                  console.error(err);
                  return;
                }
                console.log(stdout);

                if(deployType === 'GRID_DEPLOY'){
                        //deploy grid vm
                        exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + GRID_TEMPLATE + '   --parameters  ' + GRID_PARAMETERS , (err, stdout, stderr) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log(stdout);
                            });
                        }else{

                            //deploy grid vm


                                //check wich vm's need for chrome browser
                                bigChromeServer = chromeNodsQuantity / 10;
                                var temp = chromeNodsQuantity % 10;
                                if(temp > 4){
                                    bigChromeServer++;
                                }else{
                                    smallChromeServer = 1;
                                }

                                //check wich vm's need for firefox browser
                                bigFirefoxServer = firefoxNodsQuantity / 10;
                                temp = firefoxNodsQuantity % 10;
                                if(temp > 4){
                                    bigChromeServer++;
                                }else{
                                    smallChromeServer = 1;
                                }


                                //deploy chrome nod's server 
                                deployNodsServer('chrome', bigChromeServer, BIG_NODES_SEVER );
                                deployNodsServer('chrome', smallChromeServer, SMALL_NODES_SEVER );

                                //deploy firefox nod's server 
                                deployNodsServer('firefox', bigFirefoxServer, BIG_NODES_SEVER );
                                deployNodsServer('firefox', smallFirefoxServer, SMALL_NODES_SEVER );


                        }
                });
            }
      });      
}

//checkResourceGroupExist(resourceGroup);



deployNodsServer('chrome', 3 ,  BIG_NODES_SEVER);

