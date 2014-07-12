var AtomShellPull = require('./index');

var pull = new AtomShellPull({
    outputDir : 'downloads',
    platforms : ['linux', 'win32'] // Available options are 'linux', 'win32' and 'darwin'
});

pull.prepare(function (start) {
    start();
});
