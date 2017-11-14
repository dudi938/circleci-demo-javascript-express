//modules
var fs = require ('fs');
var path = require('path');


//variables
var disFileName = 'dist.json';
var sourceFileName = 'source.json';
var template;
var targetTemplate;
var srcFileContentJson;
var valueForToken;

var regExp = new RegExp(/__+[A-Za-z0-9-_]+__/,'g'); 


//read destination to replace file 
JSON.stringify(fs.readFile(path.join(__dirname,disFileName),{encoding: "utf8"}, function(err, content){
    template = content;

        //read source file to taks the values  
fs.readFile(path.join(__dirname,sourceFileName), {encoding: "utf8"}, function(err, content){
        srcFileContentJson = JSON.parse(content);

        //replace all tokens
        targetTemplate = template.replace(regExp, function(token){
                           
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
    });

}));


