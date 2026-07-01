import PropTypes from 'prop-types';
import { useCallback, useState, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Popover } from 'mastodon/components/popover';
import { Icon } from 'mastodon/components/icon';
import CalendarTodayIcon from '@/material-icons/400-24px/calendar_today.svg?react';

const messages = defineMessages({
  schedule: { id: 'compose_form.schedule', defaultMessage: 'Schedule' },
  immediate: { id: 'compose_form.schedule_immediate', defaultMessage: 'Now' },
  schedule_for: { id: 'compose_form.schedule_for', defaultMessage: 'Schedule for' },
  set_schedule: { id: 'compose_form.set_schedule', defaultMessage: 'Set' },
  clear_schedule: { id: 'compose_form.clear_schedule', defaultMessage: 'Clear' },
  schedule_min_warning: {
    id: 'compose_form.schedule_min_warning',
    defaultMessage: 'Must be at least 5 minutes from now',
  },
  reschedule: { id: 'scheduled_status.reschedule', defaultMessage: 'Change time' },
});

const MIN_OFFSET_MINUTES = 5;

function getMinDatetime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + MIN_OFFSET_MINUTES);
  d.setSeconds(0, 0);
  return d;
}

function getDefaultScheduleDatetime() {
  return toDatetimeLocal(getMinDatetime().toISOString());
}

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function ScheduleButton({ scheduledAt, onScheduleChange, disabled, isEditing, iconOnly }) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() => toDatetimeLocal(scheduledAt));
  const [popoverTarget, setPopoverTarget] = useState(null);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    setInputValue(toDatetimeLocal(scheduledAt));
  }, [scheduledAt]);

  useEffect(() => {
    if (!open) {
      setInputValue(toDatetimeLocal(scheduledAt));
    }
  }, [open, scheduledAt]);

  if (isEditing) {
    return null;
  }

  const minDate = getMinDatetime();
  const minDatetime = toDatetimeLocal(minDate.toISOString());
  const minTimestamp = minDate.getTime();
  const parsedTime = fromDatetimeLocal(inputValue);
  const isTooEarly = parsedTime ? new Date(parsedTime).getTime() < minTimestamp : false;

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleConfirm = () => {
    const iso = fromDatetimeLocal(inputValue);
    if (iso && !isTooEarly) {
      onScheduleChange(iso);
    }
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onScheduleChange(null);
    setInputValue('');
    setOpen(false);
  };

  const scheduledLabel = scheduledAt
    ? new Date(scheduledAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : '';

  const handleToggleOpen = () => {
    if (!open && !scheduledAt) {
      setInputValue(getDefaultScheduleDatetime());
    }
    setOpen(!open);
  };

  const triggerButton = iconOnly ? (
    <button
      type='button'
      className={classNames('icon-button', 'schedule-button__scheduled', { active: open })}
      onClick={handleToggleOpen}
      disabled={disabled}
      title={intl.formatMessage(messages.reschedule)}
      aria-label={intl.formatMessage(messages.reschedule)}
    >
      <Icon id='schedule' icon={CalendarTodayIcon} />
    </button>
  ) : scheduledAt ? (
    <button
      type='button'
      className={classNames('dropdown-button', 'schedule-button__scheduled', { active: open })}
      onClick={handleToggleOpen}
      disabled={disabled}
      title={scheduledLabel}
    >
      <Icon id='schedule' icon={CalendarTodayIcon} />
      <span className='dropdown-button__label' title={scheduledLabel}>
        {scheduledLabel}
      </span>
    </button>
  ) : (
    <button
      type='button'
      className={classNames('dropdown-button', { active: open })}
      onClick={handleToggleOpen}
      disabled={disabled}
      title={intl.formatMessage(messages.schedule)}
    >
      <Icon id='schedule' icon={CalendarTodayIcon} />
      <span className='dropdown-button__label'>{intl.formatMessage(messages.immediate)}</span>
    </button>
  );

  return (
    <div className='schedule-button' ref={setPopoverTarget}>
      {triggerButton}
      <Popover
        isOpen={open}
        offset={5}
        reference={popoverTarget}
        onClose={handleClose}
      >
        {({ props, placement }) => (
          <div {...props}>
            <div
              className={classNames('dropdown-animation', 'schedule-button__dropdown', placement)}
            >
              <label className='schedule-button__label-text'>
                {intl.formatMessage(messages.schedule_for)}
              </label>
              <input
                type='datetime-local'
                className={classNames('schedule-button__input', { 'schedule-button__input--error': isTooEarly })}
                value={inputValue}
                min={minDatetime}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!isTooEarly) handleConfirm();
                  }
                }}
                autoFocus
              />
              {isTooEarly && (
                <span className='schedule-button__warning' role='alert'>
                  {intl.formatMessage(messages.schedule_min_warning)}
                </span>
              )}
              <div className='schedule-button__dropdown-actions'>
                {!iconOnly && (
                  <button
                    type='button'
                    className='schedule-button__clear'
                    onClick={handleClear}
                  >
                    {intl.formatMessage(messages.clear_schedule)}
                  </button>
                )}
                <button
                  type='button'
                  className='schedule-button__confirm'
                  onClick={handleConfirm}
                  disabled={!parsedTime || isTooEarly}
                >
                  {intl.formatMessage(messages.set_schedule)}
                </button>
              </div>
            </div>
          </div>
        )}
      </Popover>
    </div>
  );
}

ScheduleButton.propTypes = {
  scheduledAt: PropTypes.string,
  onScheduleChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isEditing: PropTypes.bool,
  iconOnly: PropTypes.bool,
};
