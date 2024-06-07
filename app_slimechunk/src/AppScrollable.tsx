import { useRef, useEffect, useState } from 'react';

import { DraggableCanvas } from './components/DraggableCanvas';
import "./AppScrollable.css";

export default function AppScrollable() {
    const refSeed = useRef<HTMLInputElement>(null);
    const refX = useRef<HTMLInputElement>(null);
    const refZ = useRef<HTMLInputElement>(null);
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

        function handleInputSeed(event:any) {
            if (!inputSeed) return;
            const seedValue: bigint = BigInt(inputSeed.value);
            setStateSeed(seedValue);
        }
        function handleInputX(event:any) {
            if (!inputX) return;
            const xValue: number = Number(inputX.value);
            setStateX(xValue);
        }
        function handleInputZ(event:any) {
            if (!inputZ) return;
            const zValue: number = Number(inputZ.value);
            setStateZ(zValue);
        }

        inputSeed.addEventListener("input", handleInputSeed);
        inputX.addEventListener("input", handleInputX);
        inputZ.addEventListener("input", handleInputZ);
        return () => {
            inputSeed.removeEventListener("input", handleInputSeed);
            inputX.removeEventListener("input", handleInputX);
            inputZ.removeEventListener("input", handleInputZ);
        }
    });

    // Goボタンクリック時
    function handleOnClickGo() {
        // 強制的に再描画させるため、forceDrawValueをインクリメントする
        setForceDrawValue(forceDrawValue+1);
    }

    return (
        <>
            <div className="app-container">
                <div className="inputs-container">
                    <div className="input-box">
                        <div className="input-title">Seed:</div>
                        <input
                            type="text"
                            defaultValue={stateSeed.toString()}
                            ref={refSeed}
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
                    forceDraw={forceDrawValue}
                />
            </div>
        </>
    );
}
