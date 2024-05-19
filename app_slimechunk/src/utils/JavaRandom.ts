// Javaのjava.util.Randomクラスの実装

export class JavaRandom {
    private seed: bigint;

    constructor(seed: bigint) {
        const multiplier = BigInt("0x5DEECE66D");
        const mask = (BigInt(1) << BigInt(48)) - BigInt(1);
        this.seed = (seed ^ multiplier) & mask;
    }

    next(bits: number): number {
        const multiplier = BigInt("0x5DEECE66D");
        const addend = BigInt(0xB);
        const mask = (BigInt(1) << BigInt(48)) - BigInt(1);

        this.seed = (this.seed * multiplier + addend) & mask;
        return Number(this.seed >> (BigInt(48) - BigInt(bits)));
    }

    nextInt(bound: number): number {
        if (bound <= 0) {
            throw new Error("bound must be positive");
        }

        if ((bound & (bound - 1)) === 0) { // bound is a power of 2
            return (bound * this.next(31)) >>> 31;
        }

        let bits, val;
        do {
            bits = this.next(31);
            val = bits % bound;
        } while (bits - val + (bound - 1) < 0);

        return val;
    }
}
