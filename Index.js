#!/usr/bin/env node
const isAdmin = require('is-admin');
const config = require('./config');
const menu = require('./mainMenu');

isAdmin().then(admin => {
    if (admin) {
        startUp();
    } else {
        console.log('You need elevated permission to run this tool.  Please reload your CLI with administrative access.');
    }
});

var startUp = function() {
    let vsPath = config.getValidVsPath();
    
    if (vsPath != '') {
        let solutions = config.getSolutions();
        menu.loadSolution(solutions, vsPath);     
    }
}