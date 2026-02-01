import { computeNextState } from './rules';
import type { EngineState } from '../types/types';
import prand from 'pure-rand';

export function createEngine(initial: EngineState) {
  const init = initial;
  let state = structuredClone(initial);
  let start = Date.now();
  let gameCount = 0;
  let turns: number[] = [];
  let time = 0;
  const masterSeed = initial.seed || Date.now() ^ (Math.random() * 0x100000000);
  //const seed = 1741484797;
  console.log('seed:', masterSeed);
  let rngGenerator = prand.xoroshiro128plus(masterSeed);
  let seeds: number[] = [];
  let notes: string[] = [];
  let last: number[] = [];


  return {
    reset() {
      seeds.push(rngGenerator.unsafeNext())
      state.rng = prand.xoroshiro128plus(seeds[gameCount]);
    },
    setSeed(seed: number) {
      state.rng = prand.xoroshiro128plus(seed)
    },
    run() {
      let moves = [structuredClone(state.positions)];
      while(this.runHelper()) {
        moves.push(structuredClone(state.positions));        
      }
      return moves;
    },
    runHelper() {
      if (!state.finished) {
        state = computeNextState(state);
        return true;
      } else {        
        state = structuredClone(init);
        return false;
      }
    },
    step() {
      if (!state.finished) {
        state = computeNextState(state);
        return true;
      } else {
        gameCount++;
        const now = Date.now();
        time += now - start;
        start = now;
        turns.push(state.turn);
        last.push(structuredClone(state.positions['r1']));
        state = structuredClone(init);
        return false;
      }
    },
    getTime() {
      return time
    },
    getSteps() {
      return turns
    },
    getSeeds() {
      return seeds
    },
    getMasterSeed() {
      return masterSeed
    },
    getNotes() {
      return notes
    },
    getMoves() {
      return state.moves
    },
    getLast() {
      return last;
    }
  };
}