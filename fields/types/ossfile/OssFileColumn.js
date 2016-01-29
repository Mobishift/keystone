var React = require('react');

import CloudinaryImageSummary from '../../components/columns/CloudinaryImageSummary';
import ItemsTableCell from '../../../admin/client/components/ItemsTableCell';
import ItemsTableValue from '../../../admin/client/components/ItemsTableValue';

module.exports = React.createClass({
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},

	renderValue: function() {
    	if(this.props.col.field.image){
    		var value = this.props.data.fields[this.props.col.path];
    		if (!value || !Object.keys(value).length) return;
    
    		return (
    			<ItemsTableValue field={this.props.col.type}>
    				<CloudinaryImageSummary image={value} />
    			</ItemsTableValue>
    		);
    	}else{
    		var value = this.props.data.fields[this.props.col.path];
    		if (!value || !_.size(value)) return;
    		return value.path + '/' + value.filename;
    	}
	},
	render: function() {
    	if(this.props.col.field.image){
    		return (
    			<ItemsTableCell>
    				{this.renderValue()}
    			</ItemsTableCell>
    		);
    	}else{
    		return (
    			<td className="ItemList__col">
    				<div className="ItemList__value ItemList__value--local-file">{this.renderValue()}</div>
    			</td>
    		);
    	}
	}
});
