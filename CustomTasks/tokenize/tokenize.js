var fs = require ('fs');
var path = require('path');




var disFileName = 'dist.json';
var sourceFileName = 'source.json';
var disFileContentJson;
var srcFileContentJson;


var regExp = new RegExp(/__+[A-Za-z0-9-_]+__/,'g'); 

var sArr = ['__COMPUTER_NAME__','__COMPUTER_PASSWORD__'];
var dArr = [];


sArr.forEach(function(cur, index){
    if(regExp.test(cur)){
        //console.log(cur + ' exist  '  + regExp.source);
    }
    else {
        //console.log( cur + '  not exist   '  + regExp.source);
    }
});

//read destination to replace file 
JSON.stringify(fs.readFile(path.join(__dirname,disFileName),{encoding: "utf8"}, function(err, content){
    disFileContentJson = content;

        //read source file to taks the values  
fs.readFile(path.join(__dirname,sourceFileName), {encoding: "utf8"}, function(err, content){
        srcFileContentJson = JSON.parse(content);
        //console.log('srcFileContentJson = ' + JSON.stringify(JSON.parse(content)[0]));



        if(regExp.test(JSON.stringify(JSON.parse(disFileContentJson)))){
            //console.log( ' exist  ');
        }
        else {
            //console.log(disFileContentJson + '  not exist   '  + regExp.source);
        }

    if(0){
        //replace all tokens
        disFileContentJson.replace(regExp, function(token){
                Object.keys(srcFileContentJson[0]).forEach(function(value, index){
                var valueForToken;
                //console.log('value = ' + value + '   token = ' + token + '   srcFileContentJson[0][value] = ' + srcFileContentJson[0][value]);
                if(value === token){
                    console.log('**match**  ' + 'value = ' + value + '   token = ' + token + '   srcFileContentJson[0][value] = ' + srcFileContentJson[0][value]);
                    valueForToken = srcFileContentJson[0][value];      
                }
                if(valueForToken){
                    console.log('valueForToken = ' + valueForToken);
                    return valueForToken;
                }
            })
        });
    }else{
          //replace all tokens
          disFileContentJson.replace(regExp,'blabla');
          console.log('************************\r\n\r\n' + 'disFileContentJson type is: ' + typeof(disFileContentJson) +  '   disFileContentJson new  = ' + disFileContentJson);
    }
    //console.log('************************\r\n\r\n disFileContentJson new  = ' + disFileContentJson);
    });

}));
