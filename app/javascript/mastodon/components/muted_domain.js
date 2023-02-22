import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import IconButton from './icon_button';
import { defineMessages, injectIntl } from 'react-intl';
import ImmutablePureComponent from 'react-immutable-pure-component';

const messages = defineMessages({
  unmute_domain: { id: 'account.unmute_domain', defaultMessage: 'Unmute domain {domain}' },
  mute_domain_notifications: { id: 'account.mute_domain_notifications', defaultMessage: 'Mute domain notifications for {domain}' },
  unmute_domain_notifications: { id: 'account.unmute_domain_notifications', defaultMessage: 'Unmute domain notifications for {domain}' },
  exclude_domain_from_home_timeline: { id: 'account.exclude_domain_from_home_timeline', defaultMessage: 'Exclude domain {domain} from home timeline' },
  include_domain_from_home_timeline: { id: 'account.include_domain_from_home_timeline', defaultMessage: 'Include domain {domain} from home timeline' },
});

export default @injectIntl
class MutedDomain extends ImmutablePureComponent {

  static propTypes = {
    domain: ImmutablePropTypes.map,
    onUnmuteDomain: PropTypes.func.isRequired,
    onMuteDomainNotifications: PropTypes.func.isRequired,
    onExcludeDomainHomeTimeline: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  handleDomainUnmute = () => {
    this.props.onUnmuteDomain(this.props.domain);
  };

  handleDomainMuteNotifications = () => {
    this.props.onMuteDomainNotifications(this.props.domain.domain, true);
  };

  handleDomainUnmuteNotifications = () => {
    this.props.onMuteDomainNotifications(this.props.domain.domain, false);
  };

  handleDomainExcludeHomeTimeline = () => {
    this.props.onExcludeDomainHomeTimeline(this.props.domain.domain, true);
  };

  handleDomainIncludeHomeTimeline = () => {
    this.props.onExcludeDomainHomeTimeline(this.props.domain.domain, false);
  };

  render () {
    const { domain: { domain, hide_notifications, hide_from_home }, intl } = this.props;

    const buttons = [];
    if (hide_from_home) {
      buttons.push(
        <IconButton active icon='eye' title={intl.formatMessage(messages.include_domain_from_home_timeline, { domain })} onClick={this.handleDomainIncludeHomeTimeline} />,
      );
    } else {
      buttons.push(
        <IconButton active icon='eye-slash' title={intl.formatMessage(messages.exclude_domain_from_home_timeline, { domain })} onClick={this.handleDomainExcludeHomeTimeline} />,
      );
    }

    if (hide_notifications) {
      buttons.push(
        <IconButton active icon='bell' title={intl.formatMessage(messages.unmute_domain_notifications, { domain })} onClick={this.handleDomainUnmuteNotifications} />,
      );
    } else {
      buttons.push(
        <IconButton active icon='bell-slash' title={intl.formatMessage(messages.mute_domain_notifications, { domain })} onClick={this.handleDomainMuteNotifications} />,
      );
    }

    buttons.push(
      <IconButton active icon='volume-up' title={intl.formatMessage(messages.unmute_domain, { domain })} onClick={this.handleDomainUnmute} />,
    );

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
