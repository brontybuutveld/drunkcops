import { ImportGraph } from "./ImportGraph";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { encodeGzipBase64Url } from "../encoding";
import { Frame } from "./Frame";
import { Button } from "./Button";
import Graph6 from "../Graph6";
import { adjMatToAdjList } from "./matrixUtils";

import type { SetStateAction } from "react";
import type { GameConfig } from "~/types/types";

export function SetupPage() {
  const [graphString, setGraphString] = useState("");
  const [error, setError]= useState<string | null>(null);

  const navigate = useNavigate();

  const handleGraphSubmit = (graphInput: SetStateAction<string>) => {
    setGraphString(graphInput);
  };

  async function handleContinue() {
    const adjMat = (graphString !== '') ? Graph6.toMatrix(graphString) : [];
    const adjList = adjMatToAdjList(adjMat);

    const defaultGameConfig: GameConfig = {
      adjList,
      cops: [],
      robbers: [],
      nodes: [],
      start: {},
    }
    console.log(defaultGameConfig)

    const encoded = await encodeGzipBase64Url(defaultGameConfig);
    console.log(encoded)
    navigate(`/edit/${encoded}`, { state: { prevPath: "/setup", numOfNodes: 1 }});
    return;
    
    //setError("Please set a graph before continuing");
  }

  return (
    <Frame className="w-[90vw] bg-gray-600">
      <Frame>
        <ImportGraph onGraphSubmit={ handleGraphSubmit } />
        <br />
        { (error) ? <p>{error}</p> : null }
        <Button onClick={ handleContinue }>continue</Button>
      </Frame>
    </Frame>
  )
};

