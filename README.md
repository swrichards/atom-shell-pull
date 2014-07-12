atom-shell-pull
===============

> Download the atom-shell for multiple platforms. Useful for build scripts.

Made with :heart: by Nathan McCallum under the MIT license!

Installation
============

```
npm install atom-shell-pull --save
```

Usage
=====

```javascript
var AtomShellPull = require('atom-shell-pull');

var pull = new AtomShellPull({
    outputDir : 'atom-shell-binaries',
    // Available options are 'linux', 'win32' and 'darwin'
    platforms : ['linux', 'win32']
});

pull.prepare(function (start) {
    start();
});
```

Changes
=======

###0.0.2 (Unreleased)
- Implemented extracting of the downloaded zip files.
- Remove some unnecessary dependencies and variables.
