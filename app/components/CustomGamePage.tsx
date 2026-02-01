import CytoscapeComponent from "react-cytoscapejs";
import { useState, useEffect, useRef } from "react";
import type { GameConfig, EngineState } from "~/types/types";
import type { Core, NodeCollection, ElementDefinition } from "cytoscape";
import { useLocation, useNavigate } from "react-router-dom";
import coseBilkent from 'cytoscape-cose-bilkent';
import Cytoscape from 'cytoscape';
import { Button } from './Button';
import { Histogram } from "./Histogram";
import InfiniteScroll from 'react-infinite-scroll-component';
import MonacoEditor from "./MonacoEditor";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import ts from 'typescript';
import { Frame } from "./Frame";
import { adjListToAdjMap } from "./matrixUtils";
import React from 'react';

// good luck trying to read this

export function CustomGamePage({ gameConfig }: { gameConfig: GameConfig }) {
  type RunResult = {
    runNumber: number;
    seed: number;
    turns: number;
    last: number;
  }

  const location = useLocation();
  const navigate = useNavigate();
  Cytoscape.use(coseBilkent);

  const layout = { name: "cose-bilkent" };
  const style =
  { 
    width: '45vw',
    height: "45vh",
    background: "#f5f5f5",
    margin: '10px',
    borderRadius: '8px',
  };
  const stylesheet =
  [
    {
      selector: ".hidden",
      css: {
        'visibility': 'hidden'
      }
    },
    {
      selector: ".id",
      css: {
        label: "data(id)",
      }
    },
    {
      selector: ".role",
      css: {
        label: "data(label)",
      }
    },
    {
      selector: ".redEdge",
      css: {
        'line-color': 'red'
      }
    },
    {
      selector: ".redNode",
      css: {
        'background-color': 'red',
      }
    },
  ];

  const [initalEngineState, setInitialEngineState] = useState<EngineState | null>(null);
  const [performance, setPerformance] = useState<string>("");
  const [cy, setCy] = useState<Core | null>(null);
  const [currentGameConf, setCurrentGameConf] = useState<GameConfig>(gameConfig);
  const [nodesLoaded, setNodesLoaded] = useState(false);
  const [nodes, setNodes] = useState<NodeCollection>();
  const [currentGame, setCurrentGame] = useState<Record<string, number>[]>();
  const [currentMove, setCurrentMove] = useState<number>(0);
  const [masterSeed, setMasterSeed] = useState<number>();
  const [items, setItems] = useState<React.JSX.Element[]>()
  const [itemsLoaded, setItemsLoaded] = useState<number>(0);
  const [itemsLoadedReal, setItemsLoadedReal] = useState<number>(0);
  const [moreToLoad, setMoreToLoad] = useState<boolean>(true);
  const [nearMisses, setNearMisses] = useState<number[]>();
  const [robberStrategy, setRobberStrategy] = useState<string>("");
  const [copStrategy, setCopStrategy] = useState<string>("");
  const [isEditor, setIsEditor] = useState<boolean>(true);
  const [isTest, setIsTest] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState({ rowIndex: 0, cellIndex: 0 });



  const [results, setResults] = useState<RunResult[]>();
  const [resultsRaw, setResultsRaw] = useState<RunResult[]>();
  const [resultsDisplay, setResultsDisplay] = useState<RunResult[]>();
  const [resultsDesc, setResultsDesc] = useState<RunResult[]>();
  const [resultsAsc, setResultsAsc] = useState<RunResult[]>();
  const [resultsType, setResultsType] = useState<string>('default');
  const [robberMatrix, setRobberMatrix] = useState<number[][]>();
  const [runs, setRuns] = useState<number>(1000);
  const [splits, setSplits] = useState<number>(10);

  const updateLabels = () => {
    const nodes = currentGameConf.nodes;
    const start = currentGameConf.start
    cy?.nodes().forEach((n) => {
      if (nodes.includes(n.id())) {
        n?.data('label', start[n.id()].join(', '));
      } else {
        n.data('label', '')
      }
    });
  }

  const removeLabels = () => {
    cy?.nodes().forEach((n) => {
      n.data('label', '');
    });
  }

  const removeColors = () => {
    cy?.edges().forEach((e) => {
      e.removeClass('redEdge');
    });
    cy?.nodes().forEach((n) => {
      n.removeClass('redNode');
    });
  }

  const updatePositions = () => {
    if (!cy || !location.state?.positions) return;
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const id = Number(n.id())
        
        if (location.state.positions[id]) {
          n.position(location.state.positions[id]);
          n.removeClass('hidden');
        }
      });
    });
  }

  const generateEdgeObjects = (adjList: number[][]): ElementDefinition[] =>
    adjList.flatMap((neighbors, source) =>
      neighbors.map(target => ({
        data: {
          id: `${source}-${target}`,
          source: source.toString(),
          target: target.toString(),
        },
        // style: { visibility: 'hidden' }
      }))
    );

  const runLayout = () => {
    if(!cy) return;
    if(!gameConfig?.pos)
      cy.layout(layout).run();
    else {
      console.log(gameConfig.pos)
      gameConfig.pos.forEach(e => cy.getElementById(e.id).position(e.pos));
    }
  }

  const makeVisible = () => {
    if(!cy) return;
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        n.removeClass('hidden');
      });
    });
  }

  const makeEdges = () => {
    cy?.remove(cy.edges());
    const newEdges = generateEdgeObjects(gameConfig.adjList);
    cy?.add(newEdges);
  }

  function topNSorted(
    arr: RunResult[],
    n: number,
    compare: (a: RunResult, b: RunResult) => number
  ): RunResult[] {
    if (n <= 0) return [...arr];
    if (n >= arr.length) return [...arr].sort(compare);

    const a = [...arr];

    const partition = (left: number, right: number, pivotIndex: number) => {
      const pivot = a[pivotIndex];
      [a[pivotIndex], a[right]] = [a[right], a[pivotIndex]];

      let store = left;
      for (let i = left; i < right; i++) {
        if (compare(a[i], pivot) < 0) {
          [a[i], a[store]] = [a[store], a[i]];
          store++;
        }
      }

      [a[store], a[right]] = [a[right], a[store]];
      return store;
    };

    const quickSelect = (left: number, right: number, k: number) => {
      while (left < right) {
        const pivotIndex =
          left + Math.floor(Math.random() * (right - left + 1));
        const idx = partition(left, right, pivotIndex);

        if (idx === k) return;
        if (idx < k) left = idx + 1;
        else right = idx - 1;
      }
    };

    // Partition so first n elements are the "top" (unordered)
    quickSelect(0, a.length - 1, n);

    const top = a.slice(0, n).sort(compare);
    const rest = a.slice(n); // intentionally unsorted

    return [...top, ...rest];
  }

  const sortResultsDesc = () => {
    if(!resultsDesc) return;
    const desc = structuredClone(topNSorted(resultsDesc, 2*runs/splits, (a, b) => a.turns - b.turns));
    setResultsType('desc');
    setResultsDesc(desc)
    setItemsHelper(desc.slice(0, runs/splits));
  }
  const sortResultsAsc = () => {
    if(!resultsAsc) return;
    const asc = structuredClone(topNSorted(resultsAsc, 2*runs/splits, (a, b) => b.turns - a.turns));
    setResultsType('asc');
    setResultsAsc(asc)
    setItemsHelper(asc.slice(0, runs/splits));
  }
  const sortResultsRun = () => {
    if(!results) return;
    const res = structuredClone(topNSorted(results, 2*runs/splits, (a, b) => a.runNumber - b.runNumber));
    setResultsType('def');
    setResults(res)
    setItemsHelper(res.slice(0, runs/splits));
  }

  const calculateStats = (arr: number[]) => {
    const n = arr.length;

    const mean = arr.reduce((acc, curr) => acc + curr, 0) / n;

    const variance = arr.reduce((acc, curr) => acc + (curr - mean) ** 2, 0) / (n - 1);

    const stdDev = Math.sqrt(variance);

    return {mean, stdDev, n};
  };

  const loadGame = (seed: number) => {
    if (!initalEngineState || typeof window === "undefined") return;
    // const worker = new Worker(new URL("../workers/worker.ts", import.meta.url), { type: "module"});
    // const state = {...initalEngineState, seed}
    // const message = {
    //   type: 'e',
    //   state,
    //   robberStrategy,
    //   copStrategy,
    //   matrixMode: true,
    //   matrix: robberMatrix
    // }
    // worker.postMessage(message);
    // console.log('sending seed')
    // worker.onmessage = (e) => {
    //   if (e.data.type === 's') {
    //     setCurrentGame(e.data.game);
        
    //     console.log(e.data.game)
    //     worker.terminate();
    //   }
    // }
  }

  const generateItemJsx = (res: RunResult[]) => {
    console.log(res);
    return res.map(e => 
      <tr key={e.runNumber}>
        <td>{e.runNumber}</td>
        <td>{e.seed}</td>
        <td>{e.turns}</td>
        <td>{e.last}</td>
        <td><Button onClick={() => {loadGame(e.seed); setCurrentMove(0); window.scrollTo({ top: 0, behavior: 'smooth' })}}>load game</Button></td>
      </tr>
    );
  }

  const setItemsHelper = (res: RunResult[]) => {
    const i = generateItemJsx(res);
    setResultsDisplay(res)
    setItems(i);
    setItemsLoaded(i.length);
  }

  useEffect(() => {
    if(!gameConfig || initalEngineState) return;

    //const neighbors = p(7); // generateAdjMap(upperToUndirected(Graph6.toMatrix(gameConfig.graph6)));
    let neighbors = adjListToAdjMap(gameConfig.adjList);
    
    const positions = Object.fromEntries(
      Object.entries(gameConfig.start).flatMap(([key, arr]) =>
        arr.map(v => [v, Number(key)])
      )
    );
    const engineState: EngineState = {
      turn: 0,
      finished: false,
      winner: null,
      cops: gameConfig.cops,
      robbers: gameConfig.robbers,
      nodes: Array.from(neighbors.keys()),
      positions,
      neighbors,
      notes: [],
      //seed: -1866286432
    }
    setInitialEngineState(engineState);
    console.log(engineState);
  }, [gameConfig]);

  useEffect(() => {
    if(!results || items) return;    
    setItemsHelper(results);
  }, [results])

  useEffect(() => {
    if (!location.state?.positions || !cy) return;
    const nodes: Set<string> = location.state.nodes;
    const cyNodes = new Set(cy.nodes().map(e => e.id()));

    const edges: Set<string> = location.state.edges;
    const cyEdges = new Set(cy.edges().map(e => e.id()));

    const addedNodes: Set<string> = nodes.difference(cyNodes);
    const deletedNodes = cyNodes.difference(nodes);

    const addedEdges: Set<string> = edges.difference(cyEdges);
    const deletedEdges = cyEdges.difference(edges);

    addedNodes.values().forEach(e => {
      console.log('adding:', e);
      cy.add({
        group: 'nodes',
        data: { id: e, label: '', role: '', roles: [] },
        position: location.state.positions[Number(e)],
        classes: ['role']
      });
    });

    addedEdges.values().forEach(e => {
      const tuple = e.split('-');
      cy.add({
        group: 'edges',
        data: {
          id: e,
          source: tuple[0],
          target: tuple[1]
        }
      });
    });

    let c = cy.collection();
    const collection = c.union([...deletedNodes, ...deletedEdges].map(e => cy.getElementById(e)));
    console.log(collection)
    cy.remove(collection);

    updatePositions();
    updateLabels();

  }, [cy, location.state?.positions]);

  useEffect(() => {
    console.log('enter', cy, location.state)
    if (!cy || location.state?.positions) return;
    
    console.log("adding")
    console.log(location.state)

    const targetNodeCount = gameConfig.adjList.length;

    cy.batch(() => {
      const currentNodes = cy.nodes();
      
      if (currentNodes.length < targetNodeCount) {
        for (let i = currentNodes.length; i < targetNodeCount; i++) {
          cy.add({
            group: 'nodes',
            data: { id: i.toString(), label: '', role: '', roles: [] },
            position: { x: 0, y: 0 },
            classes: ['hidden', 'role']
          });
        }
      }
    });
    updateLabels();
    setNodesLoaded(true);
    setNodes(cy.nodes())

  }, [cy]);

  useEffect(() => {
    makeEdges();
    runLayout();
    makeVisible();
  }, [nodesLoaded]);

  useEffect(() => {
    cy?.viewport({zoom: location.state?.zoom, pan: location.state?.pan });
  }, [cy]);
  const drawLabels = () => {
    if (!currentGame || currentMove === undefined || currentGame.length === 0 || !cy) return;
    removeLabels();
    let pos: {
      [k: number]: {
        type: string;
        roles: string[];
      };
    } = {};
    gameConfig.robbers.forEach(e => {
      const nodeId = currentGame[currentMove][e];
      if (typeof nodeId === 'undefined') return;
      pos[nodeId] ??= {
        type: 'r',
        roles: []
      };
      pos[nodeId].roles.push(e);
    });
    gameConfig.cops.forEach(e => {
      const nodeId = currentGame[currentMove][e];
      if (typeof nodeId === 'undefined') return;
      //if (typeof pos[nodeId] === 'undefined' || pos[nodeId].type === 'r') {
        pos[nodeId] ??= {
          type: 'c',
          roles: []
          //roles: [e]
        };
      //} else {
        pos[nodeId].roles.push(e);
      //}
    });

    Object.entries(pos).forEach(([key, e]) => {
      const node = cy.getElementById(key);
      node.data('label', e.roles.join(', '));
    });

    if (!robberMatrix) return;
    const r = currentGame[currentMove]['r1'];
    const c = currentGame[currentMove]['c1'];
    setSelectedCell({rowIndex: c, cellIndex: r});
    const next = robberMatrix[c][r];
    if (next === r) {
      removeColors();
      const n = cy.getElementById(r.toString());
      n.addClass('redNode');
      return;
    }
    const id = [r, next].sort((a, b) => a - b).join('-');
    const e = cy.getElementById(id);
    removeColors();
    e.addClass('redEdge');
  }
  useEffect(() => {
    drawLabels();
  }, [currentMove]);

  const badResults = (num: number) => {
    if (!resultsDisplay) {
      return [...Array(num).keys()].map(e => {
        return {
          runNumber: e,
          seed: 0,
          turns: 0,
          last: 0
        }
      });
    }

    const arr = [...Array(num - itemsLoaded).keys()].map(e => {
      return {
        runNumber: e + itemsLoaded,
        seed: 0,
        turns: 0,
        last: 0
      }
    });

    return [...resultsDisplay, ...arr];
  }

  const inLoop = useRef(false);


  const loadItems = async () => {
    if (inLoop.current) return;
    inLoop.current = true;

    try {
      if (
        !resultsRaw ||
        !resultsAsc ||
        !resultsDesc ||
        !results ||
        !resultsDisplay
      ) {
        return;
      }

      if (resultsRaw.length <= itemsLoadedReal) return;

      const m = Math.min(
        Math.max(resultsDisplay.length, itemsLoaded + runs / splits),
        resultsRaw.length
      );

      let res;
      if (resultsType === 'asc') {
        res = structuredClone(topNSorted(resultsAsc, m, (a, b) => b.turns - a.turns));
        setResultsAsc(res);
      } else if (resultsType === 'desc') {
        res = structuredClone(topNSorted(resultsDesc, m, (a, b) => a.turns - b.turns));
        setResultsDesc(res);
      } else {
        res = structuredClone(topNSorted(results, m, (a, b) => a.runNumber - b.runNumber));
        setResults(res);
      }

      const fillers = Array.from(
        { length: itemsLoaded - m },
        (_, i) => ({
          runNumber: m + i,
          seed: 0,
          turns: 0,
          last: 0
        })
      );

      setItemsLoadedReal(m);

      setItemsHelper([...res, ...fillers]);

    } finally {
      inLoop.current = false;
    }
  };

  useEffect(() => {
    if (itemsLoaded > itemsLoadedReal) {
      loadItems();
    }
  }, [itemsLoaded, itemsLoadedReal, resultsRaw])

  const getResults = () => {
    if (!resultsRaw || !resultsDisplay || !resultsAsc || !resultsDesc || !results)
      return badResults(itemsLoaded +runs/splits);

    if (resultsRaw.length > resultsDisplay.length) {
      console.log(resultsRaw.length, resultsDisplay.length)
      const m = Math.max(itemsLoaded, Math.min(Math.max(resultsDisplay.length, itemsLoaded +runs/splits), resultsRaw.length));
      
      let res;
      if (resultsType === 'asc') {
        res = structuredClone(topNSorted(resultsAsc, m, (a, b) => b.turns - a.turns));
        setResultsAsc(res);
      } else if (resultsType === 'desc') {
        res = structuredClone(topNSorted(resultsDesc, m, (a, b) => a.turns - b.turns));
        setResultsDesc(res);
      } else {
        res = structuredClone(topNSorted(results, m, (a, b) => a.runNumber - b.runNumber));
        setResults(res);
      }
      setItemsLoadedReal(m);
      return res.slice(0, m);
    } else {
      return badResults(itemsLoaded +runs/splits);
    }
  }

  const updateItems = () => {
    console.log('update');
    
    setItemsHelper(getResults());
    const m = (itemsLoaded +runs/splits);

    //if (m >= runs) setMoreToLoad(false);

  }
  
  const jumpMoves = (jump: number) => {
    if (typeof currentMove === 'undefined' || !currentGame) return;
    const newMove = jump + currentMove;
    if (newMove >= 0 && newMove < currentGame.length) {
      setCurrentMove(newMove);
    }
  }

  const editorRef = useRef<editor.IStandaloneCodeEditor>(null);

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco)  => {
    editorRef.current = editor;
    console.log('mount')
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `const url:string = url;
      const setResultsRaw: React.Dispatch<React.SetStateAction<RunResult[]>> = setResultsRaw;
      const setResults: React.Dispatch<React.SetStateAction<RunResult[]>> = setResults;
      const setResultsAsc: React.Dispatch<React.SetStateAction<RunResult[]>> = setResultsAsc;
      const setResultsDesc: React.Dispatch<React.SetStateAction<RunResult[]>> = setResultsDesc;
      const setPerformance: React.Dispatch<React.SetStateAction<string>> = setPerformance;
      const setMasterSeed: React.Dispatch<React.SetStateAction<number>> = setMasterSeed;
      const setRobberStrategy: React.Dispatch<React.SetStateAction<string>> = setRobberStrategy;
      const setCopStrategy: React.Dispatch<React.SetStateAction<string>> = setCopStrategy;
      const setRobberMatrix: React.Dispatch<React.SetStateAction<number[][]>> = setRobberMatrix;
      const setRuns: React.Dispatch<React.SetStateAction<number>> = setRuns;
      const setSplits: React.Dispatch<React.SetStateAction<number>> = setSplits;
      type RoleId = string;
      const initalEngineState = initalEngineState;
      interface EngineState {
        turn: number;
        positions: Record<RoleId, number>;
        cops: RoleId[];
        robbers: RoleId[];
        nodes: number[];
        neighbors: Map<number, Set<number>>;
        finished: boolean;
        winner: string | null;
        rng?: RandomGenerator;
        seed?: number;
        notes?: string[]
      };
      interface RandomGenerator {
        clone(): RandomGenerator;
        next(): [number, RandomGenerator];
        unsafeNext(): number;
        getState(): readonly number[];
      }
      namespace prand {
        export function uniformIntDistribution(from: number, to: number, rng: {
          clone(): RandomGenerator;
          next(): [number, prand.RandomGenerator];
          jump?(): RandomGenerator;
          unsafeNext(): number;
          unsafeJump?(): void;
          getState(): readonly number[];
        }): [number, {
          clone(): RandomGenerator;
          next(): [number, RandomGenerator];
          jump?(): RandomGenerator;
          unsafeNext(): number;
          unsafeJump?(): void;
          getState(): readonly number[];
        }]
      }
      function shortestPath(
        adjMap: Map<number, Set<number>>,
        start: number,
        goals: number[]
      ): number[] { return [] };
      namespace ts {
        export function transpileModule(input: string, transpileOptions: TranspileOptions): TranspileOutput
        export type TranspileOptions {
          compilerOptions?: {} | undefined;
          fileName?: string;
          reportDiagnostics?: boolean;
          moduleName?: string;
          renamedDependencies?: {
            [index: string]: string;
          };
          transformers?: {};
        }
        export type TranspileOutput {
          outputText: string;
          diagnostics?: {}[];
          sourceMapText?: string;
        }
      }
      `
    );
  }


  const runCode = () => {
    if (!editorRef.current) return;
    const url = import.meta.url;
    setResultsRaw(undefined);
    setResults(undefined);
    setResultsAsc(undefined);
    setResultsDesc(undefined);
    setPerformance("");
    setMasterSeed(undefined);

    let s = editorRef.current.getValue() ?? '';

    s += `
const worker = new Worker(new URL("../workers/worker.ts", url), { type: "module"});
const rs = ts.transpileModule(robberStrategy.toString(), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
setRobberStrategy(rs);

const cs = ts.transpileModule(copStrategy.toString(), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
setCopStrategy(cs);
initalEngineState.seed = seed;
console.log(initalEngineState)
const message = {
  type: 'c',
  state: initalEngineState,
  runs,
  splits,
  robberStrategy: rs,
  copStrategy: cs,
  matrixMode,
  matrix,
  seed
}
worker.postMessage(message);

worker.onmessage = (e) => {
  if (e.data.type === 'c') {
    const s: number[] = e.data.seeds;
    const t: number[] = e.data.steps;
    const l: string[] = e.data.last;
    const r = s.map((el, i) => { return {
      runNumber: i,
      seed: el,
      turns: t[i],
      last: l[i]
    }});
    const asc = structuredClone(r);
    const desc = structuredClone(r);
    const def = structuredClone(r);
    setResultsRaw(structuredClone(r));
    setResults(def);
    setResultsAsc(asc);
    setResultsDesc(desc);
    const message = {
      type: 'd'
    };
    worker.postMessage(message);
  } else if (e.data.type === 'e') {
    setPerformance((e.data.numOfSteps / e.data.time).toFixed(2));
    worker.terminate();
  } else if (e.data.type === 's') {
    setMasterSeed(e.data.masterSeed);
    setRobberMatrix(e.data.matrix);
    setRuns(e.data.runs);
    setSplits(e.data.splits);
    const message = {
      type: 'd'
    };
    worker.postMessage(message);
  }
};`;
    
    let str = ts.transpileModule(s, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    
    eval(str)
  }

  const toggleEditor = () => {
    setIsEditor(e => !e);
  }

  const testStrategy = () => {
    setIsTest(e => !e);
    let str = editorRef.current?.getValue();
    str ??= '';
    const re = /(?:const matrix(.|\n)*?=(.|\n)*?)(?<mat>\[(.|\n)*?\])\;/g;
    const g = re.exec(str)?.groups?.mat;
    if (g) setRobberMatrix(JSON.parse(g))
  }

  useEffect(() => {
    if (!robberMatrix || currentGame) return;
    const len = robberMatrix.length;
    let game = []
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len; j++) {
        game.push({c1: j, r1: i});
      }
    }
    console.log('setting current game')
    console.log(game)
    setCurrentGame(game);
  }, [robberMatrix])

  const setMat = (id: number) => {
    if (currentGame === undefined || robberMatrix === undefined) return;
    const r = currentGame[currentMove]['r1'];
    const c = currentGame[currentMove]['c1'];
    
    let newMat = structuredClone(robberMatrix);
    newMat[c][r] = id;
    setRobberMatrix(newMat);
    console.log(newMat);
  }

  const setCol = (id: number) => {
    if (currentGame === undefined || robberMatrix === undefined) return;
    const r = currentGame[currentMove]['r1'];
    const c = currentGame[currentMove]['c1'];
    const len = robberMatrix.length;
    let newMat = structuredClone(robberMatrix);
    for (let i = 0; i < len; i++) {
      newMat[i][r] = id;
    }
    setRobberMatrix(newMat);
    console.log(newMat);
  }

  useEffect(() => {
    drawLabels();
    if (!cy || !robberMatrix) return;
    
    const addNewNode = (event: any) => {
      if (event.target === cy || 
        currentMove === undefined ||
        currentGame === undefined || 
        robberMatrix === undefined) return;
      event.target.unselect();
      if (event.target.group() === 'nodes') {
        const id = Number(event.target.data('id'));
        setMat(id);
      }
    };

    cy.on('tap', addNewNode);

    return () => {
      cy.off('tap', addNewNode);
    };
  }, [cy, robberMatrix, currentGame, currentMove]);
  const setColRef = useRef<HTMLInputElement>(null);

  const [idRoleToggle, setIdRoleToggle] = useState(false);


  const toggleRoles = () => {
    if (idRoleToggle) {
      cy?.nodes().forEach((e) => {
        e.removeClass('id');
        e.addClass('role')
      });
    } else {
      cy?.nodes().forEach((e) => {
        e.removeClass('role');
        e.addClass('id')
      });
    }
    setIdRoleToggle(!idRoleToggle);
  }

  return (
    <Frame className="w-[90vw] bg-gray-600">
      <Frame className="gap-2 m-5">
        <Button onClick={() => navigate('/')}>Home</Button>
        <Button onClick={() => navigate(`/edit/${location.pathname.split('/')[2]}`)}>Edit graph</Button>
      </Frame>
      <div className='flex flex-row flex-wrap gap-2 m-5'>
        <div className='flex flex-col gap-2'>
          <Frame>
            <CytoscapeComponent
              elements={[]}
              layout={layout}
              stylesheet={stylesheet}
              style={{...style}} 
              cy={(cy: Core) => { setCy(cy) }}
            />
            { typeof currentGame === 'object'
            ?
            <div style={{margin: '10px'}}>
              <input className='w-[45vw]' onChange={e => setCurrentMove(Number(e.target.value))} type="range" id="volume" name="volume" min="0" value={currentMove} max={currentGame.length -1} />

              <div className="flex flex-row justify-center">
                <Button onClick={() => {if(robberMatrix) jumpMoves(-1*robberMatrix.length)}}>-{robberMatrix?.length}</Button>
                <Button onClick={() => jumpMoves(-10)}>-10</Button>
                <Button onClick={() => jumpMoves(-1)}>-1</Button>
                <Button onClick={() => jumpMoves(1)}>+1</Button>
                <Button onClick={() => jumpMoves(10)}>+10</Button>
                <Button onClick={() => {if(robberMatrix) jumpMoves(robberMatrix?.length)}}>+{robberMatrix?.length}</Button>
              </div>
              <div className="flex flex-row justify-center">
                <div style={{flex: 1}}>
                  <Button onClick={() => {setMat(-1); jumpMoves(1)}}>mat-1</Button>
                  <Button onClick={() => {if(setColRef.current) setCol(Number(setColRef.current.value))}}>set col</Button>
                  <input className='w-10' type="text" ref={setColRef} defaultValue='-1'/>
                </div>
                
                <div className="flex flex-row justify-items-end items-center" >
                  <p>current move: {currentMove}</p>
                </div>
              </div>
            </div>
            : null}
          </Frame>
        </div>
        {results
          ? 
          <div className='flex flex-col gap-2'>
            <Frame>
              <Histogram
                width={'35vw'}
                height={'28vh'}
                data={results.map(e => e.turns)}
                bins={50}
                title='Distribution of run length'
                xAxis="Game length"
                yAxis="Frequency"
              />
            </Frame>
            
            <Frame>
              <p>{ Object.entries(calculateStats(results.map(e => e.turns)))
                .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
                .join(', ') }</p>
              
              {typeof masterSeed === 'number' ? <p>masterSeed: {masterSeed}</p>: null }
              {performance !== "" ? <p>steps per ms: {performance}</p> : null}
            </Frame>
          </div>
          : null }
      </div>

        { robberMatrix
        ?
        <Frame className="gap-2 m-5">
          <table>
              <thead>
                <tr className="bg-blue-200">
                  {robberMatrix.map((_, idx) => <td>{idx}</td>)}
                </tr>
              </thead>
              <tbody>
                {}
                {robberMatrix.map((row, idx) => {
                  return <tr key={idx}>{row.map((e, jdx) => {
                    return <td key={jdx} className={
                  selectedCell.rowIndex === idx &&
                  selectedCell.cellIndex === jdx
                    ? 'bg-amber-300'
                    : ''
                }>{(e === -1) ? null : e}</td>
                  })}</tr>
                })}
              </tbody>
            </table>
            <Button onClick={() => navigator.clipboard.writeText(JSON.stringify(robberMatrix))}>copy to clipboard</Button>
        </Frame>
        : null }
      <Frame className="m-5 w-auto">
        <div className="flex flex-col items-center">
          <div>
            <Button onClick={runCode}>run code</Button>
            { isEditor ? <Button onClick={toggleEditor}>hide editor</Button> 
            : <Button onClick={toggleEditor}>show editor</Button>}
            <Button onClick={testStrategy}>test/modify strategy</Button>
          </div>
          { isEditor ? 
          <MonacoEditor
            onMount={handleEditorMount}
          />
          : null }
        </div>
      </Frame>
      <div className="flex flex-row justify-center">
        <Frame className="w-170">
          <div className="flex flex-col items-center ">
            <div>
              <Button onClick={sortResultsAsc}>sort results asc</Button>
              <Button onClick={sortResultsDesc}>sort results desc</Button>
              <Button onClick={sortResultsRun}>sort results run</Button>
            </div>
            <div>
              <InfiniteScroll
                dataLength={items?.length ?? 0}
                next={updateItems}
                hasMore={true}
                loader={<h4>Loading...</h4>}
              >
                <table>
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>seed</th>
                      <th>turns</th>
                      <th>load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items}
                  </tbody>
                </table>
              </InfiniteScroll>
            </div>
          </div>
        </Frame>
      </div>
      
    </Frame>
  )
};

