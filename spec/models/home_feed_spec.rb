# frozen_string_literal: true

require 'rails_helper'

RSpec.describe HomeFeed do
  subject { described_class.new(account) }

  let(:account) { Fabricate(:account) }
  let(:followed) { Fabricate(:account) }
  let(:other) { Fabricate(:account) }

  describe '#get' do
    before do
      account.follow!(followed)

      Fabricate(:status, account: account,  id: 1)
      Fabricate(:status, account: account,  id: 2)
      status = Fabricate(:status, account: followed, id: 3)
      Fabricate(:mention, account: account, status: status)
      Fabricate(:status, account: account,  id: 10)
      Fabricate(:status, account: other,    id: 11)
      Fabricate(:status, account: followed, id: 12, visibility: :private)
      Fabricate(:status, account: followed, id: 13, visibility: :direct)
      Fabricate(:status, account: account,  id: 14, visibility: :direct)
      mention = Fabricate(:status, account: followed, id: 15, visibility: :private)
      Fabricate(:mention, account: account, status: mention)
    end

    context 'when feed is generated' do
      before do
        stub_const 'FeedManager::MAX_ITEMS', 7
        FeedManager.instance.populate_home(account)
      end

      it 'gets statuses with ids in the range from redis with database' do
        results = subject.get(5)

        expect(results.map(&:id)).to eq [15, 14, 12, 10, 3]
      end

      it 'with since_id present' do
        results = subject.get(5, nil, 3, nil)
        expect(results.map(&:id)).to eq [15, 14, 12, 10]
      end

      it 'with min_id present' do
        results = subject.get(3, nil, nil, 0)
        expect(results.map(&:id)).to eq [3, 2, 1]
      end
    end

    context 'when feed is only partial', :partial do
      before do
        stub_const 'FeedManager::MAX_ITEMS', 5
        FeedManager.instance.populate_home(account)
      end

      it 'gets statuses with ids in the range from redis with database' do
        results = subject.get(5)

        expect(results.map(&:id)).to eq [15, 14, 12, 10, 3]
        # Because it reads from DB, All attributes are available
        # expect(results.first.attributes.keys).to eq %w(id updated_at)
      end

      it 'with since_id present' do
        results = subject.get(5, nil, 3, nil)
        expect(results.map(&:id)).to eq [15, 14, 12, 10]
      end

      it 'with min_id present' do
        results = subject.get(3, nil, nil, 0)
        expect(results.map(&:id)).to eq [3, 2, 1]
      end
    end

    context 'when feed is being generated' do
      before do
        stub_const 'FeedManager::MAX_ITEMS', 0
        redis.hset("account:#{account.id}:regeneration", { 'status' => 'running' })
      end

      it 'returns from database' do
        results = subject.get(5)

        expect(results.map(&:id)).to eq [15, 14, 12, 10, 3]
      end

      it 'with since_id present' do
        results = subject.get(5, nil, 3, nil)
        expect(results.map(&:id)).to eq [15, 14, 12, 10]
      end

      it 'with min_id present' do
        results = subject.get(3, nil, nil, 0)
        expect(results.map(&:id)).to eq [3, 2, 1]
      end
    end
  end

  describe '#regenerating?' do
    context 'when an old-style string key is still in use' do
      it 'upgrades the key to a hash' do
        redis.set("account:#{account.id}:regeneration", true)

        expect(subject.regenerating?).to be true

        expect(redis.type("account:#{account.id}:regeneration")).to eq 'hash'
      end
    end

    context 'when feed is being generated' do
      before do
        redis.hset("account:#{account.id}:regeneration", { 'status' => 'running' })
      end

      it 'returns `true`' do
        expect(subject.regenerating?).to be true
      end
    end

    context 'when feed is not being generated' do
      context 'when the job is marked as finished' do
        before do
          redis.hset("account:#{account.id}:regeneration", { 'status' => 'finished' })
        end

        it 'returns `false`' do
          expect(subject.regenerating?).to be false
        end
      end

      context 'when the job key is missing' do
        it 'returns `false`' do
          expect(subject.regenerating?).to be false
        end
      end
    end
  end

  describe '#regeneration_in_progress!' do
    context 'when an old-style string key is still in use' do
      it 'upgrades the key to a hash' do
        redis.set("account:#{account.id}:regeneration", true)

        subject.regeneration_in_progress!

        expect(redis.type("account:#{account.id}:regeneration")).to eq 'hash'
      end
    end

    it 'sets the corresponding key in redis' do
      expect(redis.exists?("account:#{account.id}:regeneration")).to be false

      subject.regeneration_in_progress!

      expect(redis.exists?("account:#{account.id}:regeneration")).to be true
    end
  end

  describe '#regeneration_finished!' do
    context 'when an old-style string key is still in use' do
      it 'upgrades the key to a hash' do
        redis.set("account:#{account.id}:regeneration", true)

        subject.regeneration_finished!

        expect(redis.type("account:#{account.id}:regeneration")).to eq 'hash'
      end
    end

    it "sets the corresponding key's status to 'finished'" do
      redis.hset("account:#{account.id}:regeneration", { 'status' => 'running' })

      subject.regeneration_finished!

      expect(redis.hget("account:#{account.id}:regeneration", 'status')).to eq 'finished'
    end
  end
end
