import React from 'react';
import PropTypes from 'prop-types';

export default class Textarea extends React.Component {

  static propTypes = {
    element: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.node,
    ]),
    value: PropTypes.string,
    onChange: PropTypes.func,
    forwardedRef: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      isComposing: false,
    };
  }

  onCompositionChange = (e) => {
    if (e.type === 'compositionstart') {
      this.setState({ isComposing: true });
    } else {
      this.setState({ isComposing: false });
    }
  };

  onChange = (e) => {
    const { onChange } = this.props;
    const { value } = e.target;
    this.setState({ value });
    if (!this.state.isComposing) {
      onChange(e);
    }
  };

  render () {
    const { element, forwardedRef, ...props } = this.props;
    return React.createElement(element ?? 'textarea', {
      ...props,
      ref: forwardedRef,
      value: this.state.value,
      onChange: this.onChange,
      onCompositionStart: this.onCompositionChange,
      onCompositionEnd: this.onCompositionChange,
    });
  }

}
