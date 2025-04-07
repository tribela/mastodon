import api, { getLinks } from 'mastodon/api';
import type { ApiDomainMuteJSON } from 'mastodon/api_types/domain_mute';

export const apiGetDomainmutes = async (url?: string) => {
  const response = await api().request<ApiDomainMuteJSON[]>({
    method: 'GET',
    url: url ?? '/api/v1/domain_mutes',
  });

  return {
    domains: response.data,
    links: getLinks(response),
  };
};
