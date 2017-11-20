
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

//quantity of each nods server type 
var bigChromeServer=0;
var smallChromeServer=0;
var bigFirefoxServer=0;
var smallFirefoxServer=0;


//Noeds Deployed Quantity
var chromeNodesDeployed = 0;
var firefoxNodesDeployed = 0;

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


var resourceGroupExist = false;

console.log('*********************Deployment task**********************');

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
        
        if((chromeNodsQuantity - firefoxNodesDeployed) > BIG_MACHINE_MAX_NODS){
            firefoxNodesDeployed += BIG_MACHINE_MAX_NODS;
            return firefoxNodesDeployed;
        }else{
            firefoxNodesDeployed = chromeNodsQuantity - firefoxNodesDeployed;
            return firefoxNodesDeployed;
        }
    }
}

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
                                bigChromeServer = parseInt(chromeNodsQuantity / BIG_MACHINE_MAX_NODS);
                                var temp = chromeNodsQuantity % BIG_MACHINE_MAX_NODS;
                                if(temp > SMALL_MACHINE_MAX_NODS){
                                    bigChromeServer++;

                                    var tempOby;
                                    chromeNoedsQuantityPerEachBigServer = Array.from(tempOby).fill(BIG_MACHINE_MAX_NODS,0,bigChromeServer);
                                    chromeNoedsQuantityPerEachBigServer.push(temp);
                                    
                                }else{
                                    smallChromeServer = 1;
                                }

                                //check wich vm's need for firefox browser
                                bigFirefoxServer = parseInt(firefoxNodsQuantity / BIG_MACHINE_MAX_NODS);
                                temp = firefoxNodsQuantity % BIG_MACHINE_MAX_NODS;
                                if(temp > SMALL_MACHINE_MAX_NODS){
                                    bigChromeServer++;
                                }else{
                                    smallChromeServer = 1;
                                }


                                //deploy chrome nod's server 
                                if(bigChromeServer > 0){
                                    deployNodsServer(CHROME_BROWSER, bigChromeServer, BIG_NODES_SEVER );
                                }
                                if(smallChromeServer > 0){
                                    deployNodsServer(CHROME_BROWSER, smallChromeServer, SMALL_NODES_SEVER );
                                }


                                //deploy firefox nod's server 
                                if(bigFirefoxServer > 0){
                                    deployNodsServer(FIREFOX_BROWSER, bigFirefoxServer, BIG_NODES_SEVER );
                                }
                                if(smallFirefoxServer > 0){
                                    deployNodsServer(FIREFOX_BROWSER, smallFirefoxServer, SMALL_NODES_SEVER );
                                }


                        }
                });
            }
      });      
}

//checkResourceGroupExist(resourceGroup);



deployNodsServer(CHROME_BROWSER, 3 ,  BIG_NODES_SEVER);



function test(){

    //check wich vm's need for chrome browser
    bigChromeServer = parseInt(chromeNodsQuantity / BIG_MACHINE_MAX_NODS);
    var temp = chromeNodsQuantity % BIG_MACHINE_MAX_NODS;
    if(temp > SMALL_MACHINE_MAX_NODS){
        bigChromeServer++;

        // var tempOby;
        // Array.from(chromeNoedsQuantityPerEachBigServer);
        var newa = chromeNoedsQuantityPerEachBigServer.fill(BIG_MACHINE_MAX_NODS,0,bigChromeServer);
        console.log('newa.length = ' + newa.length  +    '  typeof(newa) = ' + typeof(newa) +    '  newa[0] = ' + newa[0] +    '  newa[1] = ' + newa[1]);   
        
        
    }else if(temp > 0){
        smallChromeServer = 1;
    }
    console.log('typeof  chromeNoedsQuantityPerEachBigServer is  ' + typeof(chromeNoedsQuantityPerEachBigServer));
    console.log('bigChromeServer = ' + bigChromeServer);
    console.log('smallChromeServer = ' + smallChromeServer);
    console.log('chromeNoedsQuantityPerEachBigServer = ' + chromeNoedsQuantityPerEachBigServer);   


    //check wich vm's need for firefox browser
    bigFirefoxServer = firefoxNodsQuantity / BIG_MACHINE_MAX_NODS;
    temp = firefoxNodsQuantity % BIG_MACHINE_MAX_NODS;
    if(temp > SMALL_MACHINE_MAX_NODS){
        bigChromeServer++;
    }else{
        smallChromeServer = 1;
    }
}


//test();