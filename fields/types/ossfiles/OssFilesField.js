import _ from 'underscore';
import bytes from 'bytes';
import Field from '../Field';
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, FormField, FormInput, FormNote } from 'elemental';

import Lightbox from '../../../admin/client/components/Lightbox';
import classnames from 'classnames';

/**
 * TODO:
 * - Remove dependency on underscore
 */

const ICON_EXTS = [
	'aac', 'ai', 'aiff', 'avi', 'bmp', 'c', 'cpp', 'css', 'dat', 'dmg', 'doc', 'dotx', 'dwg', 'dxf', 'eps', 'exe', 'flv', 'gif', 'h',
	'hpp', 'html', 'ics', 'iso', 'java', 'jpg', 'js', 'key', 'less', 'mid', 'mp3', 'mp4', 'mpg', 'odf', 'ods', 'odt', 'otp', 'ots',
	'ott', 'pdf', 'php', 'png', 'ppt', 'psd', 'py', 'qt', 'rar', 'rb', 'rtf', 'sass', 'scss', 'sql', 'tga', 'tgz', 'tiff', 'txt',
	'wav', 'xls', 'xlsx', 'xml', 'yml', 'zip'
];

var LocalFilesFieldItem = React.createClass({
	propTypes: {
		deleted: React.PropTypes.bool,
		filename: React.PropTypes.string,
		isQueued: React.PropTypes.bool,
		key: React.PropTypes.number,
		size: React.PropTypes.number,
		toggleDelete: React.PropTypes.func,
	},

	renderActionButton () {
		if (!this.props.shouldRenderActionButton || this.props.isQueued) return null;

		var buttonLabel = this.props.deleted ? 'Undo' : 'Remove';
		var buttonType = this.props.deleted ? 'link' : 'link-cancel';

		return <Button key="action-button" type={buttonType} onClick={this.props.toggleDelete}>{buttonLabel}</Button>;
	},

	render () {
		let { filename } = this.props;
		let ext = filename.split('.').pop();

		let iconName = '_blank';
		if (_.contains(ICON_EXTS, ext)) iconName = ext;

		let note;
		if (this.props.deleted) {
			note = <FormInput key="delete-note" noedit className="field-type-localfiles__note field-type-localfiles__note--delete">save to delete</FormInput>;
		} else if (this.props.isQueued) {
			note = <FormInput key="upload-note" noedit className="field-type-localfiles__note field-type-localfiles__note--upload">save to upload</FormInput>;
		}

		return (
			<FormField>
				<img key="file-type-icon" className="file-icon" src={Keystone.adminPath + '/images/icons/32/' + iconName + '.png'} />
				<FormInput key="file-name" noedit className="field-type-localfiles__filename">
					{filename}
					{this.props.size ? ' (' + bytes(this.props.size) + ')' : null}
				</FormInput>
				{note}
				{this.renderActionButton()}
			</FormField>
		);
	}

});

const SUPPORTED_TYPES = ['image/gif', 'image/png', 'image/jpeg', 'image/bmp', 'image/x-icon', 'application/pdf', 'image/x-tiff', 'image/x-tiff', 'application/postscript', 'image/vnd.adobe.photoshop', 'image/svg+xml'];

const iconClassDeleted = [
	'delete-pending',
	'mega-octicon',
	'octicon-x'
];

const iconClassQueued = [
	'img-uploading',
	'mega-octicon',
	'octicon-cloud-upload'
];

var Thumbnail = React.createClass({
	displayName: 'OssImagesFieldThumbnail',

	propTypes: {
		deleted: React.PropTypes.bool,
		height: React.PropTypes.number,
		isQueued: React.PropTypes.bool,
		openLightbox: React.PropTypes.func,
		shouldRenderActionButton: React.PropTypes.bool,
		toggleDelete: React.PropTypes.func,
		url: React.PropTypes.string,
		width: React.PropTypes.number,
	},

	renderActionButton () {
		if (!this.props.shouldRenderActionButton || this.props.isQueued) return null;
		return <Button type={this.props.deleted ? 'link-text' : 'link-cancel'} block onClick={this.props.toggleDelete}>{this.props.deleted ? 'Undo' : 'Remove'}</Button>;
	},

	render () {
		let iconClassName;
		let { deleted, height, isQueued, url, width, openLightbox } = this.props;
		let previewClassName = classnames('image-preview', {
			'action': (deleted || isQueued)
		});
		let title = (width && height) ? (width + ' × ' + height) : '';

		if (deleted) {
			iconClassName = classnames(iconClassDeleted);
		} else if (isQueued) {
			iconClassName = classnames(iconClassQueued);
		}

		return (
			<div className="image-field image-sortable" title={title}>
				<div className={previewClassName}>
					<a href={url} onClick={openLightbox} className="img-thumbnail">
						<img style={{ height: '90' }} className="img-load" src={url} />
						<span className={iconClassName} />
					</a>
				</div>
				{this.renderActionButton()}
			</div>
		);
	}

});

module.exports = Field.create({

	getInitialState () {
    	if(this.props.image){
    		var thumbnails = [];
    		var self = this;
    
    		_.each(this.props.value, function (item) {
    			self.pushThumbnail(item, thumbnails);
    		});
    
    		return { thumbnails: thumbnails };
    	}else{
    		var items = [];
    		var self = this;
    
    		_.each(this.props.value, function (item) {
    			self.pushItem(item, items);
    		});
    
    		return { items: items };
    	}
	},

	openLightbox (index) {
		event.preventDefault();
		this.setState({
			lightboxIsVisible: true,
			lightboxImageIndex: index,
		});
	},

	closeLightbox () {
		this.setState({
			lightboxIsVisible: false,
			lightboxImageIndex: null,
		});
	},

	renderLightbox () {
    	if (!this.props.image) return;
		if (!this.props.value || !this.props.value.length) return;

		let images = this.props.value.map(image => image.url);

		return (
			<Lightbox
				images={images}
				initialImage={this.state.lightboxImageIndex}
				isOpen={this.state.lightboxIsVisible}
				onCancel={this.closeLightbox}
			/>
		);
	},

	removeThumbnail (i) {
		var thumbs = this.state.thumbnails;
		var thumb = thumbs[i];

		if (thumb.props.isQueued) {
			thumbs[i] = null;
		} else {
			thumb.props.deleted = !thumb.props.deleted;
		}

		this.setState({ thumbnails: thumbs });
	},

	pushThumbnail (args, thumbs) {
		thumbs = thumbs || this.state.thumbnails;
		var i = thumbs.length;
		args.toggleDelete = this.removeThumbnail.bind(this, i);
		args.shouldRenderActionButton = this.shouldRenderField();
		args.openLightbox = this.openLightbox.bind(this, i);
		thumbs.push(<Thumbnail key={i} {...args} />);
	},

	getCount (key) {
		var count = 0;

		_.each(this.state.thumbnails, function (thumb) {
			if (thumb && thumb.props[key]) count++;
		});

		return count;
	},

	removeItem (id) {
		var thumbs = [];
		var self = this;
		_.each(this.state.items, function (thumb) {
			if (thumb.props._id === id) {
				thumb.props.deleted = !thumb.props.deleted;
			}
			self.pushItem(thumb.props, thumbs);
		});

		this.setState({ items: thumbs });
	},

	pushItem (args, thumbs) {
		thumbs = thumbs || this.state.items;
		var i = thumbs.length;
		args.toggleDelete = this.removeItem.bind(this, args._id);
		args.shouldRenderActionButton = this.shouldRenderField();
		args.adminPath = Keystone.adminPath;
		thumbs.push(<LocalFilesFieldItem key={args._id} {...args} />);
	},

	fileFieldNode () {
		return ReactDOM.findDOMNode(this.refs.fileField);
	},

	renderFileField () {
    	if (this.props.image && !this.shouldRenderField()) return null;
		return <input ref="fileField" type="file" name={this.props.paths.upload} multiple className="field-upload" onChange={this.uploadFile} tabIndex="-1" />;
	},

	clearFiles () {
		this.fileFieldNode().value = '';

        if (this.props.image){
    		this.setState({
    			thumbnails: this.state.thumbnails.filter(function (thumb) {
    				return !thumb.props.isQueued;
    			})
    		});
        }else{
    		this.setState({
    			items: this.state.items.filter(function (thumb) {
    				return !thumb.props.isQueued;
    			})
    		});
        }
	},

	uploadFile (event) {
		var self = this;

		var files = event.target.files;
		if(this.props.image){
    		_.each(files, function (f) {
    			if (!_.contains(SUPPORTED_TYPES, f.type)) {
    				alert('Unsupported file type. Supported formats are: GIF, PNG, JPG, BMP, ICO, PDF, TIFF, EPS, PSD, SVG');
    				return;
    			}
    
    			if (window.FileReader) {
    				var fileReader = new FileReader();
    				fileReader.onload = function (e) {
    					self.pushThumbnail({ isQueued: true, url: e.target.result });
    					self.forceUpdate();
    				};
    				fileReader.readAsDataURL(f);
    			} else {
    				self.pushThumbnail({ isQueued: true, url: '#' });
    				self.forceUpdate();
    			}
    		});
		}else{
    		_.each(files, function (f) {
    			self.pushItem({ isQueued: true, filename: f.name });
    			self.forceUpdate();
    		});
		}
	},

	changeImage () {
		this.fileFieldNode().click();
	},

	changeFiles () {
		this.fileFieldNode().click();
	},

	hasFiles () {
		return this.refs.fileField && this.fileFieldNode().value;
	},

	renderToolbar () {
		if (!this.shouldRenderField()) return null;

        if(this.props.image){
    		var body = [];
    
    		var push = function (queueType, alertType, count, action) {
    			if (count <= 0) return;
    
    			var imageText = count === 1 ? 'image' : 'images';
    
    			body.push(<div key={queueType + '-toolbar'} className={queueType + '-queued' + ' u-float-left'}>
    				<FormInput noedit>{count} {imageText} {action}</FormInput>
    			</div>);
    		};
    
    		push('upload', 'success', this.getCount('isQueued'), 'selected - save to upload');
    		push('delete', 'danger', this.getCount('deleted'), 'removed - save to confirm');
    
    		var clearFilesButton;
    		if (this.hasFiles()) {
    			clearFilesButton = <Button type="link-cancel" onClick={this.clearFiles} className="ml-5">Clear selection</Button>;
    		}
    
    		return (
    			<div className="images-toolbar">
    				<div className="u-float-left">
    					<Button onClick={this.changeImage}>Upload Images</Button>
    					{clearFilesButton}
    				</div>
    				{body}
    			</div>
    		);  
        }else{
    		var clearFilesButton;
    		if (this.hasFiles()) {
    			clearFilesButton = <Button type="link-cancel" className="ml-5" onClick={this.clearFiles}>Clear Uploads</Button>;
    		}
    
    		return (
    			<div className="files-toolbar">
    				<Button onClick={this.changeFiles}>Upload</Button>
    				{clearFilesButton}
    			</div>
    		);
        }
	},

	renderPlaceholder () {
    	if(this.props.image){
    		return (
    			<div className="image-field image-field--upload" onClick={this.changeImage}>
    				<div className="image-preview">
    					<span className="img-thumbnail">
    						<span className="img-dropzone" />
    						<div className="img-uploading mega-octicon octicon-file-media" />
    					</span>
    				</div>
    
    				<div className="image-details">
    					<span className="image-message">Click to upload</span>
    				</div>
    			</div>
    		);
    	}else{
    		return (
    			<div className="file-field file-upload" onClick={this.changeFiles}>
    				<div className="file-preview">
    					<span className="file-thumbnail">
    						<span className="file-dropzone" />
    						<div className="ion-picture file-uploading" />
    					</span>
    				</div>
    
    				<div className="file-details">
    					<span className="file-message">Click to upload</span>
    				</div>
    			</div>
    		);
    	}
	},

	renderContainer () {
    	if(this.props.image){
    		return (
    			<div className="images-container">
    				{this.state.thumbnails}
    			</div>
    		);
    	}else{
    		return (
    			<div className="files-container clearfix">
    				{this.state.items}
    			</div>
    		);
    	}
	},

	renderFieldAction () {
    	if(this.props.image){
    		if (!this.shouldRenderField()) return null;
    
    		var value = '';
    		var remove = [];
    		_.each(this.state.thumbnails, function (thumb) {
    			if (thumb && thumb.props.deleted) remove.push(thumb.props._id);
    		});
    		if (remove.length) value = 'remove:' + remove.join(',');
    
    		return <input ref="action" className="field-action" type="hidden" value={value} name={this.props.paths.action} />;
    	}else{
    		var value = '';
    		var remove = [];
    		_.each(this.state.items, function (thumb) {
    			if (thumb && thumb.props.deleted) remove.push(thumb.props._id);
    		});
    		if (remove.length) value = 'delete:' + remove.join(',');
    
    		return <input ref="action" className="field-action" type="hidden" value={value} name={this.props.paths.action} />;
    	}
	},

	renderUploadsField () {
    	if (this.props.image && !this.shouldRenderField()) return null;
		return <input ref="uploads" className="field-uploads" type="hidden" name={this.props.paths.uploads} />;
	},

	renderNote () {
		if (!this.props.note) return null;
		return <FormNote note={this.props.note} />;
	},

	renderUI () {
        var class_name = "";
        if(this.props.image){
            class_name = "field-type-cloudinaryimages";
        }else{
            class_name = "field-type-localfiles";
        }
		return (
			<FormField label={this.props.label} className={class_name}>
				{this.renderFieldAction()}
				{this.renderUploadsField()}
				{this.renderFileField()}
				{this.renderContainer()}
				{this.renderToolbar()}
				{this.renderNote()}
				{this.renderLightbox()}
			</FormField>
		);
	}
});
