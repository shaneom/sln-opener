module.exports.getValidVsPath = function() {
    var fs = require('fs');
    var readline = require('readline')
    var nconf = require('nconf');
    var vsPath;

    nconf.use('file', { file: './config.json' });
    vsPath =  nconf.get('config:vsPath');
    
    if ( vsPath === "") {
        let ui = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        ui.question('Please enter the path to your visual studio. ', function(path) {
            if (fs.existsSync(`${path}\\devenv.exe`)) {
                nconf.set('config:vsPath', path);                
                nconf.save();
                console.log("Your visual studio path was saved.  Please type 'so' to open your solution.")
            }
            else {
                console.log(`The visual studio executable '${path}\\devenv.exe' does not exist.  Please ensure you give the correct path to your visual studio instance.`)
            }
            ui.close();
        });
    }

    return vsPath;
}

module.exports.getSolutions = function() {
    const fs = require('fs');
    const path = require("path");
    var solutions = [];

    var slnExtention = function (element) {
        var extName = path.extname(element);
        return extName === '.sln';
    };

    var data = fs.readdirSync(process.cwd());    
    data.filter(slnExtention).forEach(function(value) {
        solutions.push(value);
    });

    return solutions;
}