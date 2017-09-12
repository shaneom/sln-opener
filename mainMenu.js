module.exports.loadSolution = function(menuItems, vspath) {
    const readline = require('readline')

    if (menuItems.length > 0) {
        for (var i = 0; i < menuItems.length; i++) {
            console.log(i + 1 + ". "  + menuItems[i])
        }
    }
    console.log(menuItems.length + 1 + ". Exit")

    menu = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    menu.question('Select the solution to open? ', function(input) {
        let menuOption = parseInt(input);
        if (isNaN(menuOption)) {process.exit();}
        if ((menuOption-1) < menuItems.length){ 
            const execFile = require('child_process').execFile;
            const child = execFile(vspath + '\\devenv.exe ', [ menuItems[menuOption-1] ], (error, stdout, stderr) => {
                if (error) { 
                    console.log("An error occured when trying to open your solution.  Ensure that you have Visual Studio 2017 installed.")
                    console.log(error);
                }
                if(menu) menu.close();
            });
        } else {
            process.exit();            
        }
    });
}