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

fs.readdir(process.cwd(), function(err, files) {    
    files.filter(extension).forEach(function(value) {
        menuItems.push(value);
    });

    if (menuItems.length === 1) {
        openSolution(menuItems[0]);
    }
    else {
        showMainMenu();
    }
});

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
        let menuOption = parseInt(input);
        if (isNaN(menuOption)) {process.exit();}
        if ((menuOption-1) < menuItems.length){
            openSolution(menuItems[menuOption-1])
        } else {
            process.exit();            
        }
    });
}

function openSolution(solution) {
    const execFile = require('child_process').execFile;
    const child = execFile(process.env['ProgramFiles(x86)'] + '\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\IDE\\devenv.exe ', [ solution ], (error, stdout, stderr) => {
        if (error) { 
            console.log("An error occured when trying to open your solution.  Ensure that you have Visual Studio 2017 installed.")
         }
        if(menu) menu.close();
    });
}