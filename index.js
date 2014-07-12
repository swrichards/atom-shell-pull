var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');

var github = require('octonode');
var _ = require('lodash');
var ProgressBar = require('progress');

module.exports = function (options) {
    var self = this;

    self.version = options.version;
    self.platforms = options.platforms;
    self.outputDir = path.resolve(options.outputDir);
    self.toDownload = [];

    self.prepare = function (readyCallback) {
        // Get an array of files to download.
        console.log('Getting urls to release binaries.');
        var client = github.client();
        var repo = client.repo('atom/atom-shell');
        var releases = repo.releases(function (error, data, headers) {
            var latest = _.first(_.take(data, function (release) {
                // Ignore drafts and pre-releases.
                return !release.draft && !release.prerelease;
            }));

            self.toDownload = self.getUrlsForPlatforms(latest.assets);
            readyCallback.call(self, self.start);
        });
    },

    self.getUrlsForPlatforms = function (assets) {
        return _.chain(assets)
            .pluck('browser_download_url')

            .filter(function (url) {

                // 32 bit should work on 32 and 64. If you want 64 bit, send an issue. :)
                var foo = url.match(/ia32/);

                // Also remove debugging symbols from the list.
                var debug = url.match(/symbols/);

                // Finally sort out the platform stuff.
                var matchesPlatform = false;

                _.each(self.platforms, function (platform) {
                    if (url.match(new RegExp(platform))) {
                        matchesPlatform = true;
                        return false;
                    }
                });

                return foo && !debug && matchesPlatform;
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
                console.log('Finished!');
                process.exit(0);
            }
        }

        nextPlatform();
    };

    self.downloadUrl = function (url, callback) {
        var fname = _.last(url.split('/'));

        // Check if we already have the file.
        if (fs.existsSync(path.join(self.outputDir, fname))) {
            console.log(fname + ' is already downloaded!');
            callback();
            return;
        }

        console.log('Downloading ' + fname);
        console.log(); // some space for the bar.

        var bar = new ProgressBar('Downloading [:bar] :percent - elapsed: :elapsed s', {
            total : 100
        });

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
            console.log('Done (Status: ' + code + ') - moving on.');
            callback();
        });
    };
}
