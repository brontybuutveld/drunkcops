import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

const MonacoEditor = ({onMount}: {onMount:(editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void}) => {
  const defaultValue = `// WARNING !!!!!!
// WARNING !!!!!!
// this code is running on your local computer
// if you do something silly it will use excess memory, or crash this tab
// have fun!!

const runs = 1000;
const splits = 10;

const seed = null;

const matrixMode = false;
const matrix =
[

];

const copStrategy = (prand, shortestPath, state: EngineState): void => {
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

const robberStrategy = (prand, shortestPath, state: EngineState, copNodes: number[], robberNode: {role: RoleId, node: number}): number => {
  const node = robberNode.node;
  const role = robberNode.role;
  const adj = state.neighbors.get(node);
  const copAdj = new Set<number>();
  copNodes.forEach(e => state.neighbors.get(e).forEach(e => copAdj.add(e)));
  copNodes.forEach(e => copAdj.add(e));

  if(!adj) return;
  const neighbors = [node, ...Array.from(adj.values())].sort((a, b) => a - b);
  for (let i = 0; i < neighbors.length; i++) {
    let e = neighbors[i];
    if (!copAdj.has(e)) {
      state.positions[role] = e;
      return e;
    }
  }
  return node;
}
`
  return <Editor height="90vh" defaultLanguage="typescript" onMount={onMount} defaultValue={defaultValue} />;
}

export default MonacoEditor;