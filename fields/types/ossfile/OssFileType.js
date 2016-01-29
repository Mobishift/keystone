/*!
 * Module dependencies.
 */

var fs = require('fs'),
	path = require('path'),
	_ = require('underscore'),
	moment = require('moment'),
	keystone = require('../../../'),
	util = require('util'),
	utils = require('keystone-utils'),
	super_ = require('../Type'),
	ALY = require('aliyun-sdk'),
	async = require('async');

var settings = keystone.get("settings");

/**
 * ossfile FieldType Constructor
 * @extends Field
 * @api public
 */

function ossfile(list, path, options) {
	var imageTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/bmp', 'image/x-icon', 'application/pdf', 'image/x-tiff', 'image/x-tiff', 'application/postscript', 'image/vnd.adobe.photoshop', 'image/svg+xml'];
	
	var aliyun_config = settings.ALIYUN_CONFIG || {
		accessKeyId: "",
		secretAccessKey: "",
		endpoint: "http://oss-cn-hangzhou.aliyuncs.com",
		apiVersion: '2013-10-15'
	}
	
	this._properties = ['image', ];
	
	this.oss = new ALY.OSS(utils.options(aliyun_config, options.oss_config));

    options.oss_config = _.extend(aliyun_config, options.oss_config)
    if(!options.allowedTypes && options.image) options.allowedTypes = imageTypes;

	this._underscoreMethods = ['format', 'uploadFile'];
	this._fixedSize = 'full';

	// event queues
	this._pre = {
		move: [] // Before file is moved into final destination
	};

	this._post = {
		move: [] // After file is moved into final destination
	};

	// TODO: implement filtering, usage disabled for now
	options.nofilter = true;

	// TODO: implement initial form, usage disabled for now
	if (options.initial) {
		throw new Error('Invalid Configuration\n\n' +
		'ossfile fields (' + list.key + '.' + path + ') do not currently support being used as initial fields.\n');
	}

	if (options.overwrite !== false) {
		options.overwrite = true;
	}

	ossfile.super_.call(this, list, path, options);

	// validate destination dir
	if (!options.oss_config || !options.oss_config.accessKeyId || !options.oss_config.secretAccessKey) {
		throw new Error('Invalid Configuration\n\n' +
		'ossfile fields (' + list.key + '.' + path + ') require the "oss_config.accessKeyId" and the "oss_config.secretAccessKey" option to be set.');
	}

	// Allow hook into before and after
	if (options.pre && options.pre.move) {
		this._pre.move = this._pre.move.concat(options.pre.move);
	}

	if (options.post && options.post.move) {
		this._post.move = this._post.move.concat(options.post.move);
	}

}

/*!
 * Inherit from Field
 */

util.inherits(ossfile, super_);


Object.defineProperty(ossfile.prototype, 'oss_config', { get: function() {
	return this.options.oss_config || keystone.get('oos config');
}});

/**
 * Allows you to add pre middleware after the field has been initialised
 *
 * @api public
 */

ossfile.prototype.pre = function(event, fn) {
	if (!this._pre[event]) {
		throw new Error('ossfile (' + this.list.key + '.' + this.path + ') error: ossfile.pre()\n\n' +
		'Event ' + event + ' is not supported.\n');
	}
	this._pre[event].push(fn);
	return this;
};


/**
 * Allows you to add post middleware after the field has been initialised
 *
 * @api public
 */

ossfile.prototype.post = function(event, fn) {
	if (!this._post[event]) {
		throw new Error('ossfile (' + this.list.key + '.' + this.path + ') error: ossfile.post()\n\n' +
		'Event ' + event + ' is not supported.\n');
	}
	this._post[event].push(fn);
	return this;
};


/**
 * Registers the field on the List's Mongoose Schema.
 *
 * @api public
 */

ossfile.prototype.addToSchema = function() {

	var field = this,
		schema = this.list.schema;

	var paths = this.paths = {
		// fields
		filename:		this._path.append('.filename'),
		path:			  this._path.append('.path'),
		size:			  this._path.append('.size'),
		filetype:		this._path.append('.filetype'),
		url:            this._path.append('.url'),
		// virtuals
		exists:			this._path.append('.exists'),
		upload:			this._path.append('_upload'),
		action:			this._path.append('_action'),
		order: 			this._path.append('_order'),
	};

	var schemaPaths = this._path.addTo({}, {
		filename:		String,
		path:			String,
		size:			Number,
		filetype:		String,
		url:            String
	});

	schema.add(schemaPaths);

	var exists = function(item,element_id) {
		return (item.get(field.path) ? true : false);
	};

	// The .exists virtual indicates whether a file is stored
	schema.virtual(paths.exists).get(function() {
		return schemaMethods.exists.apply(this);
	});

	var reset = function(item, element_id) {
		item.set(field.path, {
			filename: '',
			path: '',
			size: 0,
			filetype: '',
			url: ''
		});
	};

	var schemaMethods = {
		exists: function() {
			return exists(this);
		},
		/**
		 * Resets the value of the field
		 *
		 * @api public
		 */
		reset: function() {
			reset(this);
		},
		/**
		 * Deletes the file from ossfile and resets the field
		 *
		 * @api public
		 */
		remove: function(element_id) {
			if (exists(this, element_id)) {
				var values = this.get(field.path);
				var value = _.findWhere(values, { 'id': element_id });
				if (typeof value !== 'undefined') {
					field.oss.deleteObject({
						Bucket:field.options.oss_upload.Bucket,
						Key:value.filename
					},function(err,res){
						if(err) throw err;
					});
				}
			}
			reset(this, element_id);
		}
	};

	_.each(schemaMethods, function(fn, key) {
		field.underscoreMethod(key, fn);
	});

	// expose a method on the field to call schema methods
	this.apply = function(item, method) {
		return schemaMethods[method].apply(item, Array.prototype.slice.call(arguments, 2));
	};

	this.bindUnderscoreMethods();
};


/**
 * Formats the field value
 *
 * @api public
 */

ossfile.prototype.format = function(item, i) {
	if (this.hasFormatter()) {
		return this.options.format(item, item[this.path]);
	}
	return item.get(this.paths.url);
};


/**
 * Detects whether the field has a formatter function
 *
 * @api public
 */

ossfile.prototype.hasFormatter = function() {
	return 'function' === typeof this.options.format;
};



/**
 * Detects whether the field has been modified
 *
 * @api public
 */

ossfile.prototype.isModified = function(item) {
	return item.isModified(this.paths.path);
};


/**
 * Validates that a value for this field has been provided in a data object
 *
 * @api public
 */

ossfile.prototype.validateInput = function(data) {
	// TODO - how should file field input be validated?
	return true;
};


/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

ossfile.prototype.updateItem = function(item, data) {
	// TODO - direct updating of data (not via upload)
};


/**
 * Uploads the file for this field
 *
 * @api public
 */

ossfile.prototype.uploadFile = function(item, file, update, callback) {

	var field = this;

	if ('function' === typeof update) {
		callback = update;
		update = false;
	}
	
	async.map([file], function(file, processedFile) {

		var prefix = field.options.datePrefix ? moment().format(field.options.datePrefix) + '-' : '',
			object,
			filename = prefix + file.name,
			filetype = file.mimetype || file.type;

		if (field.options.allowedTypes && !_.contains(field.options.allowedTypes, filetype)) {
			return processedFile(new Error('Unsupported File Type: ' + filetype));
		}
		

		var putObject = function(donePut) {

			if ('function' === typeof field.options.filename) {
				filename = field.options.filename(item, filename);
			}
			
			
			if(!field.options.oss_upload.Bucket) throw new Error('Please define "oss_upload.Bucket"');
			var baseUrl = field.options.oss_config.endpoint.replace(/\/$/,"");
			var prefix = field.options.oss_upload.Bucket+".";
			var _path = baseUrl.indexOf("://") == -1 ? prefix+baseUrl : baseUrl.replace("://","://"+prefix);
			var url = _path + "/" + filename;
			
			fs.readFile(file.path, function (err, data) {
				
				if(err) throw err;
				
				var options = _.extend({
					Bucket: "",
					Key:filename,
					Body:data,
					ContentType: filetype,
				},field.options.oss_upload);
				
				field.oss.putObject(options,function(err,data){
					if(err) throw err;
				});
				
				
				var fileData = {
					filename: filename,
					path: _path,
					size: file.size,
					filetype: filetype,
					url:url
				};

				if (update) {
					item.set(field.path, fileData)
				}
				
				donePut(null, fileData);
			});

		};
		

		async.eachSeries(field._pre.move, function(fn, next) {
			fn(item, file, next);
		}, function(err) {
			if (err) return processedFile(err);

			putObject(function(err, fileData) {
				if (err) return processedFile(err);

				async.eachSeries(field._post.move, function(fn, next) {
					fn(item, file, fileData, next);
				}, function(err) {
					return processedFile(err, fileData);
				});
			});
		});

	}, callback);

};


/**
 * Returns a callback that handles a standard form submission for the field
 *
 * Expected form parts are
 * - `field.paths.action` in `req.body` (`clear` or `delete`)
 * - `field.paths.upload` in `req.files` (uploads the file to ossfile)
 *
 * @api public
 */

ossfile.prototype.getRequestHandler = function(item, req, paths, callback) {

	var field = this;

	if (utils.isFunction(paths)) {
		callback = paths;
		paths = field.paths;
	} else if (!paths) {
		paths = field.paths;
	}

	callback = callback || function() {};

	return function() {

		if (req.body) {
			var action = req.body[paths.action];

			if (/^(delete|reset)$/.test(action)) {
				field.apply(item, action);
			}
		}

		// Upload new files
		if (req.files) {

			var upFile = req.files[paths.upload];
			if (upFile && typeof upFile.name !== 'undefined' && upFile.name.length > 0 ) {
				console.log('uploading file:');
				console.log(upFile);
				return field.uploadFile(item, upFile, true, callback);
			}
		}

		return callback();
	};

};


/**
 * Immediately handles a standard form submission for the field (see `getRequestHandler()`)
 *
 * @api public
 */

ossfile.prototype.handleRequest = function(item, req, paths, callback) {
	this.getRequestHandler(item, req, paths, callback)();
};


/*!
 * Export class
 */

exports = module.exports = ossfile;