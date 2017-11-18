
const { exec } = require('child_process');
var tokenReplacer = require('../tokenize/tokenize.js').tokensReplacer;
var replacer = require('../tokenize/tokenize.js').replacer;

var inputArgs = process.argv.slice(2);
//inputs
var resourceGroup = inputArgs[0]; 
var deployType = inputArgs[1]; 
var gridsQuantity = inputArgs[2]; 
var firefoxNodsQuantity = inputArgs[3]; 
var chromeNodsQuantity = inputArgs[4]; 
var edgeNodsQuantity = inputArgs[5]; 
var templatePath = inputArgs[6]; 
var parameterWithTokensPath = inputArgs[7]; 
var parameterPathNew = inputArgs[8]; 
var parameterValuesPath = inputArgs[9]; 
var location = inputArgs[10];
var app_id = inputArgs[11];
var app_key = inputArgs[12];
var tenant = inputArgs[13];


var bigChromeServer;
var smallChromeServer;
var bigFirefoxServer;
var smallFirefoxServer;


const BIG_NODES_SEVER = "Standard_D4s_v3";
const SMALL_NODES_SEVER = "Standard_F2s";



var resourceGroupExist = false;

console.log('*********************Deployment task**********************');


function deployNodsServer(browser, vmQuantity, machineType){
    
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


        if(resourceGroupExist === true){
            console.log('THE RESOURCE GROUP STILL EXIST.\r\n STOPING THE DEPLOYMENT!!!');
            return;
        }else{


           //run azure cli command to create a resource group
            exec('az group create --name ' + name +  ' --location ' + location , (err, stdout, stderr) => {
                if (err) {
                  console.error(err);
                  return;
                }
                console.log(stdout);

                if(deployType === 'GRID_DEPLOY'){
                        //deploy grid vm
                        exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + templatePath + '   --parameters  ' + parameterPathNew , (err, stdout, stderr) => {
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

checkResourceGroupExist(resourceGroup);



