import { useRef, useEffect } from "react";

import { isSlimeChunk } from "../utils/IsSlimeChunk";

const SLIDERRANGE_MM = {
    min: -10,
    max: 10,
};
type Point = {
    x: number;
    y: number;
};
interface DraggableCanvasProps {
    seed: bigint;
    charactorCoordinte: {
        x: number;
        z: number;
    };
}
export function DraggableCanvas({seed, charactorCoordinte}: DraggableCanvasProps) {
    // canvasへのref
    const refCanvas = useRef<HTMLCanvasElement>(null);
    // input rangeへのref
    const refRange = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const canvas = refCanvas.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        const range = refRange.current;
        if (!range) return;

        // 座標系Bの原点を、座標系Aで示したときの座標値
        let originB: Point = {x: 50, y: 50};

        // 拡大率（座標系Aに対する座標系Bの拡大率、つまり>0のとき、Bの方が大きい）
        let scale: number = 1.0;

        // ドラッグしている状態
        let isDragging: boolean = false;
        // ドラッグの開始位置
        let dragStartPoint: Point | null = null;

        // 描画
        function draw(paramOriginB?: Point) {
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

            // チャンクごとの配列
            const isSlimeChunkArray: boolean[][] = [];
            for(let chunkX=Math.floor(leftUpperB.x/16); chunkX<rightBottomB.x; chunkX++) {
                const isSlimeChunkXLine: boolean[] = [];
                for(let chunkY=Math.floor(leftUpperB.y/16); chunkY<rightBottomB.y; chunkY++) {
                    const isSC = isSlimeChunk(seed, chunkX, chunkY);
                    //console.log({isSC});
                    isSlimeChunkXLine.push(isSC);
                }
                isSlimeChunkArray.push(isSlimeChunkXLine);
            }

            // ユーザーの現在位置
            const chractorPosA = applyMatrix(matrixBA, {x: charactorCoordinte.x, y: charactorCoordinte.z});

            // 描画開始 -----
            // 初期化
            context.clearRect(0, 0, canvas.width, canvas.height);

            // チャンクごとの判定と色
            context.beginPath();
            context.fillStyle = "rgba(16, 239, 16, 0.5)";
            const topAx = applyMatrix(matrixBA, {x: Math.floor(leftUpperB.x/16)*16, y: 0}).x;
            const topAy = applyMatrix(matrixBA, {x: 0, y: Math.floor(leftUpperB.y/16)*16}).y;
            for(let x=0; x<isSlimeChunkArray.length; x++){
                for( let y=0; y<isSlimeChunkArray[x].length; y++){
                    if (isSlimeChunkArray[x][y]){
                        context.fillRect(topAx + x*chunkWidthA, topAy + y*chunkWidthA, chunkWidthA, chunkWidthA);
                    }
                }
            }
            context.fill();

            // 縦線
            context.beginPath();
            context.strokeStyle = "rgba(32, 32, 32, 0.7)";
            context.lineWidth = 1;
            for (let x = VLLeftA.x; x <= canvas.width; x += chunkWidthA) {
                context.moveTo(x, 0);
                context.lineTo(x, canvas.height);
            }
            // 横線
            for (let y = HLTopA.y; y <= canvas.height; y += chunkWidthA) {
                context.moveTo(0, y);
                context.lineTo(canvas.width, y);
            }
            context.stroke();

            // 現在の位置
            context.beginPath();
            context.fillStyle = "rgba(255, 0, 0, 0.7)";
            context.arc(chractorPosA.x, chractorPosA.y, 10, 0, 2 * Math.PI);
            context.fill();
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
            if (!isDragging) return;

            // 今のoriginBを取得
            const movingOriginB = getOriginBDragging({x: event.clientX, y: event.clientY}); 
            if (!movingOriginB) return;

            // 描画
            draw(movingOriginB)
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
        function getOriginBDragging(curMousePos: Point): Point|void{
            if (!isDragging) return;
            if (!dragStartPoint) return;

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
                : {x: refCanvas.current.width/2, y: refCanvas.current.height/2}
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
            // 平行移動→拡大
            return [
                [scale, 0, originB.x * scale],
                [0, scale, originB.y * scale],
                [0, 0, 1],
            ];
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
    }, [seed, charactorCoordinte]);

    return (
        <div style={{display:"flex",flexDirection:"column", alignItems: "flex-start", padding: "10px"}}>
            <canvas
                ref={refCanvas}
                width={500}
                height={400}
                style={{border: "1px solid #000"}}
            />
            <input
                type="range"
                ref={refRange}
                min={SLIDERRANGE_MM.min}
                max={SLIDERRANGE_MM.max}
                defaultValue={0}
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
