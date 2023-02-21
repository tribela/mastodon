import {
  DOMAIN_BLOCKS_FETCH_SUCCESS,
  DOMAIN_BLOCKS_EXPAND_SUCCESS,
  DOMAIN_UNBLOCK_SUCCESS,
} from '../actions/domain_blocks';
import {
  DOMAIN_MUTES_FETCH_SUCCESS,
  DOMAIN_MUTES_EXPAND_SUCCESS,
  DOMAIN_UNMUTE_SUCCESS,
} from '../actions/domain_mutes';
import { Map as ImmutableMap, OrderedSet as ImmutableOrderedSet } from 'immutable';

const initialState = ImmutableMap({
  blocks: ImmutableMap({
    items: ImmutableOrderedSet(),
  }),
});

export default function domainLists(state = initialState, action) {
  switch(action.type) {
  case DOMAIN_BLOCKS_FETCH_SUCCESS:
    return state.setIn(['blocks', 'items'], ImmutableOrderedSet(action.domains)).setIn(['blocks', 'next'], action.next);
  case DOMAIN_BLOCKS_EXPAND_SUCCESS:
    return state.updateIn(['blocks', 'items'], set => set.union(action.domains)).setIn(['blocks', 'next'], action.next);
  case DOMAIN_UNBLOCK_SUCCESS:
    return state.updateIn(['blocks', 'items'], set => set.delete(action.domain));
  case DOMAIN_MUTES_FETCH_SUCCESS:
    return state.setIn(['mutes', 'items'], ImmutableOrderedSet(action.domains)).setIn(['mutes', 'next'], action.next);
  case DOMAIN_MUTES_EXPAND_SUCCESS:
    return state.updateIn(['mutes', 'items'], set => set.union(action.domains)).setIn(['mutes', 'next'], action.next);
  case DOMAIN_UNMUTE_SUCCESS:
    return state.updateIn(['mutes', 'items'], set => set.delete(action.domain));
  default:
    return state;
  }
}
