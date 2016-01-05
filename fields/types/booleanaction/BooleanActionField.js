import React from 'react';
import Field from '../Field';
import CheckboxButton from '../../../admin/client/components/CheckboxButton';
import { FormField, FormNote } from 'elemental';

module.exports = Field.create({

	displayName: 'BooleanActionField',

	propTypes: {
		indent: React.PropTypes.bool,
		label: React.PropTypes.string,
		note: React.PropTypes.string,
		onClick: React.PropTypes.func,
		path: React.PropTypes.string,
		value: React.PropTypes.bool,
	},

	valueChanged () {
		this.props.onChange({
			path: this.props.path,
			value: 'true'
		});
		var self_node = this.getDOMNode();
		window.setTimeout(function(){
    		var current_node = self_node;
    		while(1){
        		if(current_node.nodeName == "#document") return;
        		if(current_node.nodeName == "FORM"){
            		current_node.submit();
            		return;
        		}
                current_node = current_node.parentNode;
    		}
		}, 0);
	},

	renderNote () {
    	if (!this.shouldRenderField()) return;
		if (!this.props.note) return null;
		return <FormNote note={this.props.note} />;
	},

	renderFormInput () {
		if (!this.shouldRenderField()) return;
		return <input type="hidden" name={this.props.path} value={this.props.value ? 'true' : 'false'} />;
	},

	renderCheckboxButton () {
		if (!this.shouldRenderField()) return;
		return <CheckboxButton checked={this.props.value} onClick={this.valueChanged} value={this.props.label} />;
	},

	renderUI () {
		return (
			<FormField offsetAbsentLabel={this.props.indent} className="field-type-boolean">
				<label style={{ height: '2.3em' }}>
					{this.renderFormInput()}
					{this.renderCheckboxButton()}
				</label>
				{this.renderNote()}
			</FormField>
		);
	}

});
