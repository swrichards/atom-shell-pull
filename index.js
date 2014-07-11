var path = require('path');

var github = require('octonode');
var _ = require('lodash');

module.exports = function (options) {
    var self = this;

    self.version = options.version;
    self.platforms = options.platforms;
    self.outputDir = path.join(process.cwd(), options.outputDir);
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

            // 32 bit should work on 32 and 64. If you want 64 bit, send an issue. :)
            // Also remove debugging symbols from the list.
            .filter(function (url) {
                var foo = url.match(/ia32/);
                var debug = url.match(/symbols/);
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

        var downloaded = 0;
        _.each(self.toDownload, function (url) {
            console.log('Downloading ' + _.last(url.split('/')))

            // TODO!

            downloaded += 1;
        });

        console.log('Finished downloading ' + downloaded + ' binaries.');
    };

}
