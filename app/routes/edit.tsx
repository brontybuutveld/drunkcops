import { useEffect, useState } from "react";
import { useParams } from "react-router"; // <- get route params
import { EditPage } from "../components/EditPage";
import type { GameConfig } from "~/types/types";
import { decodeGzipBase64Url } from "../encoding";

export default function Edit() {
  const params = useParams<{ gameConfig: string }>();
  const gameConfigParam = params.gameConfig; // <- this comes from the URL
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  useEffect(() => {
    if (gameConfigParam) {
      console.log("Decoded param:", gameConfigParam);
      decodeGzipBase64Url<GameConfig>(gameConfigParam).then(setGameConfig);
    }
  }, [gameConfigParam]);

  if (!gameConfig) return null;

  return <EditPage gameConfig={gameConfig} />;
}