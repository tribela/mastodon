import React from 'react';
import { connect } from 'react-redux';
import { blockDomain, unblockDomain } from '../actions/domain_blocks';
import { muteDomain, unmuteDomain } from '../actions/domain_mutes';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import Domain from '../components/domain';
import { openModal } from '../actions/modal';

const messages = defineMessages({
  blockDomainConfirm: { id: 'confirmations.domain_block.confirm', defaultMessage: 'Block entire domain' },
  muteDomainConfirm: { id: 'confirmations.domain_mute.confirm', defaultMessage: 'Mute entire domain' },
});

const makeMapStateToProps = () => {
  const mapStateToProps = () => ({});

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch, { intl }) => ({
  onBlockDomain (domain) {
    dispatch(openModal('CONFIRM', {
      message: <FormattedMessage id='confirmations.domain_block.message' defaultMessage='Are you really, really sure you want to block the entire {domain}? In most cases a few targeted blocks or mutes are sufficient and preferable.' values={{ domain: <strong>{domain}</strong> }} />,
      confirm: intl.formatMessage(messages.blockDomainConfirm),
      onConfirm: () => dispatch(blockDomain(domain)),
    }));
  },

  onUnblockDomain (domain) {
    dispatch(unblockDomain(domain));
  },

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
});

export default injectIntl(connect(makeMapStateToProps, mapDispatchToProps)(Domain));
