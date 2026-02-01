import type { AdjMap, AdjList, AdjMat } from "~/types/types";

export function adjListToAdjMap(adjList: AdjList): AdjMap {
  const adjMap: AdjMap = new Map();

  for (let i = 0; i < adjList.length; i++) {
    adjMap.set(i, new Set(adjList[i]));
  }

  return adjMap;
}

export function getUpdateMap(adjMap: AdjMap): Map<number, number> {
  const keys = adjMap.keys();
  let map = new Map<number, number>();
  keys.forEach((v, i) => {
    map.set(v, i);
  });
  return map;
}

export function updateAdjMapIndex(adjMap: AdjMap, updateMap: Map<number, number>): AdjMap {
  let newAdj = new Map<number, Set<number>>();
  adjMap.forEach((v, k) => {
    let newKey = updateMap.get(k);
    newKey ??= k;
    const neighbors = new Set(v.values().map(e => updateMap.get(e)).toArray().filter(e => e !== undefined))
    newAdj.set(newKey, neighbors);
  });
  return newAdj;
}

export function adjMapToAdjList(adjMap: AdjMap): AdjList {
  const n = adjMap.size;

  const adjList: AdjList = Array.from({ length: n }, () => []);

  for (const [u, neighbors] of adjMap) {
    adjList[u] = Array.from(neighbors);
  }

  return adjList;
}

export function adjMatToAdjList(matrix: AdjMat): AdjList {
  const n = matrix.length;
  const adjList: AdjList = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] !== 0) {
        adjList[i].push(j);
      }
    }
  }

  return adjList;
}

export function adjListToAdjMat(adjList: number[][]): number[][] {
  const n = adjList.length;
  const adjMat: number[][] = Array.from(
    { length: n },
    () => Array(n).fill(0)
  );

  for (let u = 0; u < n; u++) {
    for (const v of adjList[u]) {
      adjMat[u][v] = 1;
    }
  }

  return adjMat;
}