import { useEffect, useState } from "react";
import { useParams } from "react-router"; // <- grab URL params
import { CustomGamePage } from "../components/CustomGamePage";
import type { GameConfig } from "~/types/types";
import { decodeGzipBase64Url } from "../encoding";

export default function CustomGame() {
  const params = useParams<{ gameConfig: string }>();
  const gameConfigParam = params.gameConfig;
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  useEffect(() => {
    if (gameConfigParam) {
      decodeGzipBase64Url<GameConfig>(gameConfigParam).then(setGameConfig);
    }
  }, [gameConfigParam]);

  if (!gameConfig) return null;

  return <CustomGamePage gameConfig={gameConfig} />;
}