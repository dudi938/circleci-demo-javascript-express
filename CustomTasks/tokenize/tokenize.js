

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
const disFilePathNew = inputArgs[2];

//description : this function replace tokens thay are in this convention __key__ to value from othe json file
//parm : distFilePath - this file have the key's to replace
//parm : srcFilePath - this file have the value's to replace the key's
//parm : disFilePathNew - path to the new file with the new values
module.exports.tokensReplacer = function(disFilePath, sourceFilePath, disFilePathNew){
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
                            console.log('**Replace**  ' + 'value: ' + value + ' <=>  token: ' + token + '   new value => ' + srcFileContentJson[0][value]);
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
    
            fs.writeFileSync(disFilePathNew, targetTemplate);              
            });
    
    }));
}

//description : this function replace tokens thay are in this convention __key__ to one value
//parm : distFilePath - this file have the key's to replace
//parm : newValue - new value to put for any token
//parm : disFilePathNew - path to the new file with the new values
module.exports.tokens2value = function(disFilePath, newValue, disFilePathNew){

    console.log('disFilePath = ' + disFilePath);
    console.log('disFilePathNew = ' + disFilePathNew);
    console.log('newValue = ' + newValue);

    //read destination to replace file 
    JSON.stringify(fs.readFile(disFilePath,{encoding: "utf8"}, function(err, content){
        template = content;
        console.log('content  = ' + content);   
                //replace all tokens
            var targetTemplate = template.replace(regExp, newValue);
            //console.log('************************\r\n\r\n targetTemplate new  = ' + targetTemplate);   
            fs.writeFileSync(disFilePathNew, targetTemplate);              
    
    }));
}
    


//description : this function replace value to new value
//parm : distFilePath - this file have the key's to replace
//parm : newValue - new value to put for any token
//parm : disFilePathNew - path to the new file with the new values
module.exports.replace = function(valueToReplace ,disFilePath, newValue, disFilePathNew, callback){
    
        console.log('valueToReplace = ' + valueToReplace);
        console.log('disFilePath = ' + disFilePath);
        console.log('newValue = ' + newValue);
        console.log('disFilePathNew = ' + disFilePathNew);
    
        //read destination to replace file 
        JSON.stringify(fs.readFile(disFilePath,{encoding: "utf8"}, function(err, content){
            template = content;


            if(err){
                console.log(err);
                return;
            }

            //replace all tokens
            var targetTemplate = template.replace(valueToReplace, newValue);
            console.log('************************\r\n\r\n targetTemplate new  = ' + targetTemplate);   
            fs.writeFileSync(disFilePathNew, targetTemplate);              
            callback();
        }));

        

    }
        


