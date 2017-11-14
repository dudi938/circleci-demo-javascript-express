
var tokenReplacer = require('../tokenize/tokenize.js');

var inputArgs = process.argv.slice(2);

var resourceGroup = inputArgs[0]; 
var deployType = inputArgs[1]; 
var gridsCuantity = inputArgs[2]; 
var firefoxNodsCuantity = inputArgs[3]; 
var chromeNodsCuantity = inputArgs[4]; 
var edgeNodsCuantity = inputArgs[5]; 
var templatePath = inputArgs[6]; 
var parameterPath = inputArgs[7]; 


console.log('*********************Deployment task**********************');
console.log('resourceGroup ' + resourceGroup);
console.log('deployType ' + deployType);
console.log('gridsCuantity ' + gridsCuantity);
console.log('firefoxNodsCuantity ' + firefoxNodsCuantity);
console.log('chromeNodsCuantity ' + chromeNodsCuantity);
console.log('edgeNodsCuantity ' + edgeNodsCuantity);
console.log('templatePath ' + templatePath);
console.log('parameterPath ' + parameterPath);





tokenReplacer(parameterPath, );
