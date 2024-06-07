import { useRef, useEffect } from "react";

import { isSlimeChunk } from "../utils/IsSlimeChunk";
import { isSlimeChunkBedrock } from "../utils/IsSlimeChunkBedrock";

const SLIDERRANGE_MM = {
    min: -10,
    max: 10,
};
// チャンクのマスを描画する位置のオフセット
const GRAPH_OFFSET: Point = {
    x: 70,
    y: 50,
};

type Point = {
    x: number;
    y: number;
};
// x,zの順に指定するマップ
type IsSlimeChunkMapZ = Map<number, boolean>;
type IsSlimeChunkMap = Map<number, IsSlimeChunkMapZ>;

interface DraggableCanvasProps {
    seed: bigint;
    charactorCoordinte: {
        x: number;
        z: number;
    };
    version: number;
    forceDraw: number;
}
export function DraggableCanvas({
    seed, charactorCoordinte, version, forceDraw
}: DraggableCanvasProps) {
    // canvasへのref
    const refCanvas = useRef<HTMLCanvasElement>(null);
    // input rangeへのref
    const refRange = useRef<HTMLInputElement>(null);

    // isSlimeChunkの結果
    const isSlimeChunkMapRef = useRef<IsSlimeChunkMap>(new Map());
    
    useEffect(() => {
        // isSlimeChunkArrayを初期化
        isSlimeChunkMapRef.current = new Map();
    }, [seed, version]);

    useEffect(() => {
        const canvas = refCanvas.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        const range = refRange.current;
        if (!range) return;

        // 拡大率（座標系Aに対する座標系Bの拡大率、つまり>0のとき、Bの方が大きい）
        let scale: number = 1.0;
        range.value = `${scale}`;

        // 座標系Bの原点を、座標系Aで示したときの座標値
        //let originB: Point = {
        //    x: (canvas.width - GRAPH_OFFSET.x) / 2,
        //    y: (canvas.height - GRAPH_OFFSET.y) / 2
        //};
        let originB: Point = {
            x: (canvas.width - GRAPH_OFFSET.x) / 2 - charactorCoordinte.x * scale,
            y: (canvas.height - GRAPH_OFFSET.y) / 2 - charactorCoordinte.z * scale
        }

        // ドラッグしている状態
        let isDragging: boolean = false;
        // ドラッグの開始位置
        let dragStartPoint: Point | null = null;

        // 計算済みのisSlimeChunk値
        const isSlimeChunkMap: IsSlimeChunkMap = isSlimeChunkMapRef.current;

        // 描画
        function draw(paramOriginB?: Point | null, mousePos?: Point) {
            if (!canvas) return;
            if (!context) return;
            
            // この関数で使うoriginBを設定
            // パラメータがあればそれを、なければoriginBを使う
            const curOriginB = paramOriginB? paramOriginB: originB;

            // 座標系Aで、チャンク境界線のチャンクの幅
            const chunkWidthA = 16.0 * scale;

            // 座標系Aと座標系Bの変換マトリクス
            const matrixBA = getMatrixA2B(curOriginB);
            const matrixAB = inverse3x3(matrixBA);

            // canvasの左上右下の、座標系Bの座標値を計算
            const leftUpperB = applyMatrix(matrixAB, {x: 0, y: 0});
            const rightBottomB = applyMatrix(matrixAB, {x: canvas.width, y: canvas.height});
            //console.log(canvas.width);
            //console.log(canvas.height);
            //console.log({leftUpperB});
            //console.log({rightBottomB});

            // チャンク境界線の縦線(verticalLine)の左端の座標値
            const VLLeftB = (
                Math.floor(leftUpperB.x/16) + 1
            ) * 16;
            const VLLeftA = applyMatrix(matrixBA, {x: VLLeftB, y:0});
            // チャンク境界線の横線(horizonalLine)の上端の座標値
            const HLTopB = (
                Math.floor(leftUpperB.y/16) + 1
            ) * 16;
            const HLTopA = applyMatrix(matrixBA, {x: 0, y: HLTopB});

            // 表示するチャンク座標の範囲
            const chunkXMin = Math.floor(leftUpperB.x / 16);
            const chunkXMax = Math.floor(rightBottomB.x / 16);
            const chunkZMin = Math.floor(leftUpperB.y / 16);
            const chunkZMax = Math.floor(rightBottomB.y / 16);

            // チャンクごとのisSlimeChunkの計算
            for(let chunkX=chunkXMin; chunkX<=chunkXMax; chunkX++) {
                for(let chunkZ=chunkZMin; chunkZ<=chunkZMax; chunkZ++) {
                    setIsSlimeChunkIfNotExists(chunkX, chunkZ);
                }
            }

            // ユーザーの現在位置
            const charactorPosA = applyMatrix(
                matrixBA,
                {x: charactorCoordinte.x, y: charactorCoordinte.z}
            );
            const charactorChunk = {
                x: Math.floor(charactorCoordinte.x / 16),
                z: Math.floor(charactorCoordinte.z / 16),
            };

            // マウスカーソルの位置
            let cursorPosChunk = null;
            if (mousePos) {
                const cursorPosB = applyMatrix(
                    matrixAB,
                    {
                        x: mousePos.x - GRAPH_OFFSET.x,
                        y: mousePos.y - GRAPH_OFFSET.y
                    }
                );
                cursorPosChunk = {
                    x: Math.floor(cursorPosB.x / 16),
                    z: Math.floor(cursorPosB.y / 16),
                };
            }

            // 座標軸の数値を書く頻度（軸内に10個くらい）
            const tickMarksFreq = Math.floor((chunkXMax - chunkXMin)/10);
            //console.log({tickMarksFreq});
            // 今のチャンクの座標を必ず書くようにoffset値を設定
            const tickMarksOffset = {
                x: (charactorChunk.x - chunkXMin) % tickMarksFreq,
                z: (charactorChunk.z - chunkZMin) % tickMarksFreq,
            };

            // 描画開始 -----

            // 初期化
            context.clearRect(0, 0, canvas.width, canvas.height);

            // スライムチャンクごとの判定と色
            context.beginPath();
            context.fillStyle = "rgba(16, 239, 16, 0.6)";
            const topAx = applyMatrix(matrixBA, {x: chunkXMin*16, y: 0}).x;
            const topAy = applyMatrix(matrixBA, {x: 0, y: chunkZMin*16}).y;
            // x値のキー配列を取得
            for(let chunkX=chunkXMin, i=0; chunkX<=chunkXMax; chunkX++, i++){
                // z値のキー配列を取得
                const keysZ_origin = isSlimeChunkMap.get(chunkX)?.keys();
                const mapX = isSlimeChunkMap.get(chunkX);
                if (mapX && keysZ_origin) { // xもzもある
                    for( let chunkZ=chunkZMin, j=0; chunkZ<=chunkZMax; chunkZ++, j++) {
                        if (mapX.get(chunkZ)){
                            // chunk座標を座標系Aへ変換して矩形を描画
                            context.fillRect(
                                GRAPH_OFFSET.x + topAx + i * chunkWidthA,
                                GRAPH_OFFSET.y + topAy + j * chunkWidthA,
                                chunkWidthA,
                                chunkWidthA
                            );
                        }
                    }
                }
            }
            context.fill();

            // 今の位置の縦横のチャンクの色
            context.beginPath();
            context.fillStyle = "rgba(239, 16, 16, 0.2)";
            for(let chunkX=chunkXMin, i=0; chunkX<=chunkXMax; chunkX++, i++){
                for( let chunkZ=chunkZMin, j=0; chunkZ<=chunkZMax; chunkZ++, j++) {
                    if (
                        (charactorChunk.x === chunkX) ||
                        (charactorChunk.z === chunkZ)
                    ) {
                        context.fillRect(
                            GRAPH_OFFSET.x + topAx + i * chunkWidthA,
                            GRAPH_OFFSET.y + topAy + j * chunkWidthA,
                            chunkWidthA,
                            chunkWidthA
                        );
                    }
                }
            }
            context.fill();

            // カーソル位置の縦横のチャンクの色
            if (cursorPosChunk) {
                context.beginPath();
                context.fillStyle = "rgba(239, 239, 16, 0.4)";
                for(let chunkX=chunkXMin, i=0; chunkX<=chunkXMax; chunkX++, i++){
                    for( let chunkZ=chunkZMin, j=0; chunkZ<=chunkZMax; chunkZ++, j++) {
                        if (
                            (cursorPosChunk.x === chunkX) ||
                            (cursorPosChunk.z === chunkZ)
                        ) {
                            context.fillRect(
                                GRAPH_OFFSET.x + topAx + i * chunkWidthA,
                                GRAPH_OFFSET.y + topAy + j * chunkWidthA,
                                chunkWidthA,
                                chunkWidthA
                            );
                        }
                    }
                }
                context.fill();
            }

            // 縦線
            context.beginPath();
            context.strokeStyle = "rgba(32, 32, 32, 0.7)";
            context.lineWidth = 1;
            for (let x = VLLeftA.x; x <= canvas.width; x += chunkWidthA) {
                context.moveTo(GRAPH_OFFSET.x + x, GRAPH_OFFSET.y);
                context.lineTo(GRAPH_OFFSET.x + x, GRAPH_OFFSET.y + canvas.height);
            }
            // 横線
            for (let y = HLTopA.y; y <= canvas.height; y += chunkWidthA) {
                context.moveTo(GRAPH_OFFSET.x, GRAPH_OFFSET.y + y);
                context.lineTo(GRAPH_OFFSET.x + canvas.width, GRAPH_OFFSET.y + y);
            }
            context.stroke();

            // 現在の位置
            context.beginPath();
            context.fillStyle = "rgba(255, 0, 0, 0.7)";
            context.arc(
                GRAPH_OFFSET.x + charactorPosA.x,
                GRAPH_OFFSET.y + charactorPosA.y,
                10, 0, 2 * Math.PI
            );
            context.fill();

            // 座標軸
            context.beginPath();
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(
                0, 0, canvas.width, GRAPH_OFFSET.y
            );
            context.fillRect(
                0, 0, GRAPH_OFFSET.x, canvas.height
            );
            context.fill();
            // 軸のタイトル
            context.font = "20px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "rgb(32, 32, 32)";
            context.fillText(
                "X ⇨",
                GRAPH_OFFSET.x + (canvas.width - GRAPH_OFFSET.x) / 2,
                20
            );
            context.fillText(
                "Z",
                20,
                GRAPH_OFFSET.y + (canvas.height - GRAPH_OFFSET.y) / 2 - 12
            );
            context.fillText(
                "⇩",
                20,
                GRAPH_OFFSET.y + (canvas.height - GRAPH_OFFSET.y) / 2 + 12
            );


            // x軸
            context.font = "14px Arial";
            context.textAlign = "center";
            context.textBaseline = "alphabetic";
            context.fillStyle = "rgb(32, 32, 32)";
            for(let chunkX = chunkXMin, i = 0; chunkX <= chunkXMax; chunkX++, i++) {
                if ((i-tickMarksOffset.x)%tickMarksFreq === 0) {
                    context.fillText(
                        `${chunkX * 16}`,
                        GRAPH_OFFSET.x + topAx + i * chunkWidthA,
                        GRAPH_OFFSET.y - 3
                    );
                }
            }
            // z軸
            context.textAlign = "right";
            context.textBaseline = "middle";
            for(let chunkZ = chunkZMin, i = 0; chunkZ <= chunkZMax; chunkZ++, i++) {
                if ((i-tickMarksOffset.z)%tickMarksFreq === 0) {
                    context.fillText(
                        `${chunkZ * 16}`,
                        GRAPH_OFFSET.x - 3,
                        GRAPH_OFFSET.y + topAy + i * chunkWidthA
                        
                    );
                }
            }

            // 左上の空白
            context.beginPath();
            context.fillStyle = "rgb(255, 255, 255)";
            context.fillRect(
                0, 0, GRAPH_OFFSET.x, GRAPH_OFFSET.y
            );
            context.fill();

            // グラフ部を囲う
            context.beginPath();
            context.strokeStyle = "rgb(64, 64, 64)";
            context.lineWidth = 1;
            context.moveTo(GRAPH_OFFSET.x, GRAPH_OFFSET.y);
            context.lineTo(canvas.width-1, GRAPH_OFFSET.y);
            context.lineTo(canvas.width-1, canvas.height-1);
            context.lineTo(GRAPH_OFFSET.x, canvas.height-1);
            context.lineTo(GRAPH_OFFSET.x, GRAPH_OFFSET.y);
            context.stroke();
        }
        draw();

        function handleMouseDown(event: MouseEvent){
            //console.log("mouseDown");

            // ドラッグ開始
            isDragging = true;
            dragStartPoint = {x: event.clientX, y: event.clientY};
        }
        function handleMouseMove(event: MouseEvent){
            //console.log("mouseMove");
            //if (!isDragging) return;
            if (!canvas) return;

            // マウスの位置を取得（ブラウザの左上が原点）
            const mousePos: Point = {
                x: event.clientX,
                y: event.clientY
            };

            // 今のoriginBを取得
            const movingOriginB = getOriginBDragging(mousePos); 
            //if (!movingOriginB) return;

            // マウスの位置を、canvasの座標系に変換
            const rect = canvas.getBoundingClientRect();
            const canvasMousePos: Point = {
                x: mousePos.x - rect.left,
                y: mousePos.y - rect.top
            };

            // 描画
            draw(movingOriginB, canvasMousePos);
        }
        function handleMouseUp(event: MouseEvent){
            //console.log("mouseUp");

            // 今のoriginBを取得
            const finalOriginB = getOriginBDragging({x: event.clientX, y: event.clientY}); 
            if (!finalOriginB) return;

            // originBを更新
            originB = finalOriginB;

            // ドラッグ終了
            isDragging = false;
            dragStartPoint = null;
        }
        function handleMouseWheel(event: WheelEvent){
            if (!range) return;

            // マウスホイールの方向による更新値
            const wheelUp = (event.deltaY<0)? 1: -1;

            // 今のinputRangeから１つ上げ下げする
            const newInputRangeValue = range.valueAsNumber + wheelUp;
            range.value = String(newInputRangeValue);

            // inputRangeValueからscale値に変換
            const newScale: number = rangeValue2Scale(
                newInputRangeValue
            );

            // マウス位置を中心に拡大縮小
            zoomAround(
                newScale,
                {x: event.clientX, y: event.clientY}
            );

            // 再描画
            draw();
        }
        function handleRangeChange(){
            if (!range) return;

            // 値から拡大率を計算
            const newScale = rangeValue2Scale(range.valueAsNumber);
            // 拡大縮小
            zoomAround(newScale);

            // 再描画
            draw();
        }
        
        // ドラッグ中のoriginBを返す
        function getOriginBDragging(curMousePos: Point): Point | null{
            if (!isDragging) return null;
            if (!dragStartPoint) return null;

            return {
                x: originB.x + curMousePos.x - dragStartPoint.x,
                y: originB.y + curMousePos.y - dragStartPoint.y,
            };
        }

        // 拡大によるoriginBとscale値の更新
        function zoomAround(newScale: number, propCenter?: Point){
            if (!refCanvas) return;
            if (!refCanvas.current) return;
    
            // 拡大中心点（座標系A）
            const zoomCenter: Point = propCenter
                ? propCenter
                : {
                    x: refCanvas.current.width/2,
                    y: refCanvas.current.height/2
                }
            ;
    
            // 拡大中心点→originBinAを、newScale/scale 倍した先が新しいoriginBinAとなる
            // zoomCenter → OriginB ベクトル
            const vecZC2OB: Point = {
                x: (originB.x - zoomCenter.x) * newScale / scale,
                y: (originB.y - zoomCenter.y) * newScale / scale,
            };
    
            // 新しいoriginBの座標値
            const newOriginB = {
                x: zoomCenter.x + vecZC2OB.x,
                y: zoomCenter.y + vecZC2OB.y,
            };
    
            // 計算結果で更新
            originB = newOriginB;
            scale = newScale;
        }

        // 座標系A→座標系Bへの変換マトリックスを返す
        function getMatrixA2B(originB: Point){
            // 拡大→移動
            return [
                [scale, 0, originB.x],
                [0, scale, originB.y],
                [0, 0, 1],
            ];
        }

        // isSlimeChunkMapRefの操作
        function ensureZMap(x: number): IsSlimeChunkMapZ {
            let zMap = isSlimeChunkMapRef.current.get(x);
            if (!zMap) {
                zMap = new Map();
                isSlimeChunkMapRef.current.set(x, zMap);
            }
            return zMap;
        }
        function setIsSlimeChunkIfNotExists(x: number, z: number) {
            const zMap = ensureZMap(x);
            if (!zMap.has(z)) {
                if (version === 0) {
                    zMap.set(z, isSlimeChunk(seed, x, z));
                } else {
                    zMap.set(z, isSlimeChunkBedrock(x, z));
                }
            }
        }

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mouseleave", handleMouseUp);
        canvas.addEventListener("wheel", handleMouseWheel);
        range.addEventListener("input", handleRangeChange);
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
            canvas.removeEventListener("wheel", handleMouseWheel);
            range.removeEventListener('input', handleRangeChange);
        };
    }, [seed, charactorCoordinte, version]);

    return (
        <div style={{display:"flex",flexDirection:"column", alignItems: "flex-start", padding: "10px"}}>
            <canvas
                ref={refCanvas}
                width={500}
                height={400}
                style={{/* border: "1px solid #aaa" */}}
            />
            <input
                type="range"
                ref={refRange}
                min={SLIDERRANGE_MM.min}
                max={SLIDERRANGE_MM.max}
                defaultValue={0}
                style={{marginLeft: GRAPH_OFFSET.x, width: 500 - GRAPH_OFFSET.x}}
            />
        </div>
    )
}

// スライドバーのスケール値から、座標系Bのscale値へ変換する
function rangeValue2Scale(value: number) {
    return Math.pow(10, value/30);
}

// 座標に行列を適用させた結果を返す
// 計算量を減らすため、(0,1)、(1,0)はゼロの前提
function applyMatrix(mtx: number[][], p1: Point): Point {
    return {
        x: p1.x * mtx[0][0] + mtx[0][2],
        y: p1.y * mtx[1][1] + mtx[1][2],
    };
}

// 逆行列を返す
function inverse3x3(matrix: number[][]) {
    const a = matrix[0][0], b = matrix[0][1], c = matrix[0][2];
    const d = matrix[1][0], e = matrix[1][1], f = matrix[1][2];
    const g = matrix[2][0], h = matrix[2][1], i = matrix[2][2];
    
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    
    if (det === 0) throw new Error("Matrix is singular and cannot be inverted.");
    
    return [
        [(e * i - f * h) / det, -(b * i - c * h) / det, (b * f - c * e) / det],
        [-(d * i - f * g) / det, (a * i - c * g) / det, -(a * f - c * d) / det],
        [(d * h - e * g) / det, -(a * h - b * g) / det, (a * e - b * d) / det]
    ];
}
