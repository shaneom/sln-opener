#!/usr/bin/env node

const config = require('./config');
const menu = require('./mainMenu');

let vsPath = config.getValidVsPath();

if (vsPath != '')
{
    let solutions = config.getSolutions();
    menu.loadSolution(solutions, vsPath);     
}