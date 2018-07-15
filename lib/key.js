/*

Copyright 2018 AJ Jordan <alex@strugee.net>.

This file is part of audittool.

audittool is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or (at your
option) any later version.

audittool is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License
along with audittool. If not, see <https://www.gnu.org/licenses/>.

*/

'use strict';

var async = require('async'),
    readPackageJson = require('read-package-json');

module.exports = function buildKey(m, cb) {
		async.series([function(cb) {
			var isFile = m.startsWith('/') || m.startsWith('./') || m.startsWith('../');
			if (isFile) {
				// Avoid releasing Zalgol
				setImmediate(cb.bind(null, null, m));
			} else {
				var pkgPath = require.resolve(m + '/package.json');
				readPackageJson(pkgPath, function(err, pkg) {
					if (err) return cb(err);
					cb(null, m + '@' + pkg.version);
				});
			}
		}], cb);
};
