import { useRef, useEffect, useState } from 'react';

import { DraggableCanvas } from './components/DraggableCanvas';
import "./AppScrollable.css";

export default function AppScrollable() {
    const refSeed = useRef<HTMLInputElement>(null);
    const refX = useRef<HTMLInputElement>(null);
    const refZ = useRef<HTMLInputElement>(null);
    const [stateVersion, setStateVersion] = useState<number>(0);
    const [stateSeed, setStateSeed] = useState<bigint>(BigInt(0));
    const [stateX, setStateX] = useState<number>(0);
    const [stateZ, setStateZ] = useState<number>(0);
    const [forceDrawValue, setForceDrawValue] = useState<number>(0);

    useEffect(() => {
        const inputSeed = refSeed.current;
        if (!inputSeed) return;
        const inputX = refX.current;
        if (!inputX) return;
        const inputZ = refZ.current;
        if (!inputZ) return;

        // seed入力
        function handleInputSeed(event:any) {
            if (!inputSeed) return;
            const seedValue: bigint = BigInt(inputSeed.value);
            setStateSeed(seedValue);
        }
        // x座標入力
        function handleInputX(event:any) {
            if (!inputX) return;
            const xValue: number = Number(inputX.value);
            setStateX(xValue);
        }
        // z座標入力
        function handleInputZ(event:any) {
            if (!inputZ) return;
            const zValue: number = Number(inputZ.value);
            setStateZ(zValue);
        }

        // ハンドラー登録
        inputSeed.addEventListener("input", handleInputSeed);
        inputX.addEventListener("input", handleInputX);
        inputZ.addEventListener("input", handleInputZ);
        return () => {
            inputSeed.removeEventListener("input", handleInputSeed);
            inputX.removeEventListener("input", handleInputX);
            inputZ.removeEventListener("input", handleInputZ);
        }
    }, []);
    useEffect(() => {
        const inputSeed = refSeed.current;
        if (!inputSeed) return;

        if (stateVersion===0) {
            inputSeed.disabled = false;
        } else {
            inputSeed.disabled = true;
        }

    }, [stateVersion])

    // Goボタンクリック時
    function handleOnClickGo() {
        // 強制的に再描画させるため、forceDrawValueをインクリメントする
        setForceDrawValue(forceDrawValue+1);
    }

    return (
        <>
            <div className="app-container">
                <div className="version-selector-container input-box">
                    <div className="input-title">Version:</div>
                    <div>
                        <div>
                            <input
                                type="radio"
                                name="mc_version"
                                value="0"
                                id="mc_version_0"
                                checked={stateVersion === 0}
                                onChange={() => setStateVersion(0)}
                            /><label htmlFor="mc_version_0">Java Edition</label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                name="mc_version"
                                value="1"
                                id="mc_version_1"
                                checked={stateVersion === 1}
                                onChange={() => setStateVersion(1)}
                            /><label htmlFor="mc_version_1">Bedrock Edition</label>
                        </div>
                    </div>
                </div>
                <div className="inputs-container">
                    <div className="input-box">
                        <div
                            className={"input-title" + ((stateVersion===1)?" input-disabled":"")}
                        >Seed:</div>
                        <input
                            type="text"
                            defaultValue={stateSeed.toString()}
                            ref={refSeed}
                            className={(stateVersion===1)? "input-disabled": ""}
                        />
                    </div>
                    <div className="input-box">
                        <div className="input-title">(X, Z): </div>
                        (
                        <input
                            type="text"
                            className="input-coordinate"
                            defaultValue="0"
                            ref={refX}
                        />
                        ,
                        <input
                            type="text"
                            className="input-coordinate"
                            defaultValue="0"
                            ref={refZ}
                        />
                        )
                        <button
                            className="button-move"
                            onClick={handleOnClickGo}
                        >GO</button>
                    </div>
                </div>

                <DraggableCanvas
                    seed={stateSeed}
                    charactorCoordinte={{
                        x: stateX,
                        z: stateZ
                    }}
                    version={stateVersion}
                    forceDraw={forceDrawValue}
                />
            </div>
        </>
    );
}
