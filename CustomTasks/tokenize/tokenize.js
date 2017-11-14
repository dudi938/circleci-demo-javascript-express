

//modules
var fs = require ('fs');
var path = require('path');


//variables
var template;
var targetTemplate;
var srcFileContentJson;
var regExp = new RegExp(/__+[A-Za-z0-9-_]+__/,'g'); 
var inputArgs = process.argv.slice(2);
const sourceFilePath = inputArgs[1];
const disFilePath = inputArgs[0];


//description : this function replace tokens thay are in this convention __key__
//parm : distFilePath - this file have the key's to replace
//parm : srcFilePath - this file have the value's to replace the key's
module.exports = function(disFilePath, sourceFilePath){
    console.log('sourceFilePath = ' + sourceFilePath);
    console.log('disFilePath = ' + disFilePath);
    
    //read destination to replace file 
    JSON.stringify(fs.readFile(disFilePath,{encoding: "utf8"}, function(err, content){
        template = content;
    
            //read source file to taks the values  
        fs.readFile(sourceFilePath, {encoding: "utf8"}, function(err, content){
                srcFileContentJson = JSON.parse(content);
    
                //replace all tokens
                targetTemplate = template.replace(regExp, function(token){
                        var valueForToken;   
                        Object.keys(srcFileContentJson[0]).forEach(function(value, index){
                            
                        if(value === token){
                            console.log('**match**  ' + 'value = ' + value + '   token = ' + token + '   srcFileContentJson[0][value] = ' + srcFileContentJson[0][value]);
                            valueForToken = srcFileContentJson[0][value];  
                            return;    
                        }
                        if(valueForToken !== undefined){
                            console.log('valueForToken = ' + valueForToken + '    type is ' + typeof(valueForToken));                               
                        }
                        
                    })
                    return valueForToken;
                });
            console.log('************************\r\n\r\n targetTemplate new  = ' + targetTemplate);
    
            fs.writeFileSync(disFilePath, targetTemplate);          
    
    
            });
    
    }));
}


//replaceTokens(disFilePath, sourceFilePath);

//module.exports.replaceToken = replaceTokens;