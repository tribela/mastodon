import { useEffect, useRef, useCallback, useState } from 'react';

import { defineMessages, useIntl, FormattedMessage } from 'react-intl';

import { Helmet } from 'react-helmet';

import VisibilityOffIcon from '@/material-icons/400-24px/visibility_off.svg?react';
import { apiGetDomainmutes } from 'mastodon/api/domain_mutes';
import type { ApiDomainMuteJSON } from 'mastodon/api_types/domain_mute';
import { Column } from 'mastodon/components/column';
import type { ColumnRef } from 'mastodon/components/column';
import { ColumnHeader } from 'mastodon/components/column_header';
import { MutedDomain } from 'mastodon/components/muted_domain';
import ScrollableList from 'mastodon/components/scrollable_list';

const messages = defineMessages({
  heading: { id: 'column.domain_mutes', defaultMessage: 'Muted domains' },
});

const Mutes: React.FC<{ multiColumn: boolean }> = ({ multiColumn }) => {
  const intl = useIntl();
  const [domains, setDomains] = useState<ApiDomainMuteJSON[]>([]);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string | undefined>();
  const hasMore = !!next;
  const columnRef = useRef<ColumnRef>(null);

  useEffect(() => {
    setLoading(true);

    void apiGetDomainmutes()
      .then(({ domains, links }) => {
        const next = links.refs.find((link) => link.rel === 'next');

        setLoading(false);
        setDomains(domains);
        setNext(next?.uri);

        return '';
      })
      .catch(() => {
        setLoading(false);
      });
  }, [setLoading, setDomains, setNext]);

  const handleLoadMore = useCallback(() => {
    setLoading(true);

    void apiGetDomainmutes(next)
      .then(({ domains, links }) => {
        const next = links.refs.find((link) => link.rel === 'next');

        setLoading(false);
        setDomains((previousDomains) => [...previousDomains, ...domains]);
        setNext(next?.uri);

        return '';
      })
      .catch(() => {
        setLoading(false);
      });
  }, [setLoading, setDomains, setNext, next]);

  const handleHeaderClick = useCallback(() => {
    columnRef.current?.scrollTop();
  }, []);

  const emptyMessage = (
    <FormattedMessage
      id='empty_column.domain_mutes'
      defaultMessage='There are no blocked domains yet.'
    />
  );

  return (
    <Column
      bindToDocument={!multiColumn}
      ref={columnRef}
      label={intl.formatMessage(messages.heading)}
    >
      <ColumnHeader
        icon='ban'
        iconComponent={VisibilityOffIcon}
        title={intl.formatMessage(messages.heading)}
        onClick={handleHeaderClick}
        multiColumn={multiColumn}
        showBackButton
      />

      <ScrollableList
        scrollKey='domain_mutes'
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={loading}
        showLoading={loading && domains.length === 0}
        emptyMessage={emptyMessage}
        trackScroll={!multiColumn}
        bindToDocument={!multiColumn}
      >
        {domains.map((domain) => (
          <MutedDomain
            key={domain.domain}
            domain={domain.domain}
            hide_from_home={domain.hide_from_home}
          />
        ))}
      </ScrollableList>

      <Helmet>
        <title>{intl.formatMessage(messages.heading)}</title>
        <meta name='robots' content='noindex' />
      </Helmet>
    </Column>
  );
};

// eslint-disable-next-line import/no-default-export
export default Mutes;
