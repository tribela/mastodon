import React from 'react';
import { connect } from 'react-redux';
import { muteDomain, unmuteDomain, muteDomainNotifications, excludeDomainHomeTimeline } from '../actions/domain_mutes';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import MutedDomain from '../components/muted_domain';
import { openModal } from '../actions/modal';

const messages = defineMessages({
  muteDomainConfirm: { id: 'confirmations.domain_mute.confirm', defaultMessage: 'Mute entire domain' },
});

const makeMapStateToProps = () => {
  const mapStateToProps = () => ({});

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch, { intl }) => ({
  onMuteDomain (domain) {
    dispatch(openModal('CONFIRM', {
      message: <FormattedMessage id='confirmations.domain_mute.message' defaultMessage='Are you really, really sure you want to mute the entire {domain}? In most cases a few targeted mutes are sufficient and preferable. You will not see content from that domain in any public timelines.' values={{ domain: <strong>{domain}</strong> }} />,
      confirm: intl.formatMessage(messages.muteDomainConfirm),
      onConfirm: () => dispatch(muteDomain(domain)),
    }));
  },

  onUnmuteDomain (domain) {
    dispatch(unmuteDomain(domain));
  },

  onMuteDomainNotifications (domain, muteNotifications) {
    dispatch(muteDomainNotifications(domain, muteNotifications));
  },

  onExcludeDomainHomeTimeline (domain, excludeHomeTimeline) {
    dispatch(excludeDomainHomeTimeline(domain, excludeHomeTimeline));
  },
});

export default injectIntl(connect(makeMapStateToProps, mapDispatchToProps)(MutedDomain));
