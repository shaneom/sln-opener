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
                
                nconf.save(function (err) {
                    fs.readFile('./config.json', function (err, data) {
                        console.dir(JSON.parse(data.toString()))
                    });
                });
            }
            else {
                console.log(`The visual studio executable ${path}\\devenv.exe does not exist.  Please ensure you give the correct path to your visual studio instance.`)
            }
            ui.close();
        });
    }

    return vsPath;    
}