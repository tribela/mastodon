import React from 'react';
import PropTypes from 'prop-types';
import IconButton from './icon_button';
import { defineMessages, injectIntl } from 'react-intl';
import ImmutablePureComponent from 'react-immutable-pure-component';

const messages = defineMessages({
  unblockDomain: { id: 'account.unblock_domain', defaultMessage: 'Unblock domain {domain}' },
  unmuteDomain: { id: 'account.unmute_domain', defaultMessage: 'Unmute domain {domain}' },
});

class Account extends ImmutablePureComponent {

  static propTypes = {
    domain: PropTypes.string,
    for_muted_list: PropTypes.bool,
    onUnblockDomain: PropTypes.func.isRequired,
    onUnmuteDomain: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  handleDomainUnblock = () => {
    this.props.onUnblockDomain(this.props.domain);
  };

  handleDomainUnmute = () => {
    this.props.onUnmuteDomain(this.props.domain);
  };

  render () {
    const { domain, intl, for_muted_list } = this.props;

    let buttons = [];

    if (for_muted_list) {
      buttons.push(<IconButton active icon='volume-up' title={intl.formatMessage(messages.unmuteDomain, { domain })} onClick={this.handleDomainUnmute} />);
    } else {
      buttons.push(<IconButton active icon='unlock' title={intl.formatMessage(messages.unblockDomain, { domain })} onClick={this.handleDomainUnblock} />);
    }

    return (
      <div className='domain'>
        <div className='domain__wrapper'>
          <span className='domain__domain-name'>
            <strong>{domain}</strong>
          </span>

          <div className='domain__buttons'>
            {buttons}
          </div>
        </div>
      </div>
    );
  }

}

export default injectIntl(Account);
