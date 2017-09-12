#!/usr/bin/env node
(function () {
    const config = require('./config');
    const menu = require('./mainMenu');

    var vsPath = config.getValidVsPath();
    
    if (vsPath != "")
    {
        var solutions = config.getSolutions();
        menu.loadSolution(solutions, vsPath);     
    }
}());