#!/usr/bin/env node
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

var fs = require('fs'),
    inquirer = require('inquirer'),
    mdeps = require('module-deps'),
    through2 = require('through2'),
    builtins = require('builtins'),
    // XXX replace require.resolve() with this
    resolve = require('resolve'),
    write = require('./lib/write'),
    key = require('./lib/key'),
    argv = process.argv,
    cmd = argv[2];

if (typeof cmd === 'undefined') {
	process.exitCode = 1;
	console.error('audittool: need an action');
}

switch (cmd) {
case 'init':
	// XXX check for existing audit-lock.json
	var audit = {
		auditlockVersion: 0,
		nodeVersion: process.versions.node,
		entrypoints: [],
		modules: {
			origins: []
		}
	};

	var data = JSON.stringify(audit, null, 2) + '\n';
	fs.writeFile('audit-lock.json', data, function(err) {
		if (err) throw err;
		console.log('Initialized new audit project in audit-lock.json.');
	});
	break;
case 'add':
	// XXX make it so we don't have to be in the same dir
	try {
		var audit = require('./audit-lock.json');
	} catch (e) {
		switch (e.name) {
		case 'SyntaxError':
			// We do this dumb thing because JSON.parse SyntaxErrors include the full fs path and that's ugly
			var msg = e.message.split(':')[1].slice(1);
			console.error('audittool: audit-lock.json: ' + msg);
			return;
		default:
			// XXX recognize more error types
			throw e;
		}
	}

	inquirer.prompt([
		// XXX prompt for the type to add here
		{
			type: 'string',
			message: 'What module/file do you want to add?',
			name: 'module',
			validate: function(m) {
				if (require.resolve(m) === m) return m + ' is a builtin module';
				if (audit.modules.origins.includes(m)) return m + ' is already included as an origin module';
				return true;
			}
		}
	]).then(function(res) {
		var m = res.module;

		// XXX do we need special flags?
		// XXX NODE_PATH behavior? See opts.paths
		var md = mdeps({
			filter: function(id) {
				return !builtins(audit.nodeVersion).includes(id);
			},
			resolve: resolve
		});
		md.pipe(through2.obj(function(dep) {
			//console.log(dep);
		}));
		md.end(require.resolve(m));
	}).catch(function(err) {
		throw err;
	});
}
