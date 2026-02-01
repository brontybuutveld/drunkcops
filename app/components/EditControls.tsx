import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { encodeGzipBase64Url } from "../encoding";
import { Button } from "./Button";
import { adjMapToAdjList, adjListToAdjMap, updateAdjMapIndex, getUpdateMap } from "./matrixUtils";

import type { GameConfig, HistoryUpdate } from "~/types/types";
import type { Core, NodeCollection, ElementDefinition, NodeSingular, EdgeSingular } from 'cytoscape';
import type cytoscape from "cytoscape";

export function EditControls(
  { gameConfig, cyInstance: cy }:
  { gameConfig: GameConfig,
    cyInstance: Core | null }) {

  const [isGraphEdit, setIsGraphEdit] = useState(true);
  const [adjMap, setAdjMap] = useState<Map<number, Set<number>>>(new Map<number, Set<number>>);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleEdgeSelectability = () => {
    if (cy) isGraphEdit ? cy.edges().selectify() : cy.edges().unselectify();
  }

  const toggleSelectionType = () => {
    if (cy) cy.selectionType(isGraphEdit ? 'single' : 'additive');
  }

  const isNode = (e: NodeSingular): boolean => e.group() === 'nodes';
  const isEdge = (e: NodeSingular): boolean => e.group() === 'edges';
  const getId = (e: NodeSingular | EdgeSingular): string => e.id(); 
  const getNodeIds = (): string[] => {
    if (!cy) return [];
    return cy.nodes().map(getId);
  }
  const getEdgeIds = (): string[] => {
    if (!cy) return [];
    return cy.edges().map(getId);
  }
  const getPositions = (): { [k: string]: cytoscape.Position } => {
    if (!cy) return {};
    return Object.fromEntries(cy.nodes().map(e => [e.id(), e.position()]));
  }

  const deselectAllElements = () => {
    selectify();
    select()?.deselect();
    toggleEdgeSelectability();
  }

  const toggleEditMode = () => {
    deselectAllElements();
    
    setIsGraphEdit(!isGraphEdit);
  }

  const handleClear = () => {
    if(!cy) return;
    const nodes = select();
    if(!nodes) return;
    const ids = nodes.map(getId);
    console.log(gameConfig)
    gameConfig.nodes = gameConfig.nodes.filter(i => !ids.includes(i));
    ids.forEach(e => {
      cy.getElementById(e).data('role', '');
      const roles = gameConfig.start[e];
      gameConfig.robbers = gameConfig.robbers.filter(i => !roles.includes(i));
      gameConfig.cops = gameConfig.cops.filter(i => !roles.includes(i));
      delete gameConfig.start[e];
    })
    deselectAllElements();
    
    console.log(gameConfig)

    // const newCops = nodes?.filter(n => n.data('role') !== 'r');
    // let currentCops = gameConfig.cops;
    // newCops?.forEach(c => {
    //   const role = `c${currentCops.length+1}`;
    //   currentCops?.push(role);
    //   if (!gameConfig.nodes.includes(c.id())) gameConfig.nodes.push(c.id());
    //   (gameConfig.start[c.id()] ??= []).push(role);
    //   c?.data('role', 'c');
    // });

    const update: HistoryUpdate = {
      positions: getPositions(),
      nextId: location.state?.nextId ? location.state.nextId : cy.nodes().length - 1,
      nodes: new Set(getNodeIds()),
      edges: new Set(getEdgeIds()),
    }

    updateUrl(update);
  }

  const handleCop = () => {
    if(!cy) return;
    const nodes = select();
    deselectAllElements();

    const newCops = nodes?.filter(n => n.data('role') !== 'r');
    let currentCops = gameConfig.cops;
    newCops?.forEach(c => {
      const role = `c${currentCops.length+1}`;
      currentCops?.push(role);
      if (!gameConfig.nodes.includes(c.id())) gameConfig.nodes.push(c.id());
      (gameConfig.start[c.id()] ??= []).push(role);
      c?.data('role', 'c');
    });

    const update: HistoryUpdate = {
      positions: getPositions(),
      nextId: location.state?.nextId ? location.state.nextId : cy.nodes().length - 1,
      nodes: new Set(getNodeIds()),
      edges: new Set(getEdgeIds()),
    }

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

  const handleRobber = () => {
    if(!cy) return;
    const nodes = select();
    deselectAllElements();

    const newRobbers = nodes?.filter(n => n.data('role') !== 'c');
    let currentRobbers = gameConfig.robbers;
    newRobbers?.forEach(r => {
      const role = `r${currentRobbers.length+1}`;
      currentRobbers?.push(role);
      if (!gameConfig.nodes.includes(r.id())) gameConfig.nodes.push(r.id());
      (gameConfig.start[r.id()] ??= []).push(role);
      r?.data('role', 'r');
    });

    const update: HistoryUpdate = {
      positions: getPositions(),
      nextId: location.state?.nextId ? location.state.nextId : cy.nodes().length - 1,
      nodes: new Set(getNodeIds()),
      edges: new Set(getEdgeIds()),
    }

    updateUrl(update);
  }

  const select = (): NodeCollection | undefined => {
    if (cy) return cy.$(':selected');
    else [];
  }

  const unselectify = () => {
    cy?.nodes().unselectify();
    cy?.edges().unselectify();
  }

  const selectify = () => {
    cy?.nodes().selectify();
    cy?.edges().selectify();
  }

  const addEdges = () => {
    if(!cy) return;
    const elements = select();
    if(!elements) return;
    const nodes = elements.filter(isNode).map(e => Number(e.id()));
    console.log(nodes)
    let newAdj = new Map(adjMap);
    let edges = new Set(getEdgeIds());
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        newAdj.get(nodes[i])?.add(nodes[j]);
        newAdj.get(nodes[j])?.add(nodes[i]);
        edges.add(`${nodes[i]}-${nodes[j]}`);
      }
    }

    //gameConfig.graph6 = Graph6.parse(adjMapToMatrix(newAdj));
    gameConfig.adjList = adjMapToAdjList(newAdj);

    const update: HistoryUpdate = {
      positions: getPositions(),
      nextId: location.state?.nextId ? location.state.nextId : newAdj.size,
      nodes: new Set(getNodeIds()),
      edges
    }

    updateUrl(update);
  }

  const deleteElement = () => {
    if(!cy) return;
    const elements = select();
    if(!elements) return;
    
    elements.forEach((e) => {
      const id = e.id()
      const i = gameConfig.nodes.indexOf(id);
      if (i === -1) return;
      gameConfig.nodes = gameConfig.nodes.filter(e => e !== id);
      gameConfig.robbers = gameConfig.robbers.filter(r => gameConfig.start[id].includes(r));
      gameConfig.cops = gameConfig.cops.filter(c => gameConfig.start[id].includes(c));
      delete gameConfig.start[id];
    });
    const nodes = elements.filter(isNode);
    const edges = elements.filter(isEdge);

    let newAdj = new Map(adjMap);
    let ed = new Set<string>();

    edges.forEach(e => {
      const target = Number(e.data('target'));
      const source = Number(e.data('source'));
      const t = newAdj.get(target);
      const s = newAdj.get(source);
      t?.delete(source);
      s?.delete(target);
      ed.add(`${source}-${target}`)
    });

    nodes.forEach(n => {
      const ids = n.connectedEdges().map(e => [Number(e.data('source')), Number(e.data('target'))]);
      ids.forEach(i => {
        let j = newAdj.get(i[0]);
        let k = newAdj.get(i[1]);
        j?.delete(i[1]);
        k?.delete(i[0]);
        if(j) newAdj.set(i[0], j);
        if(k) newAdj.set(i[1], k);
      });
      
      console.log('deleted:', newAdj.delete(Number(n.id())));
      console.log(newAdj);
      console.log(gameConfig)
      n.connectedEdges().map(getId).forEach(e => ed.add(e))
    });
    const updateMap = getUpdateMap(newAdj)
    const updatedAdjMap = updateAdjMapIndex(newAdj, updateMap);
    //gameConfig.graph6 = Graph6.parse(adjMapToMatrix(newAdj));
    gameConfig.adjList = adjMapToAdjList(updatedAdjMap);
    console.log(updatedAdjMap)
    let newEdges = new Set<string>();
    updatedAdjMap.forEach((v, k) => {
      Array.from(v).forEach(e => {
        newEdges.add([e, k].sort((a, b) => a - b).map(e => e.toString()).join('-'));
      })
    })

    let positions = getPositions();
    const nodeIdsToRemove = new Set(nodes.map(getId));
    //const n = getNodeIds().filter(id => !nodeIdsToRemove.has(id));
    const n = updatedAdjMap.keys().map(e => e.toString()).toArray();
    nodeIdsToRemove.forEach(id => delete positions[id]);

    let ids = cy.nodes().map(e => e.id());


    const newPos: {id: string, pos: cytoscape.Position}[] = [];

    ids.forEach(e => {
      const pos = positions[e];
      const idNum = Number(e)
      let newId = updateMap.get(idNum);
      newId ??= idNum

      if (newId !== idNum) {
        delete positions[e.toString()];
        newPos.push({id: newId.toString(), pos: structuredClone(pos)})
      }
    });
    newPos.forEach(e => {
      positions[e.id] = e.pos;
    });
    

    const update: HistoryUpdate = {
      positions,
      nextId: updatedAdjMap.size -1,
      nodes: new Set(n),
      edges: newEdges,
    }
    deselectAllElements()

    updateUrl(update);
  }

  useEffect(() => {
    if (!cy) return;

    const addNewNode = (event: any) => {
      if (event.target === cy) {
        if (adjMap && isGraphEdit) {
          const newMap = new Map(adjMap)
          const nextId = location.state?.nextId ? location.state.nextId + 1 : newMap.size;
          const newPos = {[nextId]: { x: event.position.x, y: event.position.y }};
          newMap.set(newMap.size, new Set())
          
          //gameConfig.graph6 = Graph6.parse(adjMapToMatrix(newMap));
          gameConfig.adjList = adjMapToAdjList(newMap)

          const update: HistoryUpdate = {
            positions: {...getPositions(), ...newPos},
            nextId,
            nodes: new Set([...getNodeIds(), nextId.toString()]),
            edges: new Set(getEdgeIds()),
          }

          updateUrl(update);
        }
      }
    };

    const preventBackgroundDeselect = (event: any) => {
      if (event.target === cy) {
        unselectify();
      } else if (isNode(event.target)) {
        selectify();
      } else if (isEdge(event.target)) {
        toggleEdgeSelectability();
      }
    }

    cy.on('tap', addNewNode);
    cy.on('click', preventBackgroundDeselect);

    return () => {
      cy.off('tap', addNewNode);
      cy.off('click', preventBackgroundDeselect);
    };
  }, [cy, adjMap, isGraphEdit, gameConfig]);

  useEffect(() => {
    if (!location.state?.nodes) {
      setAdjMap(adjListToAdjMap(gameConfig.adjList));
    } else {
      const edges = [...(location.state.edges as Set<string>)].map(e => e.split('-').map(i => Number(i)));
      const nodes = [...location.state.nodes].map(e => Number(e));
      let map = new Map(nodes.map(e => [e, new Set<number>()]));
      edges.forEach(e => {
        map.get(e[0])?.add(e[1]);
        map.get(e[1])?.add(e[0]);
      })
      setAdjMap(map);
    }
  }, [location.state]);

  return (
    <>
      { isGraphEdit
        ?
          <>
            <Button onClick={ toggleEditMode }>swap to role edit</Button>
            <Button onClick={ deleteElement }>delete element</Button>
            <Button onClick={ addEdges }>add edges</Button>
          </>
        :
          <>
            <Button onClick={ toggleEditMode }>swap to graph edit</Button>
            <Button onClick={ handleCop }>Add cop</Button>
            <Button onClick={ handleRobber }>Add robber</Button>
            <Button onClick={ handleClear }>Clear roles</Button>
          </>
      }
    </>
  );
}
