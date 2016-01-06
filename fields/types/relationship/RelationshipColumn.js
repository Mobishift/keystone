import React from 'react';
import ItemsTableCell from '../../../admin/client/components/ItemsTableCell';
import ItemsTableValue from '../../../admin/client/components/ItemsTableValue';

const moreIndicatorStyle = {
	color: '#bbb',
	fontSize: '.8rem',
	fontWeight: 500,
	marginLeft: 8,
};

var RelationshipColumn = React.createClass({
	displayName: 'RelationshipColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},
	shouldRenderLink () {
		var hidden_permissions = this.props.col.field.refList.hidden_permissions || [];
		var user_permission = "user";
		if (Keystone.user && Keystone.user.permission) user_permission = Keystone.user.permission;
		return hidden_permissions.indexOf(user_permission) == -1;
	},
	renderMany (value) {
		if (!value || !value.length) return;
		let refList = this.props.col.field.refList;
		let items = [];
		var shouldRenderLink = this.shouldRenderLink();
		for (let i = 0; i < 3; i++) {
			if (!value[i]) break;
			if (i) {
				items.push(<span key={'comma' + i}>, </span>);
			}
			var link = shouldRenderLink? Keystone.adminPath + '/' + refList.path + '/' + value[i].id: "";
			items.push(
				<ItemsTableValue interior truncate={false} key={'anchor' + i} href={link}>
					{value[i].name}
				</ItemsTableValue>
			);
		}
		if (value.length > 3) {
			items.push(<span key="more" style={moreIndicatorStyle}>[...{value.length - 3} more]</span>);
		}
		return (
			<ItemsTableValue field={this.props.col.type}>
				{items}
			</ItemsTableValue>
		);
	},
	renderValue (value) {
		if (!value) return;
		let refList = this.props.col.field.refList;
		var link = this.shouldRenderLink()? Keystone.adminPath + '/' + refList.path + '/' + value.id: "";
		return (
			<ItemsTableValue href={link} padded interior field={this.props.col.type}>
				{value.name}
			</ItemsTableValue>
		);
	},
	render () {
		let value = this.props.data.fields[this.props.col.path];
		let many = this.props.col.field.many;
		return (
			<ItemsTableCell>
				{many ? this.renderMany(value) : this.renderValue(value)}
			</ItemsTableCell>
		);
	}
});

module.exports = RelationshipColumn;
