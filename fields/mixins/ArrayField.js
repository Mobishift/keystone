var React = require('react');
var ReactDOM = require('react-dom');

var Button = require('elemental').Button;
var FormField = require('elemental').FormField;
var FormInput = require('elemental').FormInput;

var lastId = 0;

module.exports = {
    newItem (value) {
    	lastId = lastId + 1;
    	return { key: 'i' + lastId, value: value };
    },

    reduceValues (values) {
    	return values.map(i => i.value);
    },

	getInitialState: function() {
		return {
			values: this.props.value.map(this.newItem)
		};
	},

	componentWillReceiveProps: function(nextProps) {
    	var self = this;
		if (nextProps.value.join('|') !== self.reduceValues(this.state.values).join('|')) {
			this.setState({
				values: nextProps.value.map(self.newItem)
			});
		}
	},

	addItem: function() {
		var self = this;
		var newValues = this.state.values.concat(self.newItem(''));
		this.setState({
			values: newValues
		}, () => {
			if (!this.state.values.length) return;
			ReactDOM.findDOMNode(this.refs['item_' + this.state.values.length]).focus();
		});
		this.valueChanged(self.reduceValues(newValues));
	},

	removeItem: function(i) {
		var newValues = _.without(this.state.values, i);
		this.setState({
			values: newValues
		}, function() {
			ReactDOM.findDOMNode(this.refs.button).focus();
		});
		this.valueChanged(this.reduceValues(newValues));
	},

	updateItem: function(i, event) {
		var updatedValues = this.state.values;
		var updateIndex = updatedValues.indexOf(i);
		updatedValues[updateIndex].value = this.cleanInput ? this.cleanInput(event.target.value) : event.target.value;
		this.setState({
			values: updatedValues
		});
		this.valueChanged(this.reduceValues(updatedValues));
	},

	valueChanged: function(values) {
		this.props.onChange({
			path: this.props.path,
			value: values
		});
	},

	renderField: function () {
		return (
			<div>
				{this.state.values.map(this.renderItem)}
				<Button ref="button" onClick={this.addItem}>Add item</Button>
			</div>
		);
	},

	renderItem: function(item, index) {
		const Input = this.getInputComponent ? this.getInputComponent() : FormInput;
		const value = this.processInputValue ? this.processInputValue(item.value) : item.value;
		return (
			<FormField key={item.key}>
				<Input ref={'item_' + (index + 1)} name={this.props.path} value={value} onChange={this.updateItem.bind(this, item)} autoComplete="off" />
				<Button type="link-cancel" onClick={this.removeItem.bind(this, item)} className="keystone-relational-button">
					<span className="octicon octicon-x" />
				</Button>
			</FormField>
		);
	},

	renderValue: function () {
		const Input = this.getInputComponent ? this.getInputComponent() : FormInput;
		return (
			<div>
				{this.state.values.map((item, i) => {
					const value = this.formatValue ? this.formatValue(item.value) : item.value;
					return (
						<div key={i} style={i ? { marginTop: '1em' } : null}>
							<Input noedit value={value} />
						</div>
					);
				})}
			</div>
		);
	},

	// Override shouldCollapse to check for array length
	shouldCollapse: function () {
		return this.props.collapse && !this.props.value.length;
	}
};
