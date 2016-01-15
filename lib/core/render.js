var _ = require('underscore');
var cloudinary = require('cloudinary');
var fs = require('fs');
var jade = require('jade');
var extend = require('util')._extend;

/**
 * Renders a Keystone View
 *
 * @api private
 */

var templateCache = {};

function render(req, res, view, ext) {

	var keystone = this;
	var templatePath = __dirname + '/../../admin/server/templates/' + view + '.jade';
	var jadeOptions = {
		filename: templatePath,
		pretty: keystone.get('env') !== 'production'
	};
	var compileTemplate = function() {
		return jade.compile(fs.readFileSync(templatePath, 'utf8'), jadeOptions);
	};
	var template = templateCache[view] || (templateCache[view] = compileTemplate());

	if (!res.req.flash) {
		console.error('\nKeystoneJS Runtime Error:\n\napp must have flash middleware installed. Try adding "connect-flash" to your express instance.\n');
		process.exit(1);
	}
	var flashMessages = {
		info: res.req.flash('info'),
		success: res.req.flash('success'),
		warning: res.req.flash('warning'),
		error: res.req.flash('error'),
		hilight: res.req.flash('hilight'),
	};

	var user_permission = "user";
	if(req && req.user && req.user.permission) user_permission = req.user.permission;

	var lists = {};
	_.each(keystone.lists, function(list, key) {
    	var value = list.getOptions();
    	var new_fields = {};
        var fields_keys = Object.getOwnPropertyNames(value.fields);
        for(var i=0; i<fields_keys.length; i++){
            var fields_key = fields_keys[i];
            var fields_value = value.fields[fields_key];
            if(fields_value.noedit_permissions && fields_value.noedit_permissions.indexOf(user_permission) != -1){
                var new_fields_value = extend({}, fields_value);
                new_fields_value.noedit = true;
                new_fields[fields_key] = new_fields_value;
            }else{
                new_fields[fields_key] = fields_value;
            }
        }
        value.fields = new_fields;
		lists[key] = value;
	});

	var locals = {
		_: _,
		env: keystone.get('env'),
		brand: keystone.get('brand'),
		appversion : keystone.get('appversion'),
		nav: keystone.getUserNav(req),
		messages: _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false,
		lists: lists,
		userModel: keystone.get('user model'),
		user: req.user,
		title: 'Keystone',
		signout: keystone.get('signout url') || null,
		adminPath: '/' + keystone.get('admin path'),
		adminList: keystone.get('admin list'),
		backUrl: keystone.get('back url') || '/',
		section: {},
		version: keystone.version,
		csrf_header_key: keystone.security.csrf.CSRF_HEADER_KEY,
		csrf_token_key: keystone.security.csrf.TOKEN_KEY,
		csrf_token_value: keystone.security.csrf.getToken(req, res),
		csrf_query: '&' + keystone.security.csrf.TOKEN_KEY + '=' + keystone.security.csrf.getToken(req, res),
		ga: {
			property: keystone.get('ga property'),
			domain: keystone.get('ga domain')
		},
		wysiwygOptions: {
			enableImages: keystone.get('wysiwyg images') ? true : false,
			enableCloudinaryUploads: keystone.get('wysiwyg cloudinary images') ? true : false,
			enableS3Uploads: keystone.get('wysiwyg s3 images') ? true : false,
			additionalButtons: keystone.get('wysiwyg additional buttons') || '',
			additionalPlugins: keystone.get('wysiwyg additional plugins') || '',
			additionalOptions: keystone.get('wysiwyg additional options') || {},
			overrideToolbar: keystone.get('wysiwyg override toolbar'),
			skin: keystone.get('wysiwyg skin') || 'keystone',
			menubar: keystone.get('wysiwyg menubar'),
			importcss: keystone.get('wysiwyg importcss') || ''
		},
		googleMapKey: keystone.get('google api key')
	};

	// view-specific extensions to the local scope
	_.extend(locals, ext);

	// add cloudinary locals if configured
	if (keystone.get('cloudinary config')) {
		try {
			var cloudinaryUpload = cloudinary.uploader.direct_upload();
			locals.cloudinary = {
				cloud_name: keystone.get('cloudinary config').cloud_name,
				api_key: keystone.get('cloudinary config').api_key,
				timestamp: cloudinaryUpload.hidden_fields.timestamp,
				signature: cloudinaryUpload.hidden_fields.signature,
				prefix: keystone.get('cloudinary prefix') || '',
				folders: keystone.get('cloudinary folders'),
				uploader: cloudinary.uploader
			};
			locals.cloudinary_js_config = cloudinary.cloudinary_js_config();
		} catch(e) {
			if (e === 'Must supply api_key') {
				throw new Error('Invalid Cloudinary Config Provided\n\n' +
					'See http://keystonejs.com/docs/configuration/#services-cloudinary for more information.');
			} else {
				throw e;
			}
		}
	}

	res.send(template(locals));
}

module.exports = render;
