
import { ChunkLine } from "./ChunkLine";

import "./ChunkMap.css";

interface ChunkMapProp {
    seed: bigint;
    xMin: number;
    zMin: number;
    playerPos: {x: number, z: number};
}

export function ChunkMap({ seed, xMin, zMin, playerPos }: ChunkMapProp) {
    const wArray = Array.from({ length: 10 }, (_, i) => i);
    //console.log(playerPos);
    return (
        <div
            className="chunk-map-container"
        >
            {wArray.map(i => (
                <ChunkLine
                    key={`ch-${i}`}
                    seed={seed}
                    xMin={xMin}
                    z={zMin+i}
                    playerPos={playerPos}
                />
            ))}
        </div>
    );
}
