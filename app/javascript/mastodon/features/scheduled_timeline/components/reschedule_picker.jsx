import PropTypes from 'prop-types';
import { useCallback, useState, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Popover } from 'mastodon/components/popover';
import { Icon } from 'mastodon/components/icon';
import CalendarTodayIcon from '@/material-icons/400-24px/calendar_today.svg?react';

const messages = defineMessages({
  reschedule: { id: 'scheduled_status.reschedule', defaultMessage: 'Change time' },
  schedule_for: { id: 'compose_form.schedule_for', defaultMessage: 'Schedule for' },
  set_schedule: { id: 'compose_form.set_schedule', defaultMessage: 'Set' },
  schedule_min_warning: {
    id: 'compose_form.schedule_min_warning',
    defaultMessage: 'Must be at least 5 minutes from now',
  },
});

const MIN_OFFSET_MINUTES = 5;

function getMinDatetime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + MIN_OFFSET_MINUTES);
  d.setSeconds(0, 0);
  return d;
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

export function ReschedulePicker({ scheduledAt, onReschedule, disabled }) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const initialValue = toDatetimeLocal(scheduledAt);
  const [inputValue, setInputValue] = useState(initialValue);
  const [popoverTarget, setPopoverTarget] = useState(null);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    setInputValue(initialValue);
  }, [scheduledAt, initialValue]);

  useEffect(() => {
    if (!open) {
      setInputValue(initialValue);
    }
  }, [open, scheduledAt, initialValue]);

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
      onReschedule(iso);
    }
    setOpen(false);
  };

  const handleToggleOpen = () => {
    if (!open) {
      setInputValue(initialValue);
    }
    setOpen(!open);
  };

  return (
    <div className='schedule-button reschedule-picker' ref={setPopoverTarget}>
      <button
        type='button'
        className={classNames('icon-button', { active: open })}
        onClick={handleToggleOpen}
        disabled={disabled}
        title={intl.formatMessage(messages.reschedule)}
      >
        <Icon id='calendar' icon={CalendarTodayIcon} />
      </button>
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

ReschedulePicker.propTypes = {
  scheduledAt: PropTypes.string.isRequired,
  onReschedule: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
