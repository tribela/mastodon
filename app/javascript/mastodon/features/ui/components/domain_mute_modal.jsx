import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

import { defineMessages, useIntl, FormattedMessage } from 'react-intl';

import classNames from 'classnames';

import { useDispatch } from 'react-redux';

import HomeIcon from '@/material-icons/400-24px/home.svg?react';
import VisibilityOffIcon from '@/material-icons/400-24px/visibility_off.svg?react';
import VolumeOffIcon from '@/material-icons/400-24px/volume_off.svg?react';
import { muteDomain } from 'mastodon/actions/domain_mutes';
import { closeModal } from 'mastodon/actions/modal';
import { Button } from 'mastodon/components/button';
import { CheckBox } from 'mastodon/components/check_box';
import { Icon } from 'mastodon/components/icon';

const messages = defineMessages({
  hideFromHome: { id: 'domain_mute_modal.hide_from_home', defaultMessage: 'Also hide from home timeline unless you followed them' },
  confirm: { id: 'confirmations.domain_mute.confirm', defaultMessage: 'Mute domain' },
});

export const DomainMuteModal = ({ domain }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [hideFromHome, setHideFromHome] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    dispatch(closeModal({ modalType: undefined, ignoreFocus: false }));
    dispatch(muteDomain(domain, hideFromHome));
  }, [dispatch, domain, hideFromHome]);

  const handleCancel = useCallback(() => {
    dispatch(closeModal({ modalType: undefined, ignoreFocus: false }));
  }, [dispatch]);

  const handleToggleHideFromHome = useCallback(({ target }) => {
    setHideFromHome(target.checked);
  }, [setHideFromHome]);

  const handleToggleSettings = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  return (
    <div className='modal-root__modal safety-action-modal'>
      <div className='safety-action-modal__top'>
        <div className='safety-action-modal__header'>
          <div className='safety-action-modal__header__icon'>
            <Icon icon={VolumeOffIcon} />
          </div>

          <div>
            <h1><FormattedMessage id='domain_mute_modal.title' defaultMessage='Mute domain?' /></h1>
            <div>{domain}</div>
          </div>
        </div>

        <div className='safety-action-modal__bullet-points'>
          <div>
            <div className='safety-action-modal__bullet-points__icon'><Icon icon={VisibilityOffIcon} /></div>
            <div><FormattedMessage id='domain_mute_modal.you_wont_see_posts' defaultMessage='You will not see their posts on public timelines.' /></div>
          </div>
        </div>

        <div className='safety-action-modal__bullet-points'>
          <div>
            <div className='safety-action-modal__bullet-points__icon'><Icon icon={HomeIcon} /></div>
            <div><FormattedMessage id='domain_mute_modal.still_on_home' defaultMessage='You still see their posts from home timeline.' /></div>
          </div>
        </div>
      </div>

      <div className={classNames('safety-action-modal__bottom', { active: expanded })}>
        <div className='safety-action-modal__bottom__collapsible'>

          <div className='safety-action-modal__field-group'>
            <CheckBox label={intl.formatMessage(messages.hideFromHome)} checked={hideFromHome} onChange={handleToggleHideFromHome} />
          </div>
        </div>

        <div className='safety-action-modal__actions'>
          <button type='button' onClick={handleToggleSettings} className='link-button'>
            {expanded ? <FormattedMessage id='mute_modal.hide_options' defaultMessage='Hide options' /> : <FormattedMessage id='mute_modal.show_options' defaultMessage='Show options' />}
          </button>

          <div className='spacer' />

          <button type='button' onClick={handleCancel} className='link-button'>
            <FormattedMessage id='confirmation_modal.cancel' defaultMessage='Cancel' />
          </button>

          <Button onClick={handleClick}>
            <FormattedMessage id='confirmations.domain_mute.confirm' defaultMessage='Mute domain' />
          </Button>
        </div>
      </div>
    </div>
  );
};

DomainMuteModal.propTypes = {
  domain: PropTypes.string.isRequired,
};

export default DomainMuteModal;
