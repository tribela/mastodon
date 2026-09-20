import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';

import CalendarTodayIcon from '@/material-icons/400-24px/calendar_today.svg?react';
import DeleteIcon from '@/material-icons/400-24px/delete.svg?react';
import EditIcon from '@/material-icons/400-24px/edit.svg?react';
import { Icon } from 'flavours/glitch/components/icon';
import { LanguageIcon } from 'flavours/glitch/components/status/legacy/icons';
import { RelativeTimestamp } from 'flavours/glitch/components/relative_timestamp';
import { VisibilityIcon } from 'flavours/glitch/components/visibility_icon';
import MediaGallery from 'flavours/glitch/components/media_gallery';
import { VisibilityQuoteLabel } from 'flavours/glitch/features/compose/components/visibility_button';
import { openModal } from 'flavours/glitch/actions/modal';
import { setComposeToScheduledStatus } from 'flavours/glitch/actions/scheduled_statuses';
import { deleteScheduledStatus, updateScheduledStatus } from 'flavours/glitch/actions/scheduled_statuses';
import { me } from 'flavours/glitch/initial_state';
import { ScheduleButton } from 'flavours/glitch/features/compose/components/schedule_button';

const messages = defineMessages({
  redraft: { id: 'scheduled_status.redraft', defaultMessage: 'Redraft' },
  reschedule: { id: 'scheduled_status.reschedule', defaultMessage: 'Change time' },
  delete: { id: 'scheduled_status.delete', defaultMessage: 'Remove' },
  deleteConfirm: { id: 'scheduled_status.delete_confirm', defaultMessage: 'Remove this scheduled post?' },
  pollOptions: { id: 'scheduled_status.poll_options', defaultMessage: 'Poll options' },
  pollDuration: { id: 'compose_form.poll.duration', defaultMessage: 'Poll length' },
  pollSingleChoice: { id: 'compose_form.poll.single', defaultMessage: 'Single choice' },
  pollMultipleChoice: { id: 'compose_form.poll.multiple', defaultMessage: 'Multiple choice' },
  minutes: { id: 'intervals.full.minutes', defaultMessage: '{number, plural, one {# minute} other {# minutes}}' },
  hours: { id: 'intervals.full.hours', defaultMessage: '{number, plural, one {# hour} other {# hours}}' },
  days: { id: 'intervals.full.days', defaultMessage: '{number, plural, one {# day} other {# days}}' },
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function ScheduledStatusCard({ scheduledStatus, account }) {
  const intl = useIntl();
  const dispatch = useDispatch();

  if (!account) return null;
  const paramsRaw = scheduledStatus.get('params');
  const getParam = (key, def = undefined) => {
    if (paramsRaw && typeof paramsRaw.get === 'function') return paramsRaw.get(key) ?? def;
    return (paramsRaw && paramsRaw[key]) ?? def;
  };
  const scheduledAt = scheduledStatus.get('scheduled_at');
  const id = scheduledStatus.get('id');
  const mediaAttachments = scheduledStatus.get('media_attachments');
  const textRaw = getParam('status') ?? getParam('text') ?? scheduledStatus.getIn(['params', 'status']) ?? scheduledStatus.getIn(['params', 'text']);
  const text = (textRaw != null && textRaw !== '') ? String(textRaw) : '';
  const spoilerText = getParam('spoiler_text') || '';
  const visibility = getParam('visibility') || 'public';
  const language = getParam('language');
  const poll = getParam('poll');
  const quoteApprovalPolicy = getParam('quote_approval_policy');

  const handleEdit = () => {
    dispatch(setComposeToScheduledStatus(scheduledStatus));
  };

  const handleReschedule = (iso) => {
    dispatch(updateScheduledStatus(id, iso));
  };

  const handleDelete = () => {
    if (window.confirm(intl.formatMessage(messages.deleteConfirm))) {
      dispatch(deleteScheduledStatus(id));
    }
  };

  const handleOpenMedia = (media, index, lang) => {
    dispatch(openModal({
      modalType: 'MEDIA',
      modalProps: { media, index, lang },
    }));
  };

  const validVisibility = visibility && ['public', 'unlisted', 'private', 'direct'].includes(visibility);
  const quotePolicy = (quoteApprovalPolicy === 'public' || quoteApprovalPolicy === 'followers' || quoteApprovalPolicy === 'nobody')
    ? quoteApprovalPolicy
    : 'nobody';

  return (
    <div className='status status-wrapper scheduled-status-card'>
      <div className='scheduled-status-card__meta'>
        <span className='status__info__time'>
          <Icon id='calendar' icon={CalendarTodayIcon} />
          <RelativeTimestamp timestamp={scheduledAt} futureDate />
        </span>
        {validVisibility && (
          <>
            <span className='status__visibility'>
              <VisibilityIcon visibility={visibility} />
            </span>
            <span className='scheduled-status-card__visibility-quote'>
              <VisibilityQuoteLabel visibility={visibility} quotePolicy={quotePolicy} />
            </span>
          </>
        )}
        {language && (
          <span className='status__language'>
            <LanguageIcon language={language} />
          </span>
        )}
      </div>

      <div className='status__content'>
        {spoilerText && (
          <div className='status__content__spoiler-wrapper'>
            <p className='status__content__spoiler-text'>{spoilerText}</p>
          </div>
        )}
        <div
          className={classNames('status__content__text', 'status__content__text--plain', 'status__content__text--visible')}
          dangerouslySetInnerHTML={{ __html: text ? escapeHtml(text).replace(/\n/g, '<br />') : '' }}
        />
        {poll && (() => {
          const options = poll.options ?? poll.get?.('options');
          const arr = Array.isArray(options) ? options : (options?.toArray?.() ?? []);
          const filtered = arr.filter(Boolean);
          const isMultiple = poll.multiple ?? poll.get?.('multiple');
          const expiresIn = poll.expires_in ?? poll.get?.('expires_in');
          if (filtered.length === 0) return null;

          const formatDuration = (seconds) => {
            if (seconds == null || seconds <= 0) return null;
            const n = Number(seconds);
            if (n < 3600) return intl.formatMessage(messages.minutes, { number: Math.round(n / 60) });
            if (n < 86400) return intl.formatMessage(messages.hours, { number: Math.round(n / 3600) });
            return intl.formatMessage(messages.days, { number: Math.round(n / 86400) });
          };

          const durationText = formatDuration(expiresIn);
          const getOptionTitle = (option) => (typeof option === 'string' ? option : (option?.title ?? option?.get?.('title') ?? String(option)));

          return (
            <div className='poll poll--preview'>
              <ul>
                {filtered.map((option, i) => (
                  <li key={i}>
                    <span className='poll__option'>
                      <span className='poll__option__text'>{getOptionTitle(option)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className='poll__footer'>
                <span>
                  {isMultiple
                    ? intl.formatMessage(messages.pollMultipleChoice)
                    : intl.formatMessage(messages.pollSingleChoice)}
                </span>
                {durationText && (
                  <>
                    <span> · </span>
                    <span>
                      {intl.formatMessage(messages.pollDuration)}: {durationText}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })()}
        {mediaAttachments && (mediaAttachments.size ?? mediaAttachments.length) > 0 && (
          <MediaGallery
            media={mediaAttachments}
            lang={language}
            sensitive={getParam('sensitive')}
            onOpenMedia={handleOpenMedia}
          />
        )}
      </div>

      <div className='status__action-bar scheduled-status-card__actions'>
        <button type='button' className='icon-button' onClick={handleEdit} title={intl.formatMessage(messages.redraft)}>
          <Icon id='edit' icon={EditIcon} />
        </button>
        <ScheduleButton
          scheduledAt={scheduledAt}
          onScheduleChange={handleReschedule}
          iconOnly
        />
        <button type='button' className='icon-button' onClick={handleDelete} title={intl.formatMessage(messages.delete)}>
          <Icon id='delete' icon={DeleteIcon} />
        </button>
      </div>
    </div>
  );
}

ScheduledStatusCard.propTypes = {
  scheduledStatus: ImmutablePropTypes.map.isRequired,
  account: ImmutablePropTypes.map.isRequired,
};
