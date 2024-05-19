import { useState, useRef } from 'react';

import { pos2Chunk } from './utils/pos2Chunk';
import { ChunkMap } from './components/ChunkMap';

import './App.css';

type PlayerPosType = {
  x: number;
  z: number;
};

function App() {
  const [seed, setSeed] = useState("0");
  const [playerPos, setPlayerPos] = useState<PlayerPosType>({x: 0, z: 0});
  const refSeed = useRef(null);
  const refPlayerPosX = useRef(null);
  const refPlayerPosZ = useRef(null);

  //const seed = BigInt("-9025379905132340883");
  //const playerPos = {x: 213, z: 9};
  const chunkXZ = pos2Chunk(playerPos);
  //const chunckX = Math.floor(Number(playerPos.x)/16);
  //const chunckZ = Math.floor(Number(playerPos.z)/16);

  // seed値の変更
  function handleOnChangeSeed(seedValue: string) {
    // 数値にパースできない場合は何もせず抜ける
    if (isNaN(Number(seedValue))) {
      return;
    }
    // 変更
    setSeed(seedValue);
  }
  // xの変更
  function handleOnChangeX(value: string) {
    // 数値にパースできない場合は何もせず抜ける
    if (isNaN(Number(value))) {
      return;
    }
    // 変更
    setPlayerPos({...playerPos, x:Number(value)});
  }
  // zの変更
  function handleOnChangeZ(value: string) {
    // 数値にパースできない場合は何もせず抜ける
    if (isNaN(Number(value))) {
      return;
    }
    // 変更
    setPlayerPos({...playerPos, z:Number(value)});
  }

  return (
    <div className="App">
      <div>
        seed: <input
          ref={refSeed}
          defaultValue={seed}
          onChange={(event) => handleOnChangeSeed(event.target.value)}
        />
      </div>
      <div>
        プレイヤーの位置
        <div
          style={{ paddingLeft:"30px" }}
        >
          <div>
            x: <input
              ref={refPlayerPosX}
              defaultValue={playerPos.x}
              onChange={(event) => handleOnChangeX(event.target.value)}
            />
          </div>
          <div>
            z: <input
              ref={refPlayerPosZ}
              defaultValue={playerPos.z}
              onChange={(event) => handleOnChangeZ(event.target.value)}
            />
          </div>
          <div>
            プレイヤーがいるチャンク座標＝x:{chunkXZ.x}, z:{chunkXZ.z}
          </div>
        </div>
      </div>

      <ChunkMap
        seed = {BigInt(seed)}
        xMin = {chunkXZ.x-5}
        zMin = {chunkXZ.z-5}
        playerPos = {playerPos}
      />
    </div>
  );
}

export default App;
