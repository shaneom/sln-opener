#!/usr/bin/env node
'use strict';

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

    showMainMenu();
});

function showMainMenu() {
    if (menuItems.length > 0) {
        for (var i = 0; i < menuItems.length; i++) {
            console.log(i + 1 + ". "  + menuItems[i])
        }
    }
    console.log(menuItems.length + 1 + ". Exit")

    //Creates a readline Interface instance
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

