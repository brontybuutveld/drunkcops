import type { GameConfig, HistoryUpdate } from "~/types/types";
import type { Core } from "cytoscape";
import { Button } from "./Button";
import React, { useRef, useState } from "react";
import { encodeGzipBase64Url } from "../encoding";
import { useNavigate, useLocation } from "react-router";
import { adjListToAdjMap, adjMapToAdjList, updateAdjMapIndex } from "./matrixUtils";
import type cytoscape from "cytoscape";

export function EditIds(
  { gameConfig, cyInstance: cy }:
  { gameConfig: GameConfig,
    cyInstance: Core | null }) {
  const [errorMsg, setErrorMsg] = useState<string>('');
  const len = gameConfig.adjList.length;
  const ids = new Set([...Array(len).keys()]);
  const refs = useRef<Map<number, HTMLInputElement | null>>(new Map());
  const navigate = useNavigate();
  const location = useLocation();

  const reset = () => {
    if (!refs) return;
    refs.current.values().forEach((e, i) => {
      if (e !== null) {
        e.value = i.toString();
      }
    });
  };

  const cycleForward = () => {
    if (!refs) return;
    refs.current.values().forEach((e, i) => {
      if (e !== null) {
        e.value = (i !== refs.current.size -1) ? (i+1).toString() : '0';
      }
    });
  }

  const cycleBack = () => {
    if (!refs) return;
    refs.current.values().forEach((e, i) => {
      if (e !== null) {
        e.value = (i !== 0) ? (i-1).toString() : (refs.current.size-1).toString();
      }
    });
  }

  const update = () => {
    if (!cy) return;
    const map = new Map<number, number>();
    let s = new Set<number>();
    let msg = '';
    
    refs.current.values().forEach((e, i) => {
      if (e !== null) {
        const n = Number(e.value)
        if (!Number.isNaN(n)) {
          map.set(i, n);
          s.add(n);
        } else {
          msg = 'Only use numbers'
        }
      }
    });
    if (!s.isSubsetOf(ids)) {
      setErrorMsg(`Use numbers 0-${ids.size-1}`);
      return;
    }
    if(s.size !== ids.size) {
      if (msg === '')
        setErrorMsg(`Not one-to-one`);
      else
        setErrorMsg(msg);
      return;
    }
    setErrorMsg('');



    
    const adjMap = adjListToAdjMap(gameConfig.adjList);
    const newAdj = updateAdjMapIndex(adjMap, map);
    console.log(adjMap);
    console.log(newAdj);
    gameConfig.adjList = adjMapToAdjList(newAdj);
    const cyIds = cy.nodes().map(e => Number(e.id()));
    console.log('ids', cyIds);
    const positions = Object.fromEntries(cy.nodes().map(e => [e.id(), e.position()]));
    const newPos: {id: string, pos: cytoscape.Position}[] = [];
    cyIds.forEach(e => {
      let id = map.get(e);
      id ??= e;
      const pos = positions[e.toString()];

      if (id !== e) {
        delete positions[e.toString()];
        newPos.push({id: id.toString(), pos: structuredClone(pos)})
      }
    });
    newPos.forEach(e => {
      positions[e.id] = e.pos;
    });

    const newEdges = new Set<string>();
    newAdj.forEach((v, k) => 
      Array.from(v).forEach(e => 
        newEdges.add([e, k].sort((a, b) => a - b).map(e => e.toString()).join('-'))
      )
    );
    
    const update: HistoryUpdate = {
      positions,
      nextId: newAdj.size -1,
      nodes: new Set(newAdj.keys().map(e => e.toString()).toArray()),
      edges: newEdges,
    };
    console.log('test', newAdj.keys().map(e => e.toString()).toArray())
    console.log(location.state);
    console.log(update)
    updateUrl(update);
  }

  const updateUrl = (state: HistoryUpdate) => {
    if (!cy) return;
    (async () => {
      const encoded = await encodeGzipBase64Url(gameConfig);
      state.zoom = cy.zoom();
      state.pan = cy.pan();
      navigate(`/edit/${encoded}`, { state });
    })();
  }
  
  return (
    <>
      <h3>Update ids</h3>
      {ids.values().toArray().map(e => {
        return (
          <div className="flex flex-row flex-wrap gap-2 m-5">
            <p className="w-3">{e}</p>
            <p>-&gt;</p>
            <input id={e.toString()} key={e.toString()} ref={el => {refs.current.set(e, el)}} className="w-10" type='text' defaultValue={e}></input>
            <br />
          </div>
        );
      })}
      <p>Mapping must be a bijection</p>
      {errorMsg == '' ? null : <p>{errorMsg}</p>}
      <Button onClick={() => reset()}>
        Reset
      </Button>
      <Button onClick={() => cycleForward()}>
        Cycle Forward
      </Button>
      <Button onClick={() => cycleBack()}>
        Cycle Back
      </Button>
      <br />
      <Button onClick={() => update()}>
        Submit
      </Button>
    </>
  );
}