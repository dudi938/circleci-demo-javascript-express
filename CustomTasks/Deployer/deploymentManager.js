
const { exec } = require('child_process');
var tokenReplacer = require('../tokenize/tokenize.js').tokensReplacer;
var replacer = require('../tokenize/tokenize.js').replacer;

var inputArgs = process.argv.slice(2);
//inputs
var resourceGroup = inputArgs[0]; 
var deployType = inputArgs[1]; 
var gridsCuantity = inputArgs[2]; 
var firefoxNodsCuantity = inputArgs[3]; 
var chromeNodsCuantity = inputArgs[4]; 
var edgeNodsCuantity = inputArgs[5]; 
var templatePath = inputArgs[6]; 
var parameterWithTokensPath = inputArgs[7]; 
var parameterPathNew = inputArgs[8]; 
var parameterValuesPath = inputArgs[9]; 
var location = inputArgs[10];
var app_id = inputArgs[11];
var app_key = inputArgs[12];
var tenant = inputArgs[13];


var resourceGroupExist = false;

console.log('*********************Deployment task**********************');



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

                //deploy grid vm
                exec('az group deployment create --name ExampleDeployment --resource-group  ' + resourceGroup + '  --template-file  ' + templatePath + '   --parameters  ' + parameterPathNew , (err, stdout, stderr) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log(stdout);
                    });
                });
            }
      });      
}

checkResourceGroupExist(resourceGroup);



