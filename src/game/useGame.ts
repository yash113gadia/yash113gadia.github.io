import { useSyncExternalStore } from 'react';
import { game } from './store';

export const useGame = () => useSyncExternalStore(game.subscribe, game.get, game.get);
