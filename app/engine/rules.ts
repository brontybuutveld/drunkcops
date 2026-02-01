import type { EngineState } from '../types/types';
import prand from 'pure-rand';


//let robberStrategy: (state: EngineState) => void;
let copStratedgy = ""
let csFunc: (prand, shortestPath, state) => void;
let rsArray: number[][];



function stringToFunction(source) {
  // Remove file/line prefix
  const cleaned = source.replace(/^[^f]*function/, 'function');
  // Wrap so it evaluates to a function value
  return new Function('prand', 'shortestPath', 'state', `return ${cleaned}`)();
}

export function getMoves(): number[][] {
  return moves;
}

export function setMatrix(mat: number[][]): void {
  rsArray = mat;
}

export function computeNextState(state: EngineState): EngineState {
  //const next = structuredClone(state);
  // const robberNodes = next.robbers.map(e => next.positions[e]);
  // const copNodes = next.cops.map(e => next.positions[e]);
  state.turn++;
  if(capture(state)) return state;
  state.turn % 2 === 0 ? moveCop(state) : moveRobber(state);
  // moveCop(state);
  // if(capture(state)) return state;
  // moveRobber(state);
  
  return state;

}

export function setRobberStrategy(robberStrategy: string, state: EngineState): number[][] {
  const rs = stringToFunction(robberStrategy);
  let copyState = structuredClone(state);

  const cops = copyState.cops;
  let moves: number[][] = Array.from({length: state.nodes.length}, () => new Array(state.nodes.length).fill(-1));

  nonDecreasing(cops.length, copyState.nodes.length, (arr) => { 
    copyState.nodes.forEach((rob) => {
      setAtIndex(moves, [...arr, rob], rs(prand, shortestPath, state, arr, {role: 'r1', node: rob}));
    });
  });

  setMatrix(moves);
  return moves;
}

export function setCopStratedgy(cs: string) {
  if (cs !== '') copStratedgy = cs;
  else {
    copStratedgy = '';
    csFunc = undefined;
  }
}

const capture = (state: EngineState) => {
  const robberNodes = state.robbers.map(e => state.positions[e]);
  const copNodes = state.cops.map(e => state.positions[e]);
  if (copNodes.includes(robberNodes[0])) {
    state.finished = true;
    //console.log(robberNodes[0]);
    state.last = robberNodes[0];
    return true;
  }
  return false;
}

function reconstructPath(
  parent: Map<number, number | null>,
  end: number
): number[] {
  const path: number[] = [];
  let curr: number | null = end;

  while (curr !== null) {
    path.push(curr);
    curr = parent.get(curr) ?? null;
  }

  return path.reverse();
}

function shortestPath(
  adjMap: Map<number, Set<number>>,
  start: number,
  goals: number[]
): number[] {
  const goalSet = new Set(goals);

  // Edge case: start is already a goal
  if (goalSet.has(start)) return [start];

  const queue: number[] = [start];
  const visited = new Set<number>([start]);
  const parent = new Map<number, number | null>();

  parent.set(start, null);

  while (queue.length > 0) {
    const node = queue.shift()!;

    const neighbors = adjMap.get(node);
    if (!neighbors) continue;

    for (const next of neighbors) {
      if (visited.has(next)) continue;

      visited.add(next);
      parent.set(next, node);

      // Found the closest goal
      if (goalSet.has(next)) {
        return reconstructPath(parent, next);
      }

      queue.push(next);
    }
  }

  // No path to any goal
  return [];
}

const moveCop = (state: EngineState) => {
  const copNodes = state.cops.map(e => {return { role: e, node: state.positions[e] }});
  copNodes.forEach(e => {
    const adj = state.neighbors.get(e.node);
    if(!adj || !state.rng) return;
    const [r, rng] = prand.uniformIntDistribution(0, adj.size, state.rng);
    state.rng = rng;
    if (r === adj.size) return;
    const newPos = [...adj][r];
    state.positions[e.role] = newPos;
  });
}

function nonDecreasing(n, max, callback) {
  const arr = Array(n).fill(0);

  function dfs(pos, start) {
    if (pos === n) {
      callback(arr.slice());
      return;
    }

    for (let i = start; i < max; i++) {
      arr[pos] = i;
      dfs(pos + 1, i);
    }
  }

  dfs(0, 0);
}

function setAtIndex(arr, indices, value) {
  const lastIndex = indices.pop();
  const target = indices.reduce((current, i) => current[i], arr);
  target[lastIndex] = value;
}

function getAtIndex(arr, indices) {
  //console.log(arr, indices)
  return indices.reduce((current, i) => {
    if (!Array.isArray(current)) {
      throw new Error("Invalid index path");
    }
    return current[i];
  }, arr);
}

// const moveRobber = (state: EngineState) => {
//   if (robberStrategy === "") {
//     const robberNodes = state.robbers.map(e => {return { role: e, node: state.positions[e] }});
//     const copNodes = state.cops.map(e => state.positions[e]);
//     robberNodes.forEach(e => {
//       const adj = state.neighbors.get(e.node);
//       if(!adj) return;
//       const neighbors = [e.node, ...Array.from(adj.values())]
//       const pathToCop = shortestPath(state.neighbors, e.node, copNodes);
//       if (pathToCop.length < 4) {
        
//         let m = 0;
//         let el = 0;
//         neighbors.forEach(e => {
//           const candidate = shortestPath(state.neighbors, e, copNodes).length;
//           if (candidate >= m) {
//             m = candidate;
//             el = e;
//           }
//         });
//         //console.log(m)
//         state.positions[e.role] = el;
//         state.notes?.push(`cop close, ${pathToCop.length}`);
//         //moves[e.node][copNodes[0]] = el
//       } else if (e.node === 0) {
//         state.notes?.push("on node");
//         //moves[e.node][copNodes[0]] = 0
//         return;
//       } else {
//         state.notes?.push("return to middle");
//         const pathToMiddle = shortestPath(state.neighbors, e.node, [0]);
//         const pathToCop = shortestPath(state.neighbors, pathToMiddle[1], copNodes);
//         if (pathToCop.length > 3) { 
//           state.positions[e.role] = pathToMiddle[1];
//           //moves[e.node][copNodes[0]] = pathToMiddle[1];
//         }
//       }
//     });
//   } else if (rsArray !== undefined) {
//     const robberNodes = state.robbers.map(e => {return { role: e, node: state.positions[e] }});
//     const copNodes = state.cops.map(e => state.positions[e]);
//     robberNodes.forEach(e => {
//       state.positions[e.role] = getAtIndex(rsArray, [...copNodes, e.node]);
//     })
    
//   } else {
//     const rs = stringToFunction(robberStrategy);
//     console.log(robberStrategy);
//     console.log(rs.toString())
//     console.log(JSON.stringify(state));
//     let copyState = structuredClone(state);


//     const cops = copyState.cops;
//     let moves = Array.from({length: 31}, () => new Array(31).fill(null));
    
//     nonDecreasing(cops.length, copyState.nodes.length, (arr) => { 
//       copyState.nodes.forEach((rob) => {
//         setAtIndex(moves, [...arr, rob], rs(prand, shortestPath, state, arr, {role: 'r1', node: rob}));
//       });
//     });

//     rsArray = moves;
    
//     console.log(JSON.stringify(moves))
//   }
// }


const moveRobber = (state: EngineState) => {
  const robberNodes = state.robbers.map(e => {return { role: e, node: state.positions[e] }});
  const copNodes = state.cops.map(e => state.positions[e]);
  //console.log(copNodes);
  //console.log(state)
  robberNodes.forEach(e => {
    state.positions[e.role] = getAtIndex(rsArray, [...copNodes, e.node]);
  })
}