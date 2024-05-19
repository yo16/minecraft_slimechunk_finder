import { JavaRandom } from "./JavaRandom";

export function isSlimeChunk(seed: bigint, x: number, z: number): boolean {
    const randomSeed = BigInt(seed) +
                       BigInt(x * x * 0x4c1906) +
                       BigInt(x * 0x5ac0db) +
                       BigInt(z * z * 0x4307a7) +
                       BigInt(z * 0x5f24f) ^
                       BigInt("0x3ad8025f");
    const rnd = new JavaRandom(randomSeed);
    return rnd.nextInt(10) === 0;
}
