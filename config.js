module.exports.getValidVsPath = function() {
    const getInstalledPath = require('get-installed-path');
    const slnPath = getInstalledPath.sync('sln-opener');
    const colors = require('colors');
    let fs = require('fs');
    let readline = require('readline');
    let nconf = require('nconf');
    let configPath = slnPath + '\\config.json';
    let vsPath = '';

    nconf.use('file', { file: configPath });
    vsPath =  nconf.get('config:vsPath');

    if ( vsPath === '') {
        let ui = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        ui.question('Please enter the path to your visual studio. ', function(path) {
            if (fs.existsSync(`${path}\\devenv.exe`)) {
                nconf.set('config:vsPath', path);                
                nconf.save();
                console.log('Your visual studio path was saved.  Please type \'os\' to open your solution.'.bgGreen);
            }
            else {
                console.log(`The visual studio executable '${path}\\devenv.exe' does not exist.  Please ensure you give the correct path to your visual studio instance.`.bgRed);
            }
            ui.close();
        });
    }

    return vsPath;
};

module.exports.getSolutions = function() {
    const path = require('path');
    const recursiveReadSync = require('recursive-readdir-sync');
    var solutions = [];

    var slnExtention = function (element) {
        var extName = path.extname(element);
        return extName === '.sln';
    };

    var currentDir = process.cwd();
    var data = recursiveReadSync(currentDir);
    data.filter(slnExtention).forEach(function(value) {
        solutions.push(value);            
    });
    
    return solutions;
};