#!/usr/bin/env node
(function () {
    var vsPath = require('./config');
    var solution = require('./solutions');
    var Result = vsPath.getValidVsPath();
    var menuItems = solution.getSolutions();

    if (menuItems.length === 1) {
        console.log(menuItems);
        //openSolution(path, menuItems[0]);
    }
    else {
        console.log(menuItems);
        //showMainMenu(path);
    }
}());
