import { createEngine } from '../engine/engine';

import { setCopStratedgy, setRobberStrategy, setMatrix } from '../engine/rules';

let engine: {
  reset(): void;
  setSeed(seed: number): void;
  run(): Record<string, number>[];
  runHelper(): boolean;
  step(): boolean;
  getTime(): number;
  getSteps(): number[];
  getSeeds(): number[];
  getMasterSeed(): number;
  getNotes(): string[] | undefined;
};

let lim: number;
let splits: number;
let i = 0;
console.log('worker3 up');
onmessage = (e) => {
  if (e.data.type === 'c') {
    engine = createEngine(e.data.state);
    let matrix = e.data.matrix;
    if (!e.data.matrixMode) {
      matrix = setRobberStrategy(e.data.robberStrategy, e.data.state);
      setCopStratedgy(e.data.copStrategy);
    } else {
      setMatrix(e.data.matrix);
    }
    const runs = e.data.runs;
    splits = e.data.splits;
    lim = runs / splits;

    const seedMessage = {
      type: 's',
      masterSeed: engine.getMasterSeed(),
      matrix,
      runs,
      splits
    }
    postMessage(seedMessage);
  } else if (e.data.type === 'd') {
    if (i++ < splits) {
      for (let j = 0; j < lim; j++) {
        engine.reset();
        while (engine.step()) {
        };
      }
      const message = {
        type: 'c',
        seeds: engine.getSeeds(),
        steps: engine.getSteps(),
        moves: engine.getMoves(),
        last: engine.getLast()
      }
      postMessage(message);
    } else {
      const message = {
        type: 'e',
        time: engine.getTime(),
        numOfSteps: engine.getSteps().reduce((p, e) => p + e)
      }
      postMessage(message);
    }
  } else if (e.data.type === 'e') {
    engine = createEngine(e.data.state);
    engine.setSeed(e.data.state.seed)
    if (!e.data.matrixMode) {
      setRobberStrategy(e.data.robberStrategy, e.data.state);
      setCopStratedgy(e.data.copStrategy);
    } else {
      setMatrix(e.data.matrix);
    }
    const message = {
      type: 's',
      game: engine.run(),
    }
    postMessage(message);
  }
};