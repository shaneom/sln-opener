module.exports.getSolutions = function() {
    var fs = require('fs');
    var path = require("path");
    var menu;
    var menuItems = [];

    var extention = function (element) {
        var extName = path.extname(element);
        return extName === '.sln';
    };
//path.extname(element) === '.sln'
    fs.readdir(process.cwd(), function(err, files) {    
        files.filter(extension).forEach(function(value) {
            menuItems.push(value);
        });    
    });
    
    return menuItems;    
}