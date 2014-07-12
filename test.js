var AtomShellDownload = require('./index');

var download = new AtomShellDownload({
    outputDir : 'downloads',
    platforms : ['linux', 'win32'] // Available options are 'linux', 'win32' and 'darwin'
});

download.prepare(function (start) {
    start();
});
