import api, { getLinks } from 'flavours/glitch/api';
import type { ApiDomainMuteJSON } from 'flavours/glitch/api_types/domain_mute';

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
