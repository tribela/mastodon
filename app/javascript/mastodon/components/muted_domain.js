import React from 'react';
import PropTypes from 'prop-types';
import IconButton from './icon_button';
import { defineMessages, injectIntl } from 'react-intl';
import ImmutablePureComponent from 'react-immutable-pure-component';

const messages = defineMessages({
  unmuteDomain: { id: 'account.unmute_domain', defaultMessage: 'Unmute domain {domain}' },
});

export default @injectIntl
class MutedDomain extends ImmutablePureComponent {

  static propTypes = {
    domain: PropTypes.string,
    onUnmuteDomain: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  handleDomainUnmute = () => {
    this.props.onUnmuteDomain(this.props.domain);
  };

  render () {
    const { domain, intl } = this.props;

    return (
      <div className='domain'>
        <div className='domain__wrapper'>
          <span className='domain__domain-name'>
            <strong>{domain}</strong>
          </span>

          <div className='domain__buttons'>
            <IconButton active icon='volume-up' title={intl.formatMessage(messages.unmuteDomain, { domain })} onClick={this.handleDomainUnmute} />
          </div>
        </div>
      </div>
    );
  }

}
