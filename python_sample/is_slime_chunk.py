import random

def is_slime_chunk(seed, x, z):
    rnd = random.Random(seed +
                        (x * x * 0x4c1906) +
                        (x * 0x5ac0db) +
                        (z * z * 0x4307a7) +
                        (z * 0x5f24f) ^
                        0x3ad8025f)
    n = rnd.randint(0, 9)
    #print(n)
    return n == 0


if __name__=='__main__':
    seed = -9025379905132340883
    x = 13
    z = 12

    if is_slime_chunk(seed, x, z):
        print(f"チャンク({x}, {z})はスライムチャンクです。")
    else:
        print(f"チャンク({x}, {z})はスライムチャンクではありません。")