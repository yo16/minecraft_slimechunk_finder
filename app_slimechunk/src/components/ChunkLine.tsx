
import { OneChunk } from "./OneChunk";

import "./ChunkLine.css";

interface ChunkLineProp {
    seed: bigint;
    xMin: number;
    z: number;
    playerPos: {x: number, z: number};
}

export function ChunkLine({ seed, xMin, z, playerPos }: ChunkLineProp) {
    const wArray = Array.from({ length: 10 }, (_, i) => i);

    return (
        <div
            className="chunk-line-container"
        >
            {wArray.map(i => (
                <OneChunk
                    key = {`oc-${i}`}
                    seed = {seed}
                    x = {xMin + i}
                    z = {z}
                    playerPos = {playerPos}
                />
            ))}
        </div>
    );
}
