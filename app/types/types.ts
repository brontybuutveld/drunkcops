import type cytoscape from "cytoscape";
import type { RandomGenerator } from "node_modules/pure-rand/lib/types/pure-rand-default";

export type RoleId = string;
export type NodeId = string;

export interface EngineState {
  turn: number;
  positions: Record<RoleId, number>;
  cops: RoleId[];
  robbers: RoleId[];
  nodes: number[];
  //neighbors: Record<NodeId, NodeId[]>;
  neighbors: Map<number, Set<number>>;
  finished: boolean;
  winner: string | null;
  rng?: RandomGenerator;
  seed?: number;
  notes?: string[]
  moves?: number[][]
};

export type AdjMap = Map<number, Set<number>>;
export type AdjList = number[][];
export type AdjMat = number[][];

export interface GameConfig {
  adjList: AdjList;
  cops: RoleId[];
  robbers: RoleId[];
  nodes: string[];
  start: Record<NodeId, RoleId[]>;
  pos: {id: string, pos: cytoscape.Position}[];
};

export interface HistoryUpdate {
  positions: {[k: string]: cytoscape.Position},
  nextId: number;
  edges: Set<string>;
  nodes: Set<string>;
  zoom?: number;
  pan?: cytoscape.Position;
}

export interface GraphData {
  nodes: NodeId[];
  neighbors: Record<NodeId, NodeId[]>;
};

export interface CyNodeData {
  data: {
    id: string;
    label: string;
    role: string;
    roles: string[];
  };
};

export interface CyEdgeData {
  data: {
    id: string;
    target: string;
    source: string;
  };
};

export type EditProps = {
  loaderData: {
    gameConfig: string;
  };
};