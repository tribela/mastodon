# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Domain mutes' do
  include_context 'with API authentication', oauth_scopes: 'read:mutes write:mutes'

  describe 'GET /api/v1/domain_mutes' do
    subject do
      get '/api/v1/domain_mutes', headers: headers, params: params
    end

    let(:muted_domains) { ['example.com', 'example.net', 'example.org', 'example.com.br'] }
    let(:params) { {} }

    before do
      muted_domains.each { |domain| user.account.mute_domain!(domain) }
    end

    it_behaves_like 'forbidden for wrong scope', 'write:mutes'

    it 'returns the domains muted by the requesting user', :aggregate_failures do
      subject

      expect(response).to have_http_status(200)
      expect(response.content_type)
        .to start_with('application/json')
      expect(response.parsed_body.pluck(:domain)).to match_array(muted_domains)
    end

    context 'with limit param' do
      let(:params) { { limit: 2 } }

      it 'returns only the requested number of muted domains' do
        subject

        expect(response.parsed_body.size).to eq(params[:limit])
      end
    end
  end

  describe 'POST /api/v1/domain_mutes' do
    subject do
      post '/api/v1/domain_mutes', headers: headers, params: params
    end

    let(:params) { { domain: 'example.com' } }

    it_behaves_like 'forbidden for wrong scope', 'read read:mutes'

    it 'creates a domain mute', :aggregate_failures do
      subject

      expect(response).to have_http_status(200)
      expect(response.content_type)
        .to start_with('application/json')
      expect(user.account.domain_mutes.exists?(domain: params[:domain])).to be(true)
    end

    context 'with hide_from_home param' do
      let(:params) { { domain: 'example.com', hide_from_home: true } }

      it 'creates a domain mute with hide_from_home set', :aggregate_failures do
        subject

        expect(response).to have_http_status(200)
        expect(user.account.domain_mutes.find_by(domain: params[:domain]).hide_from_home).to be(true)
      end
    end

    context 'when no domain name is given' do
      let(:params) { { domain: '' } }

      it 'returns http unprocessable entity' do
        subject

        expect(response).to have_http_status(422)
        expect(response.content_type)
          .to start_with('application/json')
      end
    end

    context 'when the given domain name is invalid' do
      let(:params) { { domain: 'example com' } }

      it 'returns unprocessable entity' do
        subject

        expect(response).to have_http_status(422)
        expect(response.content_type)
          .to start_with('application/json')
      end
    end
  end

  describe 'DELETE /api/v1/domain_mutes' do
    subject do
      delete '/api/v1/domain_mutes/', headers: headers, params: params
    end

    let(:params) { { domain: 'example.com' } }

    before do
      user.account.mute_domain!('example.com')
    end

    it_behaves_like 'forbidden for wrong scope', 'read read:mutes'

    it 'deletes the specified domain mute', :aggregate_failures do
      subject

      expect(response).to have_http_status(200)
      expect(response.content_type)
        .to start_with('application/json')
      expect(user.account.domain_mutes.exists?(domain: 'example.com')).to be(false)
    end

    context 'when the given domain name is not muted' do
      let(:params) { { domain: 'example.org' } }

      it 'returns http success' do
        subject

        expect(response).to have_http_status(200)
        expect(response.content_type)
          .to start_with('application/json')
      end
    end
  end
end
