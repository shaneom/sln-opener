#!/usr/bin/env node

var fs = require('fs');
var path = require("path");
var readline = require('readline')
var menu;
var menuItems = [];

function extension(element) {
  var extName = path.extname(element);
  return extName === '.sln';
};

var Registry = require('winreg'),
    regKey = new Registry({                                       // new operator is optional 
    hive: Registry.HKCR                                       // open registry hive HKEY_CURRENT_USER 
    //key:  '\\VisualStudio.DTE.15.0' // key containing autostart programs 
})
 
// list autostart programs 
regKey.values(function (err, items /* array of RegistryItem */) {
  if (err)
    console.log('ERROR: '+err);
  else
    for (var i=0; i<items.length; i++)
      console.log('ITEM: '+items[i].name+'\t'+items[i].type+'\t'+items[i].value);
});

//fs.readdir(process.cwd(), function(err, files) {    
//    files.filter(extension).forEach(function(value) {
//        menuItems.push(value);
//    });

//    if (menuItems.length === 1) {
//        openSolution(menuItems[0]);
//    }
//    else {
//        showMainMenu();
//    }
//});

function showMainMenu() {
    if (menuItems.length > 0) {
        for (var i = 0; i < menuItems.length; i++) {
            console.log(i + 1 + ". "  + menuItems[i])
        }
    }
    console.log(menuItems.length + 1 + ". Exit")

    menu = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    menu.question('Select the solution to open? ', function(input) {
        if ((input-1) < menuItems.length) {
            openSolution(menuItems[input-1])
        } else {
            process.exit();
        }            
    });
}

function openSolution(solution) {
    const execFile = require('child_process').execFile;
    const child = execFile(process.env['ProgramFiles(x86)'] + '\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\IDE\\devenv.exe ', [ solution ], (error, stdout, stderr) => {
        if (error) { throw error; }        
        if(menu) menu.close();
    });
}