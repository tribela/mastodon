import { useCallback } from 'react';

import { defineMessages, useIntl, FormattedMessage } from 'react-intl';

import { unmuteDomain } from 'flavours/glitch/actions/domain_mutes';
import { useAppDispatch } from 'flavours/glitch/store';

import { Button } from './button';

const messages = defineMessages({
  hidden_from_home: {
    id: 'account.hidden_from_home',
    defaultMessage: 'Hidden from home timeline',
  },
});

export const MutedDomain: React.FC<{
  domain: string;
  hide_from_home: boolean;
}> = ({ domain, hide_from_home }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const handleDomainUnmute = useCallback(() => {
    dispatch(unmuteDomain(domain));
  }, [dispatch, domain]);

  let hide_home_tl;
  if (hide_from_home) {
    hide_home_tl = <> · {intl.formatMessage(messages.hidden_from_home)}</>;
  }

  return (
    <div className='domain'>
      <div className='domain__domain-name'>
        <strong>{domain}</strong>
        <span>{hide_home_tl}</span>
      </div>

      <div className='domain__buttons'>
        <Button onClick={handleDomainUnmute}>
          <FormattedMessage
            id='account.unmute_domain_short'
            defaultMessage='Unmute'
          />
        </Button>
      </div>
    </div>
  );
};
