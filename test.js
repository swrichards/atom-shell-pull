var AtomShellPull = require('./index');

var pull = new AtomShellPull({
    outputDir : 'downloads',
     // Available options are 'linux', 'win32' and 'darwin'
    platforms : ['linux', 'win32'],
    // Weather to download ia32 or x64 - or both.
    bits : [32, 64]
});

pull.prepare(function (start) {
    start();
});
