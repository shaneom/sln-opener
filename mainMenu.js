module.exports.loadSolution = function(menuItems, vspath) {
    const readline = require('readline');
    const colors = require('colors');
    let menu = null;

    if (menuItems.length > 0) {
        if (menuItems.length === 1) {
            spanSolution(1);
        } else {
            menuItems.unshift('(All)');
            for (var i = 0; i < menuItems.length; i++) {
                console.log(i + 1 + '. '  + menuItems[i]);
            }
            console.log(menuItems.length + 1 + '. Exit');
            createMenu();    
        }
    } else {
        console.log ('There are no solutions to open.'.bgRed);
    }

    function createMenu() {
        menu = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        menu.question('Select the solution to open? ', function(input) {
            let menuOption = parseInt(input);
            if (isNaN(menuOption)) {process.exit();}
            if ((menuOption-1) < menuItems.length){ 
                openSolution(menuOption);
                if(menu) menu.close();
            } else {
                process.exit();            
            }
        });
    }

    function openSolution(menuOption) {
        if (menuOption === 1) {
            for (var i = 1; i <= menuItems.length-1; i++) {
                spanSolution(i+1);
            }
        } else {
            spanSolution(menuOption);
        }
    }

    function spanSolution(menuOption) {
        const {spawn} = require('child_process');
        const subprocess = spawn(vspath + '\\devenv.exe ', [ menuItems[menuOption-1] ], {
            detached: true,
            stdio: 'ignore'
        });

        subprocess.unref();
    }
};