import classnames from 'classnames';
import DayPicker, { DateUtils } from 'react-day-picker';
import ArrayFieldMixin from '../../mixins/ArrayField';
import DateInput from '../../components/DateInput';
import Field from '../Field';
import React from 'react';
import { FormField, FormInput } from 'elemental';

const DEFAULT_INPUT_FORMAT = 'YYYY-MM-DD';
const DEFAULT_FORMAT_STRING = 'Do MMM YYYY';

module.exports = Field.create({

	displayName: 'DateArrayField',
	mixins: [ArrayFieldMixin],

	propTypes: {
		formatString: React.PropTypes.string,
		inputFormat: React.PropTypes.string,
	},

	getDefaultProps () {
		return {
			formatString: DEFAULT_FORMAT_STRING,
			inputFormat: DEFAULT_INPUT_FORMAT,
		};
	},

	processInputValue (value) {
		if (!value) return;
		if (value.split("-").length != 3 || value[value.length - 1] == "-" || value[value.length - 2] == "-") return value;
		let m = moment(value);
		return m.isValid() ? m.format(this.props.inputFormat) : value;
	},

	formatValue (value) {
		return value ? this.moment(value).format(this.props.formatString) : '';
	},

	getInputComponent () {
		return DateInput;
	},

	handleDaySelect (e, day, modifiers) {
		var self = this;
		if (modifiers.indexOf('disabled') > -1) {
			return;
		}
		if (modifiers.indexOf('selected') > -1) {
    		var selectedValue = moment(day).format("YYYY-MM-DD");
    		var newValues = [];
            for(var i=0; i < this.state.values.length; i++){
                var newValue = this.state.values[i];
                if (moment(newValue.value).format("YYYY-MM-DD") != selectedValue){
                    newValues.push(newValue);
                }
            }
    		this.setState({
    			values: newValues
    		});
    		this.valueChanged(this.reduceValues(newValues));
        }else{
    		var newValues = self.state.values.concat(self.newItem(moment(day).format("YYYY-MM-DD")));
    		self.setState({
    			values: newValues
    		});
    		self.valueChanged(self.reduceValues(newValues));
        }
	},

    renderCombineField () {
        var selectedDays = [];
        for(var i=0; i < this.state.values.length; i++){
            selectedDays.push(moment(this.state.values[i].value).format("YYYY-MM-DD"));
        }
		var modifiers = {
			selected: (day) => selectedDays.indexOf(moment(day).format("YYYY-MM-DD")) > -1,
		};
		if(this.props.no_past){
    		modifiers.disabled = DateUtils.isPastDay;
		};
        return (
            <div>
				<DayPicker
					ref="picker"
					modifiers={modifiers}
					onDayClick={this.handleDaySelect}
					tabIndex={-1} />
				{this.state.values.map(this.renderValueItem)}
            </div>
        )
    },

	renderValueItem: function(item, index) {
		const value = this.processInputValue ? this.processInputValue(item.value) : item.value;
		return (
			<FormField key={item.key} style={{display: "none"}}>
				<FormInput type="hidden" ref={'item_' + (index + 1)} name={this.props.path} value={value} />
			</FormField>
		);
	},

	renderUI () {
		var wrapperClassName = classnames(
			('field-type-' + this.props.type),
			this.props.className
		);
    	if(this.props.combine){
    		return (
    			<FormField label={this.props.label} className={wrapperClassName} htmlFor={this.props.path}>
    				<div className={'FormField__inner field-size-' + this.props.size}>
    					{this.shouldRenderField() ? this.renderCombineField() : this.renderValue()}
    				</div>
    				{this.renderNote()}
    			</FormField>
    		);
    	}else{
    		return (
    			<FormField label={this.props.label} className={wrapperClassName} htmlFor={this.props.path}>
    				<div className={'FormField__inner field-size-' + this.props.size}>
    					{this.shouldRenderField() ? this.renderField() : this.renderValue()}
    				</div>
    				{this.renderNote()}
    			</FormField>
    		);
    	}
	},
});
