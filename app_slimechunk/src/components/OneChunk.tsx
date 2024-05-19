import { isSlimeChunk } from "../utils/IsSlimeChunk";
import { pos2Chunk } from "../utils/pos2Chunk";

import "./OneChunk.css";

interface OneChunkParam {
    seed: bigint;
    x: number;
    z: number;
    playerPos: {x: number, z: number};
}

export function OneChunk({ seed, x, z, playerPos }: OneChunkParam) {
    const elmClass: string = "OneChunk "
        + (isSlimeChunk(seed, x, z) ? "SlimeYes": "SlimeNo")
        + (isSameChunk({x, z}, pos2Chunk(playerPos)) ? " playerChunk": "")
    ;

    return (
        <div className={elmClass}>({x},{z})</div>
    )
}

function isSameChunk(chunk1: {x: number, z: number}, chunk2: {x: number, z: number}) {
    return (chunk1.x===chunk2.x) && (chunk1.z===chunk2.z);
}
