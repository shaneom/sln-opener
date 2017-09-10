module.exports.getSolutions = function() {
    var fs = require('fs');
    var path = require("path");
    var menu;
    var menuItems = [];

    var slnExtention = function (element) {
        var extName = path.extname(element);
        return extName === '.sln';
    };

    var data = fs.readdirSync(process.cwd());    
    data.filter(slnExtention).forEach(function(value) {
        menuItems.push(value);
    });


    return menuItems;
}