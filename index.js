var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');

var github = require('octonode');
var _ = require('lodash');
var ProgressBar = require('progress');
var DecompressZip = require('decompress-zip');

module.exports = function (options) {
    var self = this;

    options = options || {};
    self.platforms = options.platforms;
    self.outputDir = path.resolve(options.outputDir);

    self.bits = options.bits || [];

    // Array of files that need to be downloaded.
    self.toDownload = [];

    self.prepare = function (readyCallback) {
        // Get an array of files to download.
        console.log('Getting urls to release binaries from the latest release.');
        var client = github.client();
        var repo = client.repo('atom/atom-shell');
        var releases = repo.releases(function (error, data, headers) {
            var latest = _.first(_.take(data, function (release) {
                // Ignore drafts and pre-releases.
                return !release.draft && !release.prerelease;
            }));

            self.toDownload = self.getUrlsForPlatforms(latest.assets);
            console.log(self.toDownload.join("\n"));
            readyCallback.call(self, self.start);
        });
    },

    self.getUrlsForPlatforms = function (assets) {
        return _.chain(assets)
            .pluck('browser_download_url')

            .filter(function (url) {

                var correctBit =
                    (_.contains(self.bits, 32) && !!url.match(/ia32/)) ||
                    (_.contains(self.bits, 64) && !!url.match(/x64/));

                // Also remove debugging symbols from the list.
                // TODO: there should be an option to download these symbols.
                var debug = url.match(/symbols/);

                // Finally sort out the platform stuff.
                var matchesPlatform = false;

                _.each(self.platforms, function (platform) {
                    if (url.match(new RegExp(platform))) {
                        matchesPlatform = true;
                        return false;
                    }
                });

                return correctBit && !debug && matchesPlatform;
            })
            .value();
    };

    self.start = function () {
        if (self.toDownload.length === 0) {
            console.log('Nothing to download!');
            return;
        }

        // Start downloading files.
        console.log('Starting to download for platforms: ' + self.platforms.join(', '));

        function nextPlatform() {
            var popped = self.toDownload.pop();

            if (popped) {
                self.downloadUrl(popped, nextPlatform);
            } else {
                return;
            }
        }

        nextPlatform();
    };

    self.downloadUrl = function (url, callback) {
        var fname = _.last(url.split('/'));
        var outpath = path.join(self.outputDir, fname);

        // Check if we already have the file.
        if (fs.existsSync(outpath)) {
            console.log(fname + ' is already downloaded!');
            self.extract(fname, outpath)
            callback();
            return;
        }

        console.log('Downloading ' + fname);
        console.log(); // some space for the bar.

        var bar = new ProgressBar('Downloading [:bar] :percent - elapsed: :elapsed s', {
            total : 100
        });

        // This has a few issues.
        // * It won't run on Windows (unless they've got Cygwin or something).
        // * Error messages are ignored because we're only looking for percentages.
        // * Because of the above point, bad things can happen silently.
        // ~> We could perhaps use Http.get from node core.
        // ~> Or stick with this until it breaks on someone. (Sorry to you).
        var download = spawn('wget', [url, '-P', self.outputDir]);
        var logProgress = false;

        download.stderr.on('data', function (data) { // wget outputs to stderr
            data = data.toString();

            // wget logs out some stuff about following 302's. Need to try and ignore
            // this. The last message before the percentages start is 'Saving to:'.
            if (!logProgress) {
                var match = data.match(/saving to: \S+/i);

                if (match) {
                    logProgress = true;
                }
            } else {
                var match = data.match(/\d+%/);
                var percent = parseInt(_.first(match), 10) / 100 || 0;

                if (percent && !isNaN(percent)) {
                    bar.update(percent);
                }
            }
        });

        download.on('close', function (code) {
            var status = code === 0 ? 'good' : 'error';
            console.log('Done (Status: ' + status + ') - moving on.');
            self.extract(fname, outpath);
            callback();
        });
    };

    self.extract = function (fname, zipPath) {
        console.log('Extracting ' + fname);

        var extractPath = path.join(self.outputDir, self.removeExt(fname));

        // Do that dirty deed!
        var unzipper = new DecompressZip(zipPath)
            .on('extract', function (log) {
                console.log('Extracted ' + fname);
            }).on('error', function (error) {
                console.log('ERR: ' + error);
            }).extract({
                path : extractPath,
                follow : false,
                filter : function (file) {
                    return file.type !== 'SymbolicLink';
                }
            });
    };

    self.removeExt = function (name) {
        // Remove stuff from name.
        return name
            // .zip
            .replace(/\.zip$/, '')
            // ia32 => 32
            .replace(/ia32$/, '32')
            // x64 => 64
            .replace(/x64$/, '64')
            // atom-shell-v0.13.3
            .replace(/^atom\-shell\-v\d+\.\d+\.\d+\-/, '');
    };
}
