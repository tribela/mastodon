import { defineMessages } from 'react-intl';
import type { MessageDescriptor } from 'react-intl';

import { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';

interface Alert {
  title: string | MessageDescriptor;
  message: string | MessageDescriptor;
  values?: Record<string, string | number | Date>;
}

interface ApiErrorResponse {
  error?: string;
}

const messages = defineMessages({
  unexpectedTitle: { id: 'alert.unexpected.title', defaultMessage: 'Oops!' },
  unexpectedMessage: {
    id: 'alert.unexpected.message',
    defaultMessage: 'An unexpected error occurred.',
  },
  rateLimitedTitle: {
    id: 'alert.rate_limited.title',
    defaultMessage: 'Rate limited',
  },
  rateLimitedMessage: {
    id: 'alert.rate_limited.message',
    defaultMessage: 'Please retry after {retry_time, time, medium}.',
  },
});

export const ALERT_SHOW = 'ALERT_SHOW';
export const ALERT_DISMISS = 'ALERT_DISMISS';
export const ALERT_CLEAR = 'ALERT_CLEAR';
export const ALERT_NOOP = 'ALERT_NOOP';

export const dismissAlert = (alert: Alert) => ({
  type: ALERT_DISMISS,
  alert,
});

export const clearAlert = () => ({
  type: ALERT_CLEAR,
});

export const showAlert = (alert: Alert) => ({
  type: ALERT_SHOW,
  alert,
});

export const showAlertForError = (error: unknown, skipNotFound = false) => {
  if (error instanceof AxiosError && error.response) {
    const { status, statusText, headers } = error.response;
    const { data } = error.response as AxiosResponse<ApiErrorResponse>;

    // Skip these errors as they are reflected in the UI
    if (skipNotFound && (status === 404 || status === 410)) {
      return { type: ALERT_NOOP };
    }

    // Rate limit errors
    if (status === 429 && headers['x-ratelimit-reset']) {
      return showAlert({
        title: messages.rateLimitedTitle,
        message: messages.rateLimitedMessage,
        values: {
          retry_time: new Date(headers['x-ratelimit-reset'] as string),
        },
      });
    }

    return showAlert({
      title: `${status}`,
      message: data.error ?? statusText,
    });
  }

  // An aborted request, e.g. due to reloading the browser window, it not really error
  if (error instanceof AxiosError && error.code === AxiosError.ECONNABORTED) {
    return { type: ALERT_NOOP };
  }

  console.error(error);

  return showAlert({
    title: messages.unexpectedTitle,
    message: messages.unexpectedMessage,
  });
};
