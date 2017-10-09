module.exports.loadSolution = function(menuItems, vspath) {
    const readline = require('readline');
    let menu = null;

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
            const {spawn} = require("child_process");
            const subprocess = spawn(vspath + '\\devenv.exe ', [ menuItems[menuOption-1] ], {
                detached: true,
                stdio: 'ignore'
            });
            subprocess.unref();
            if(menu) menu.close();
        } else {
            process.exit();            
        }
    });
};