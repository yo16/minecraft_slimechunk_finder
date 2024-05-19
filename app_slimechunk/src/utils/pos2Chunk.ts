
// 座標を、チャンク座標変換する
export function pos2Chunk({x, z}: {x: number, z: number}): {x: number, z: number} {
    return {
        x: Math.floor(Number(x)/16),
        z: Math.floor(Number(z)/16),
    };
}
