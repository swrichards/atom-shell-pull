var ShellDownload = require('./index');

var path = require('path');

var output = path.join(__dirname, 'downloads');

var download = new ShellDownload({
    outputDir : output,
    platforms : ['linux'] // Available options are 'linux', 'win32' and 'darwin'
});

download.prepare(function () {
    this.start();
});
