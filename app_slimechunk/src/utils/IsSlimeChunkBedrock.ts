// bedrock version

import MersenneTwister from "mersenne-twister";

export function isSlimeChunkBedrock(x: number, z: number): boolean {
    let x_uint    = x >>> 0;
    let z_uint    = z >>> 0;
    let seed      = umul32_lo(x_uint, 0x1f1f1f1f) ^ z_uint;
    let mt        = new MersenneTwister(seed);
    let n         = mt.random_int();

    return (n % 10 === 0);
    //return true;
}

function umul32_lo(a: number, b: number): number {
    let a00 = a & 0xFFFF;
    let a16 = a >>> 16;
    let b00 = b & 0xFFFF;
    let b16 = b >>> 16;

    let c00 = a00 * b00;
    let c16 = c00 >>> 16;

    c16 += a16 * b00;
    c16 &= 0xFFFF;
    c16 += a00 * b16;

    let lo = c00 & 0xFFFF;
    let hi = c16 & 0xFFFF;

    return ((hi << 16) | lo) >>> 0;
}
