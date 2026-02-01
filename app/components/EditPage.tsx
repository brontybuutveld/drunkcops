import CytoscapeComponent from "react-cytoscapejs";
import { useState, useEffect, useRef, useReducer } from "react";
import coseBilkent from 'cytoscape-cose-bilkent';
import Cytoscape from 'cytoscape';
import { useNavigate, useLocation, useNavigationType } from "react-router";
import { encodeGzipBase64Url } from "../encoding";
import { Button } from "./Button";
import { Frame } from "./Frame";
import { EditIds } from "./EditIds";
import { adjListToAdjMat } from "./matrixUtils";

import type { Core, ElementDefinition, NodeCollection } from 'cytoscape';
import type { GameConfig, HistoryUpdate } from "~/types/types";
import { EditControls } from "./EditControls";
import Graph6 from "../Graph6";

export function EditPage({ gameConfig }: { gameConfig: GameConfig }) {
  Cytoscape.use(coseBilkent);
  //#080a11
  //#060911
  //"#f5f5f5"
  const layout = { name: "cose-bilkent" };
  const style = {
    width: "600px",
    height: "400px",
    //background: "oklch(13% 0.028 261.692)"
  }
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
    // {
    //   selector: 'label',
    //   css: {
    //     color: 'black'
    //   }
    // },
    {
      selector: "node",
      css: {
        // "text-valign": "center",
        // "text-halign": "center",
        height: "30px",
        width: "30px",
        //color: "red",
        //'background-color': 'green'
        //"border-color": "black",
        //"border-opacity": "1",
        //"border-width": "10px"
      }
    }
  ]
  
  const [currentGameConf, setCurrentGameConf] = useState<GameConfig>(gameConfig);
  const [adjList, setAdjList] = useState<number[][]>([]);
  const [cy, setCy] = useState<Core | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [nodesLoaded, setNodesLoaded] = useState(false);
  const [nodes, setNodes] = useState<NodeCollection>();
  const [idRoleToggle, setIdRoleToggle] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

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

  const runLayout = () => {
    if (!cy) return;
    const pos = location.state?.positions;
    if (isFirstLoad && !pos) {
      setIsFirstLoad(false)
      makeVisible();
    }
    if(!gameConfig?.pos)
      cy.layout(layout).run();
    else {
      console.log(gameConfig.pos)
      gameConfig.pos.forEach(e => cy.getElementById(e.id).position(e.pos));
    }
  }

  const makeVisible = () => {
    cy?.batch(() => {
      cy?.nodes().forEach((n) => {
        n.removeClass('hidden');
      });
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

  const continueToGame = () => {
    if (!cy) return;
    let state = location.state;
    state ??= {};
    (async () => {
      const pos = true;
      if (pos) {
        gameConfig.pos = [];
        cy.nodes().positions(e => {
          gameConfig.pos.push({id: e.id(), pos: e.position()});
          return e.position();
        });
      }
      const encoded = await encodeGzipBase64Url(gameConfig);
      console.log(cy.zoom())
      console.log(state)
      state.zoom = cy.zoom();
      state.pan = cy.pan();
      

      navigate(`/customGame/${encoded}`, { state });
    })();
  }

  useEffect(() => {
    updateLabels();
  }, [currentGameConf.cops, currentGameConf.robbers]);

  useEffect(() => {
    setAdjList(currentGameConf.adjList);
  }, [currentGameConf.adjList]);

  useEffect(() => {
    setCurrentGameConf(gameConfig);
  }, [gameConfig]);

  useEffect(() => {
    cy?.remove(cy.edges());
    const newEdges = generateEdgeObjects(adjList);
    cy?.add(newEdges);
    runLayout();
      
  }, [nodesLoaded]);

  useEffect(() => {
    updatePositions();
  }, [location.state?.positions, nodes]);

  useEffect(() => {
    if (!location.state?.positions || !cy) return;
    const nodes: Set<string> = location.state.nodes;
    const cyNodes = new Set(cy.nodes().map(e => e.id()));

    const edges: Set<string> = location.state.edges;
    const cyEdges = new Set(cy.edges().map(e => e.id()));
    console.log('edge', cyEdges);
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
        classes: (idRoleToggle) ? ['role'] : ['id']
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
    console.log('gameConfig', gameConfig)

  }, [cy, location.state?.positions]);


  useEffect(() => {
    if (!cy || !adjList || !isFirstLoad || location.state?.positions) return;
    
    console.log("adding")
    console.log(location.state)

    const targetNodeCount = adjList.length;

    cy.batch(() => {
      const currentNodes = cy.nodes();
      
      if (currentNodes.length < targetNodeCount) {
        for (let i = currentNodes.length; i < targetNodeCount; i++) {
          cy.add({
            group: 'nodes',
            data: { id: i.toString(), label: '', role: '', roles: [] },
            position: { x: 0, y: 0 },
            classes: (idRoleToggle) ? ['hidden', 'role'] : ['hidden', 'id']
          });
        }
      }

      updateLabels();
    });
    setNodesLoaded(true);
    setNodes(cy.nodes())

  }, [cy, adjList]);

  useEffect(() => {
    cy?.viewport({zoom: location.state?.zoom, pan: location.state?.pan });
  }, [cy])

  useEffect(() => {
    if (isFirstLoad && cy) {
      gameConfig.nodes.forEach((n) => {
        let role = '';
        if (gameConfig.cops.includes(gameConfig.start[n][0])) { // needs improvement
          role = 'c';
        } else {
          role = 'r';
        }
        cy?.getElementById(n).data('role', role);
      });
    };
  }, [gameConfig, isFirstLoad, cy]);

  const toggleRoles = () => {
    if (!idRoleToggle) {
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

  const graph6Ref = useRef<HTMLButtonElement>(null);
  const adjMatRef = useRef<HTMLButtonElement>(null);
  const adjListRef = useRef<HTMLButtonElement>(null);
  const buttonCopied = (ref: React.RefObject<HTMLButtonElement | null>) => {
    if (!ref.current) return;
    const defaultText = ref.current.innerText;
    ref.current.innerText = 'Copied!';
    const id = ref.current.id;
    console.log(id)
    if (id === 'graph6') {
      navigator.clipboard.writeText(Graph6.parse(adjListToAdjMat(gameConfig.adjList)));
    } else if (id === 'adjMat') {
      navigator.clipboard.writeText(JSON.stringify(adjListToAdjMat(gameConfig.adjList)));
    } else if (id === 'adjList') {
      navigator.clipboard.writeText(JSON.stringify(gameConfig.adjList));
    }
    setTimeout(() => {
      if (!ref.current) return;
      ref.current.innerText = defaultText;
    }, 2000);
  }

  return (
    <Frame className="w-[90vw] bg-gray-600">
      <div className='flex flex-row flex-wrap gap-2 m-5'>
        <Frame>
          <CytoscapeComponent
            elements={[]}
            layout={layout} 
            style={style}
            stylesheet={stylesheet}
            cy={(cy: Core) => { setCy(cy); cy.selectionType('additive'); }}
          />
          <EditControls
            gameConfig={ currentGameConf }
            cyInstance={ cy }
          />
          
          <Button onClick={() => cy?.layout(layout).run()}>COSE</Button>
          <Button onClick={toggleRoles}>toggle ids</Button>
          <br />
          <Button ref={graph6Ref} id='graph6' onClick={() => buttonCopied(graph6Ref)}>Copy graph6</Button>
          <Button ref={adjMatRef} id='adjMat' onClick={() => buttonCopied(adjMatRef)}>Copy adjacency matrix</Button>
          <Button ref={adjListRef} id='adjList' onClick={() => buttonCopied(adjListRef)}>Copy adjacency list</Button>
          <br />
          <Button onClick={continueToGame}>Continue</Button>
        </Frame>
        <Frame>
          <EditIds
            gameConfig={ currentGameConf }
            cyInstance={ cy }
          />
        </Frame>
      </div>
    
    </Frame>
  );
};

