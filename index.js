var path = require('path');

var github = require('octonode');
var _ = require('lodash');
var spawn = require('child_process').spawn;

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
            readyCallback.call(self);
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

        // var download = wget.download(_.first(self.toDownload), self.outputDir, {});
        // download.on('error', function (error) {
        //     console.log(error);
        // });

        // download.on('end', function (output) {
        //     console.log(output);
        // });

        // download.on('progress', function (progress) {
        //     console.log(progress);
        // });

        // This is unsafe - yolo!
        var download = spawn('wget', [_.first(self.toDownload), '-P', self.outputDir]);
        // For some reason all the status updates are sent to stderr.
        download.stderr.on('data', function (data) {
            // Find the percent values and put 'em into our progress bar.
            // TODO!
            // .. 37%
        });
        download.on('close', function (code) {
            console.log('Download ended with code ' + code);
        });
    };

}
