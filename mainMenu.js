module.exports.loadSolution = function(menuItems, vspath) {
    const readline = require('readline');
    const isAdmin = require('is-admin');
    let menu = null;

    isAdmin().then(admin => {
        if (admin) {
            createMenu();
        } else {
            console.log('You need elevated permission to run this tool.  Please reload your CLI with administrative access.');
        }
    });

    var createMenu = function () {
        if (menuItems.length > 0) {
            for (var i = 0; i < menuItems.length; i++) {
                console.log(i + 1 + '. '  + menuItems[i]);
            }
        }
        console.log(menuItems.length + 1 + '. Exit');

        menu = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        menu.question('Select the solution to open? ', function(input) {
            let menuOption = parseInt(input);
            if (isNaN(menuOption)) {process.exit();}
            if ((menuOption-1) < menuItems.length){ 
                const execFile = require('child_process').execFile;
                execFile(vspath + '\\devenv.exe ', [ menuItems[menuOption-1] ], (error) => {
                    if (error) { 
                        console.log('An error occured when trying to open your solution.  Ensure that you have Visual Studio 2017 installed.');
                        console.log(error);
                    }
                    if(menu) menu.close();
                });
            } else {
                process.exit();            
            }
        });
    }
};