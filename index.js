'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var crypto = require('crypto');
var exec = require('child_process').execSync;


//important: resolving our data directory from the start
var pwd = process.env.PWD || '';
var datapath = path.resolve(pwd !== '' ? pwd : __dirname, 'data');

//construct our logic, to handle multiple instances
module.exports = function(dataType, options) {

	var util = {};
	var api = {};
	var options = options || {};
	var primaryKey = options.primaryKey || 'id';

	util.data = {
		contents: '',
		dir: datapath,
		filename: 'rows.json',
		filepath: '',
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

		exec(`mkdir -p ${filedir}`);
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

		//ensuring our rows are unique by id
		util.data.rows = _.uniq(util.data.rows, function(row) {
			return row[primaryKey];
		});

		util.data.contents = JSON.stringify({ rows: util.data.rows });
		util.write();
		return this;
	};

	util.readRows = function() {
		try {
			util.data.contents = fs.readFileSync(util.data.filepath, 'utf8');
			var data = JSON.parse(util.data.contents);
			util.data.rows = data.rows;
		}
		catch(err) { 
			util.data.rows = [];
			util.data.contents = JSON.stringify({ rows: util.data.rows });
			exec(`mkdir -p ${path.dirname(util.data.filepath)}`);
			fs.writeFileSync(util.data.filepath, util.data.contents, 'utf8');
		}
	};

	util.hash = function(str, secret) {
		return crypto.createHmac('sha256', secret || 'nosqldb')
			.update(str)
			.digest('hex');
	};

	util.newHash = function(str, secret) {
		var time = new Date().getTime();
		var random = Math.round(1000000000000 * Math.random());
		var str = time.toString() + random.toString();
		return util.hash(str);
	};

	util.ensureId = function(item) {
		//checks to see if we have an id parameter. if we do, we
		//then see if it's set to nonunique. if so, we generate
		//a new hash. if it's not, we simply accept the passed id
		//parameter. and if we don't have any id parameter, we 
		//generate a hash based on our entire item.

		if (item[primaryKey]) {
			if (item[primaryKey] === 'nonunique') {
				item[primaryKey] = util.newHash()
				return item;
			}
			return item;
		}
		else {
			var str = JSON.stringify(item);
			item[primaryKey] = util.hash(str);
			return item;
		}
	};

	util.init = function() {

		//ensure we have our data directory
		try {
			var stat = fs.statSync(datapath);
		}
		catch(err) {
			exec(`mkdir -p ${datapath}`);
		}

		//making sure we can error-free load and read dataType data
		util.reset();
		util.data.type = util.safeStr(dataType);
		util.data.filepath = path.resolve(util.data.dir, util.data.type, util.data.filename);

	};

	api.all = function() {
		
		//ensuring we freshly load our rows
		util.readRows();

		//returning rows for dataType
		return util.data.rows;

	};

	api.saveItem = function(item) {

		//ensuring we freshly load our rows
		util.readRows();

		item = util.ensureId(item);

		//simply appending item to data
		util.data.rows.push(item);
		util.writeRows();

	};

	api.saveItems = function() {

		//ensuring we freshly load our rows
		util.readRows();

		//batch appending items onto data
		for (var i in arguments) {
			var item = arguments[i];
			item = util.ensureId(item);
			util.data.rows.push(item);
		}
		util.writeRows();

	};

	//alias of saveItems
	api.create = function() {

		//ensuring we freshly load our rows
		util.readRows();

		//batch appending items onto data
		for (var i in arguments) {
			var item = arguments[i];
			item = util.ensureId(item);
			util.data.rows.push(item);
		}
		util.writeRows();

	};

	api.makeEmpty = function() {

		//completely removing all data in our dataType
		util.data.rows = [];
		util.writeRows();

	};

	api.where = function(predicate) {

		//ensuring we freshly load our rows
		util.readRows();

		//returns all matching items to predicate
		try {
			return _.filter(util.data.rows, predicate);	
		}
		catch(err) {
			return [];
		}

	};

	api.findWhere = function(predicate) {

		//ensuring we freshly load our rows
		util.readRows();

		//returns one item matching our predicate
		try {
			var items = _.filter(util.data.rows, predicate);
			return items[0];
		} 
		catch(err) {
			return {};
		}

	}

	api.deleteWhere = function(predicate) {

		//ensuring we freshly load our rows
		util.readRows();

		//removes all items matching our predicate
		try {

			//first find our rows to delete
			var rowsToDelete = _.filter(util.data.rows, predicate);	
		
			//then reconcile our rows and write what's remaining
			util.data.rows = _.difference(util.data.rows, rowsToDelete);
			util.writeRows();
		}
		catch(err) {

		}

	};

	//alis of deleteWhere
	api.delete = function(predicate) {

		//ensuring we freshly load our rows
		util.readRows();

		//removes all items matching our predicate
		try {

			//first find our rows to delete
			var rowsToDelete = _.filter(util.data.rows, predicate);	
		
			//then reconcile our rows and write what's remaining
			util.data.rows = _.difference(util.data.rows, rowsToDelete);
			util.writeRows();
		}
		catch(err) {

		}

	};

	api.keepWhere = function(predicate) {

		//ensuring we freshly load our rows
		util.readRows();

		//keeps all items matching our predicate
		try {
			util.data.rows = _.filter(util.data.rows, predicate);
			util.writeRows();
		}
		catch(err) {

		}

	};

	//alias of keepWhere
	api.keep = function(predicate) {

		//ensuring we freshly load our rows
		util.readRows();

		//keeps all items matching our predicate
		try {
			util.data.rows = _.filter(util.data.rows, predicate);
			util.writeRows();
		}
		catch(err) {

		}

	};

	api.updateWhere = function(predicate, updatedValues) {

		//ensuring we freshly load our rows
		util.readRows();

		//update any row where its predicate match
		util.data.rows = _.map(util.data.rows, function(row) {
			if (_.findWhere([row], predicate || {})) {
				row = _.extend(row, updatedValues);
			}
			return row;
		});
		util.writeRows();

	};

	//alias of updateWhere
	api.update = function(predicate, updatedValues) {

		//ensuring we freshly load our rows
		util.readRows();

		//update any row where its predicate match
		util.data.rows = _.map(util.data.rows, function(row) {
			if (_.findWhere([row], predicate || {})) {
				row = _.extend(row, updatedValues);
			}
			return row;
		});
		util.writeRows();

	};

	util.init();

	return api; 

};
