import api, { getLinks } from '../api';

import { excludeDomainHomeTimelineSuccess, muteDomainSuccess, unmuteDomainSuccess } from "./domain_mutes_typed";
import { openModal } from './modal';


export * from "./domain_mutes_typed";

export const DOMAIN_MUTE_REQUEST = 'DOMAIN_MUTE_REQUEST';
export const DOMAIN_MUTE_FAIL    = 'DOMAIN_MUTE_FAIL';

export const DOMAIN_MUTE_HOME_TIMELINE_REQUEST = 'DOMAIN_MUTE_HOME_TIMELINE_REQUEST';
export const DOMAIN_MUTE_HOME_TIMELINE_FAIL    = 'DOMAIN_MUTE_HOME_TIMELINE_FAIL';

export const DOMAIN_UNMUTE_REQUEST = 'DOMAIN_UNMUTE_REQUEST';
export const DOMAIN_UNMUTE_FAIL    = 'DOMAIN_UNMUTE_FAIL';

export function muteDomain(domain, hideFromHome) {
  return (dispatch, getState) => {
    dispatch(muteDomainRequest(domain));

    api().post('/api/v1/domain_mutes', { domain, hide_from_home: hideFromHome }).then(() => {
      const at_domain = '@' + domain;
      const accounts = getState().get('accounts').filter(item => item.get('acct').endsWith(at_domain)).valueSeq().map(item => item.get('id'));

      dispatch(muteDomainSuccess({domain, accounts, hideFromHome}));
    }).catch(err => {
      dispatch(muteDomainFail(domain, err));
    });
  };
}

export function excludeDomainHomeTimeline(domain, excludeHomeTimeline) {
  return (dispatch, getState) => {
    dispatch(excludeDomainHomeTimelineRequest(domain, excludeHomeTimeline));

    api().post('/api/v1/domain_mutes', { domain, hide_from_home: excludeHomeTimeline }).then(() => {
      const at_domain = '@' + domain;
      const accounts = getState().get('accounts').filter(item => item.get('acct').endsWith(at_domain)).valueSeq().map(item => item.get('id'));

      dispatch(excludeDomainHomeTimelineSuccess(domain, excludeHomeTimeline, accounts));
    }).catch(err => {
      dispatch(excludeDomainHomeTimelineFail(domain, excludeHomeTimeline, err));
    });
  };
}

export function muteDomainRequest(domain) {
  return {
    type: DOMAIN_MUTE_REQUEST,
    domain,
  };
}

export function excludeDomainHomeTimelineRequest(domain, excludeHomeTimeline) {
  return {
    type: DOMAIN_MUTE_HOME_TIMELINE_REQUEST,
    domain,
    home_timeline: excludeHomeTimeline,
  };
}

export function muteDomainFail(domain, error) {
  return {
    type: DOMAIN_MUTE_FAIL,
    domain,
    error,
  };
}

export function excludeDomainHomeTimelineFail(domain, excludeHomeTimeline, error) {
  return {
    type: DOMAIN_MUTE_HOME_TIMELINE_FAIL,
    domain,
    homeTimeline: excludeHomeTimeline,
    error,
  };
}

export function unmuteDomain(domain) {
  return (dispatch, getState) => {
    dispatch(unmuteDomainRequest(domain));

    api().delete('/api/v1/domain_mutes', { params: { domain } }).then(() => {
      const at_domain = '@' + domain;
      const accounts = getState().get('accounts').filter(item => item.get('acct').endsWith(at_domain)).valueSeq().map(item => item.get('id'));
      dispatch(unmuteDomainSuccess({domain, accounts}));
    }).catch(err => {
      dispatch(unmuteDomainFail(domain, err));
    });
  };
}

export function unmuteDomainRequest(domain) {
  return {
    type: DOMAIN_UNMUTE_REQUEST,
    domain,
  };
}

export function unmuteDomainFail(domain, error) {
  return {
    type: DOMAIN_UNMUTE_FAIL,
    domain,
    error,
  };
}

export const initDomainMuteModal = account => dispatch => dispatch(openModal({
  modalType: 'DOMAIN_MUTE',
  modalProps: {
    domain: account.get('acct').split('@')[1],
    acct: account.get('acct'),
    accountId: account.get('id'),
  },
}));
