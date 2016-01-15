import React from 'react';
import { Container } from 'elemental';

var PrimaryNavItem = React.createClass({
	displayName: 'PrimaryNavItem',
	propTypes: {
		children: React.PropTypes.node.isRequired,
		className: React.PropTypes.string,
		href: React.PropTypes.string.isRequired,
		title: React.PropTypes.string,
	},
	render () {
		return (
			<li className={this.props.className}>
				<a href={this.props.href} title={this.props.title} tabIndex="-1">
					{this.props.children}
				</a>
			</li>
		);
	},
});

var PrimaryNavigation = React.createClass({
	displayName: 'PrimaryNavigation',
	propTypes: {
		currentSectionKey: React.PropTypes.string,
		brand: React.PropTypes.string,
		sections: React.PropTypes.array.isRequired,
		signoutUrl: React.PropTypes.string,
	},
	getInitialState() {
		return {};
	},
	componentDidMount () {
		this.handleResize();
		window.addEventListener('resize', this.handleResize);
	},
	componentWillUnmount () {
		window.removeEventListener('resize', this.handleResize);
	},
	handleResize () {
		this.setState({
			navIsVisible: window.innerWidth >= 768
		});
	},
	renderUser () {
		var email = Keystone.user.email;
		var user_permission = Keystone.user.permission || "user";
		var admin_list_hidden_permissions = [];
		var admin_list_path = "";
		if(Keystone.lists.length == null){
    		var list = Keystone.lists[Keystone.adminList];
    		if(list){
                admin_list_hidden_permissions = list.hidden_permissions || [];
                admin_list_path = list.path;
    		}
		}else{
            for(var i=0; i<Keystone.lists.length; i++){
                var list = Keystone.lists[i];
                if (list.key == Keystone.adminList){
                    admin_list_hidden_permissions = list.hidden_permissions || [];
                    admin_list_path = list.path;
                    break;
                }
            }
		}
        if(admin_list_hidden_permissions.indexOf(user_permission) == -1 && admin_list_path){
            var url = Keystone.adminPath + "/" + admin_list_path + "/" + Keystone.user._id;
            return (
    			<PrimaryNavItem href={url} title="User Name">
    				{email}
    			</PrimaryNavItem>
            );
        }else{
    		var style = {"cursor": "default"};
    		return (
    			<li>
    				<a title="User Name" tabIndex="-1" style={style}>
    					{email}
    				</a>
    			</li>
    		);
        }
	},
	renderSignout () {
		if (!this.props.signoutUrl) return null;

		return (
			<PrimaryNavItem href={this.props.signoutUrl} title="Sign Out">
				<span className="octicon octicon-sign-out" />
			</PrimaryNavItem>
		);
	},
	renderFrontLink () {
		return (
			<ul className="app-nav app-nav--primary app-nav--right">
				<PrimaryNavItem href="/" title={'Front page - ' + this.props.brand}>
					<span className="octicon octicon-globe" />
				</PrimaryNavItem>
				{this.renderUser()}
				{this.renderSignout()}
			</ul>
		);
	},
	renderBrand () {
		// TODO: support navbarLogo from keystone config
		return (
			<PrimaryNavItem className={this.props.currentSectionKey === 'dashboard' ? 'active' : null} href={Keystone.adminPath} title={'Dashboard - ' + this.props.brand}>
				<span className="octicon octicon-home" />
			</PrimaryNavItem>
		);
	},
	renderNavigation () {
		if (!this.props.sections || !this.props.sections.length) return null;

		return this.props.sections.map((section) => {
			let href = section.lists[0].external ? section.lists[0].path : `${Keystone.adminPath}/${section.lists[0].path}`;
			let className = (this.props.currentSectionKey && this.props.currentSectionKey === section.key) ? 'active' : null;

			return (
				<PrimaryNavItem key={section.key} className={className} href={href}>
					{section.label}
				</PrimaryNavItem>
			);
		});
	},
	render () {
		if (!this.state.navIsVisible) return null;

		return (
			<nav className="primary-navbar">
				<Container clearfix>
					<ul className="app-nav app-nav--primary app-nav--left">
						{this.renderBrand()}
						{this.renderNavigation()}
					</ul>
					{this.renderFrontLink()}
				</Container>
			</nav>
		);
	},
});

module.exports = PrimaryNavigation;
