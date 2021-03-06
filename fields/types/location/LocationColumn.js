import React from 'react';
import ItemsTableCell from '../../../admin/client/components/ItemsTableCell';
import ItemsTableValue from '../../../admin/client/components/ItemsTableValue';

const SUB_FIELDS = ['street1', 'suburb', 'state', 'postcode', 'country'];

var LocationColumn = React.createClass({
	displayName: 'LocationColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},
	renderValue () {
		let value = this.props.data.fields[this.props.col.path];
		if (!value || !Object.keys(value).length) return null;

		let output = [];

		SUB_FIELDS.map((i) => {
			if (value[i]) {
				output.push(value[i]);
			}
		});
		if (value.geo && value.geo.length && value.geo.length == 2){
			output.push("(" + value.geo[0] + ", " + value.geo[1] + ")");
		}
		return (
			<ItemsTableValue field={this.props.col.type} title={output.join(', ')}>
				{output.join(', ')}
			</ItemsTableValue>
		);
	},
	render () {
		return (
			<ItemsTableCell>
				{this.renderValue()}
			</ItemsTableCell>
		);
	}
});

module.exports = LocationColumn;
