atom-shell-pull
===============

> Download the atom-shell for multiple platforms. Useful for build scripts.

Made with :heart: by Nathan McCallum under the MIT license!

Installation
============

```
npm install atom-shell-pull --save-dev
```

Usage
=====

```javascript
var AtomShellPull = require('atom-shell-pull');

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

```

Changes
=======

###0.1.0 (2014-07-13)
- Started the changes log.
- Implemented extracting of the downloaded zip files.
- Remove some unnecessary dependencies and variables.
- Can now download 32 or 64 bit binaries - or both.

###0.0.1 (2014-07-12)
- Initial version. :octocat:
