import type React from 'react';
import { useCallback, useId, useState } from 'react';

import { FormattedMessage } from 'react-intl';

import { Button } from '@/flavours/glitch/components/button/redesign';
import { TextInput } from '@/flavours/glitch/components/form_fields/redesign';
import {
  Menu,
  MenuList,
  MenuTrigger,
  useMenuContext,
} from '@/flavours/glitch/components/menu';
import CalendarTodayIcon from '@/material-icons/400-24px/calendar_today.svg?react';

import classes from './styles.module.scss';

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

function toDatetimeLocal(isoString?: string | null) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

interface ScheduleButtonProps {
  scheduledAt?: string | null;
  onScheduleChange: (scheduledAt: string | null) => void;
}

export const ScheduleButton: React.FC<ScheduleButtonProps> = ({
  scheduledAt,
  onScheduleChange,
}) => {
  const scheduledLabel = scheduledAt
    ? new Date(scheduledAt).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

  return (
    <Menu noFocus>
      <MenuTrigger
        size='sm'
        leadingIcon={CalendarTodayIcon}
        title={scheduledAt ? scheduledLabel : undefined}
      >
        {scheduledAt ? (
          scheduledLabel
        ) : (
          <FormattedMessage
            id='compose_form.schedule_immediate'
            defaultMessage='Now'
          />
        )}
      </MenuTrigger>

      <MenuList placement='bottom-start' offset={4} maxWidth={280}>
        <ScheduleDropdownOpener
          scheduledAt={scheduledAt}
          onScheduleChange={onScheduleChange}
        />
      </MenuList>
    </Menu>
  );
};

// Reads the menu open state from inside <Menu> (hooks cannot be called in
// ScheduleButton itself, as it renders the provider) and remounts the
// dropdown on every open/close, so the input always starts from the current
// value (or the minimum offset default when unset).
const ScheduleDropdownOpener: React.FC<{
  scheduledAt?: string | null;
  onScheduleChange: (scheduledAt: string | null) => void;
}> = ({ scheduledAt, onScheduleChange }) => {
  const { popover } = useMenuContext();

  return (
    <ScheduleDropdown
      key={popover.isMenuOpen ? `open-${scheduledAt ?? 'new'}` : 'closed'}
      scheduledAt={scheduledAt}
      onScheduleChange={onScheduleChange}
    />
  );
};

const ScheduleDropdown: React.FC<{
  scheduledAt?: string | null;
  onScheduleChange: (scheduledAt: string | null) => void;
}> = ({ scheduledAt, onScheduleChange }) => {
  const { popover } = useMenuContext();
  const [inputValue, setInputValue] = useState(
    () => toDatetimeLocal(scheduledAt) || getDefaultScheduleDatetime(),
  );

  const minDate = getMinDatetime();
  const minDatetime = toDatetimeLocal(minDate.toISOString());
  const minTimestamp = minDate.getTime();
  const parsedTime = fromDatetimeLocal(inputValue);
  const isTooEarly = parsedTime
    ? new Date(parsedTime).getTime() < minTimestamp
    : false;

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      setInputValue(e.target.value);
    }, []);

  const handleConfirm = useCallback(() => {
    const iso = fromDatetimeLocal(inputValue);
    if (iso && !isTooEarly) {
      onScheduleChange(iso);
    }
    popover.closeMenu();
  }, [inputValue, isTooEarly, onScheduleChange, popover]);

  const handleClear = useCallback(() => {
    onScheduleChange(null);
    popover.closeMenu();
  }, [onScheduleChange, popover]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!isTooEarly) handleConfirm();
        }
      },
      [isTooEarly, handleConfirm],
    );

  const inputId = useId();

  return (
    <div className={classes.scheduleDropdown}>
      <label htmlFor={inputId} className={classes.scheduleLabel}>
        <FormattedMessage
          id='compose_form.schedule_for'
          defaultMessage='Schedule for'
        />
      </label>

      <TextInput
        id={inputId}
        type='datetime-local'
        value={inputValue}
        min={minDatetime}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- matches the legacy schedule popover, which focuses the datetime input on open
        autoFocus
      />

      {isTooEarly && (
        <span className={classes.scheduleWarning} role='alert'>
          <FormattedMessage
            id='compose_form.schedule_min_warning'
            defaultMessage='Must be at least 5 minutes from now'
          />
        </span>
      )}

      <div className={classes.scheduleActions}>
        <Button size='sm' variant='ghost' onClick={handleClear}>
          <FormattedMessage
            id='compose_form.clear_schedule'
            defaultMessage='Clear'
          />
        </Button>
        <Button
          size='sm'
          variant='solid'
          onClick={handleConfirm}
          disabled={!parsedTime || isTooEarly}
        >
          <FormattedMessage
            id='compose_form.set_schedule'
            defaultMessage='Set'
          />
        </Button>
      </div>
    </div>
  );
};
