'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');

//construct our logic, to handle multiple instances
module.exports = function(dataType) {

	var util = {};
	var api = {};

	util.data = {
		contents: '',
		dir: path.resolve(__dirname, 'data'),
		filename: 'rows.json',
		type: '',
		rows: []
	};

	util.reset = function() {
		util.data.contents = '';
		util.data.type = '';
		util.data.rows = [];
	};

	util.safeStr = function(str) {
		return str.toLowerCase();
	};

	util.timestamp = function() {
		return new Date().getTime();
	};

	util.write = function(data) {
		//writes data to a temporary file; then renames to final data file
		//mechanism can give reads heads up on soft/hard data writes

		//use data if passed, otherwise, use internal contents that may be updated
		if (data) {
			util.data.contents = JSON.stringify(data);
		}

		/* start write */
		var filedir = path.resolve(util.data.dir, util.data.type, `writing-${util.timestamp()}`);
		var filepath = path.resolve(filedir, util.data.filename);
		fs.mkdirSync(filedir);
		fs.writeFileSync(filepath, util.data.contents, 'utf8');

		/* finish write */
		var finalFilepath = path.resolve(util.data.dir, util.data.type, util.data.filename);
		fs.renameSync(filepath, finalFilepath);

		/* cleanup */
		fs.rmdirSync(filedir);

		return this;
	};

	util.writeRows = function() {
		//small helper that invokes write. typically used when we alter
		//util.data.rows, and then call this to persist changes.

		util.data.contents = JSON.stringify({ rows: util.data.rows });
		util.write();
		return this;
	};

	util.init = function() {

		//making sure we can error-free load and read dataType data
		util.reset();
		util.data.type = util.safeStr(dataType);
		var filepath = path.resolve(util.data.dir, util.data.type, util.data.filename);
		try {
			util.data.contents = fs.readFileSync(filepath, 'utf8');
			var data = JSON.parse(util.data.contents);
			util.data.rows = data.rows;
		}
		catch(err) { 
			util.data.rows = [];
			util.data.contents = JSON.stringify({ rows: util.data.rows });
			fs.mkdirSync(path.dirname(filepath));
			fs.writeFileSync(filepath, util.data.contents, 'utf8');
		}

	};

	api.read = function() {
		
		//returning rows for dataType
		return util.data.rows;

	};

	api.saveItem = function(item) {

		//simply appending item to data
		util.data.rows.push(item);
		return util.writeRows();

	};

	api.saveItems = function() {

		//batch appending items onto data
		for (var i in arguments) {
			util.data.rows.push(arguments[i]);
		}
		return util.writeRows();

	};

	api.makeEmpty = function() {

		//completely removing all data in our dataType
		util.data.rows = [];
		return util.writeRows();

	};

	api.where = function(predicate) {

		//returns all matching items to properties or predicate
		try {
			return _.filter(util.data.rows, predicate);	
		}
		catch(err) {
			return [];
		}

	};

	api.findWhere = function(predicate) {

		//returns one item matching our properties or predicate
		try {
			var items = _.filter(util.data.rows, predicate);
			return items[0];
		} 
		catch(err) {
			return {};
		}

	}

	api.deleteWhere = function(predicate) {

		//removes all items matching our properties or predicate
		try {

			//first find our rows to delete
			var rowsToDelete = _.filter(util.data.rows, predicate);	
		
			//then reconcile our rows and write what's remaining
			util.data.rows = _.difference(util.data.rows, rowsToDelete);
			return util.writeRows();
		}
		catch(err) {
			return this;
		}

	};

	api.keepWhere = function(predicate) {

		//keeps all items matching our properties or predicate
		try {
			util.data.rows = _.filter(util.data.rows, predicate);
			return util.writeRows();
		}
		catch(err) {
			return this;
		}

	};

	api.updateWhere = function(properties, updatedValues) {

		//update any row where its properties match
		util.data.rows = _.map(util.data.rows, function(row) {
			if (_.findWhere([row], properties || {})) {
				row = _.extend(row, updatedValues);
			}
			return row;
		});
		return util.writeRows();

	};

	util.init();

	return api; 

};
