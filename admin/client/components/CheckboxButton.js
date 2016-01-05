import React from 'react';
import blacklist from 'blacklist';
import classnames from 'classnames';
import Color from 'color';
import E from '../constants';

var CheckboxButton = React.createClass({
	displayName: 'CheckboxButton',
	propTypes: {
		checked: React.PropTypes.bool,
		component: React.PropTypes.node,
		onClick: React.PropTypes.func,
		readonly: React.PropTypes.bool,
	},
	getDefaultProps () {
		return {
			component: 'input',
		};
	},
	componentDidMount () {
		window.addEventListener('mouseup', this.handleMouseUp, false);
	},
	componentWillUnmount () {
		window.removeEventListener('mouseup', this.handleMouseUp, false);
	},
	getInitialState () {
		return {
			active: null,
			focus: null,
			hover: null,
		};
	},
	handleKeyDown (e) {
		if (e.keyCode !== 32) return;
		this.toggleActive(true);
	},
	handleKeyUp (e) {
		this.toggleActive(false);
	},
	handleMouseOver (e) {
		this.toggleHover(true);
	},
	handleMouseDown (e) {
		this.toggleActive(true);
		this.toggleFocus(true);
	},
	handleMouseUp (e) {
		this.toggleActive(false);
	},
	handleMouseOut (e) {
		this.toggleHover(false);
	},
	toggleActive (pseudo) {
		this.setState({ active: pseudo });
	},
	toggleHover (pseudo) {
		this.setState({ hover: pseudo });
	},
	toggleFocus (pseudo) {
		this.setState({ focus: pseudo });
	},
	handleClick () {
		this.props.onClick();
	},
	render () {
		let { checked, readonly } = this.props;

		let props = blacklist(this.props, 'checked', 'component', 'onClick', 'readonly');
		props.ref = 'checkbox';
		props.className = classnames('Button', 'Button--primary', 'octicon', {
			'octicon-check': checked,
			'octicon-x': (typeof checked === 'boolean') && !checked && readonly,
		});
		props.type = readonly ? null : 'button';

		props.onKeyDown = this.handleKeyDown;
		props.onKeyUp = this.handleKeyUp;

		props.onMouseDown = this.handleMouseDown;
		props.onMouseUp = this.handleMouseUp;
		props.onMouseOver = this.handleMouseOver;
		props.onMouseOut = this.handleMouseOut;

		props.onClick = readonly ? null : this.handleClick;
		props.onFocus = readonly ? null : () => this.toggleFocus(true);
		props.onBlur = readonly ? null : () => this.toggleFocus(false);

		let node = readonly ? 'span' : this.props.component;

		return React.createElement(node, props);
	}
});

module.exports = CheckboxButton;
