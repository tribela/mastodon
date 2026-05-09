import PropTypes from 'prop-types';
import { useEffect, useRef, useCallback } from 'react';
import { defineMessages, useIntl, FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { List as ImmutableList } from 'immutable';

import CalendarTodayIcon from '@/material-icons/400-24px/calendar_today.svg?react';
import { addColumn, removeColumn, moveColumn } from 'mastodon/actions/columns';
import { fetchScheduledStatuses } from 'mastodon/actions/scheduled_statuses';
import { Helmet } from '@unhead/react/helmet';
import Column from 'mastodon/components/column';
import ColumnHeader from 'mastodon/components/column_header';
import { LoadingIndicator } from 'mastodon/components/loading_indicator';
import ScrollableList from 'mastodon/components/scrollable_list';
import { me } from 'mastodon/initial_state';

import { ScheduledStatusCard } from './components/scheduled_status_card';

const messages = defineMessages({
  title: { id: 'column.scheduled', defaultMessage: 'Scheduled posts' },
  empty: { id: 'empty_column.scheduled', defaultMessage: 'You don\'t have any scheduled posts.' },
});

const ScheduledTimeline = ({ columnId, multiColumn }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const columnRef = useRef();
  const items = useSelector(state => state.getIn(['scheduled_statuses', 'items'])) ?? ImmutableList();
  const isLoading = useSelector(state => state.getIn(['scheduled_statuses', 'isLoading']));
  const account = useSelector(state => state.getIn(['accounts', me]));

  const pinned = !!columnId;

  const handlePin = useCallback(() => {
    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('SCHEDULED', {}));
    }
  }, [dispatch, columnId]);

  const handleMove = useCallback((dir) => {
    dispatch(moveColumn(columnId, dir));
  }, [dispatch, columnId]);

  const handleHeaderClick = useCallback(() => {
    if (columnRef.current) columnRef.current.scrollTop();
  }, []);

  useEffect(() => {
    dispatch(fetchScheduledStatuses());
  }, [dispatch]);

  const setRef = useCallback((c) => {
    columnRef.current = c;
  }, []);

  const emptyMessage = <FormattedMessage {...messages.empty} />;

  return (
    <Column bindToDocument={!multiColumn} ref={setRef} label={intl.formatMessage(messages.title)}>
      <ColumnHeader
        icon='calendar'
        iconComponent={CalendarTodayIcon}
        title={intl.formatMessage(messages.title)}
        onPin={handlePin}
        onMove={handleMove}
        onClick={handleHeaderClick}
        pinned={pinned}
        multiColumn={multiColumn}
      />

      {isLoading && items.size === 0 ? (
        <LoadingIndicator />
      ) : (
        <ScrollableList
          scrollKey={`scheduled_timeline-${columnId || 'standalone'}`}
          trackScroll={false}
          emptyMessage={emptyMessage}
          bindToDocument={!multiColumn}
          showLoading={isLoading && items.size === 0}
        >
          {items.map(scheduledStatus => (
            <ScheduledStatusCard
              key={scheduledStatus.get('id')}
              scheduledStatus={scheduledStatus}
              account={account}
            />
          ))}
        </ScrollableList>
      )}

      <Helmet>
        <title>{intl.formatMessage(messages.title)}</title>
        <meta name='robots' content='noindex' />
      </Helmet>
    </Column>
  );
};

ScheduledTimeline.propTypes = {
  columnId: PropTypes.string,
  multiColumn: PropTypes.bool,
};

export default ScheduledTimeline;
