import { createAction } from '@reduxjs/toolkit';

import type { Account } from 'mastodon/models/account';

export const muteDomainSuccess = createAction<{
  domain: string;
  accounts: Account[];
  excludeHomeTl: boolean;
}>('domain_mutes/mute/SUCCESS');

export const unmuteDomainSuccess = createAction<{
  domain: string;
  accounts: Account[];
}>('domain_mutes/unmute/SUCCESS');

export const excludeDomainHomeTimelineSuccess = createAction<{
  domain: string;
  excludeHomeTineline: boolean;
  accounts: Account[];
}>('domain_mutes/exclude_domain_home_timeline/SUCCESS');
