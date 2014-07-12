atom-shell-pull
===============

> Download the atom-shell for multiple platforms. Useful for build scripts.

Installation
============

```
npm install atom-shell-pull --save
```

Usage
=====

```javascript
var AtomShellDownload = require('atom-shell-pull');

var download = new AtomShellDownload({
    outputDir : 'atom-shell-binaries',
    // Available options are 'linux', 'win32' and 'darwin'
    platforms : ['linux', 'win32']
});

download.prepare(function (start) {
    start();
});
```

Made with :heart: by Nathan McCallum under the MIT license!
