import { useState, useEffect, useRef } from "preact/hooks";
import { sendAnomalyRequest, startLambda, getRandomElement, urlToBlobText, unzip, urlToBlob, blobToText, blobToDataUrl } from "../utils";
import ComparisonSlider from "./ComparisonSlider";
import { EdgeImpulseClassifier } from "../libs/classifier";

// Wrap the loading process in a promise  
const loadImage = (image) => {
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(true);
    image.onerror = reject;
  });
}
// Wrap the loading process in a promise  
const wait = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  });
}

const takeSnapshot = (video, canvas) => {

  let imageWidth = 320
  let imageHeight = 320

  canvas.width = imageWidth;
  canvas.height = imageHeight;

  return new Promise((resolve, reject) => {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error("Canvas not supported");
    }
    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(video, 0, 0, imageWidth, imageHeight);
    let imageData = context.getImageData(0, 0, imageWidth, imageHeight);
    let values = [];
    for (let ix = 0; ix < imageWidth * imageHeight; ix++) {
      // tslint:disable-next-line: no-bitwise
      values.push(Number((imageData.data[ix * 4] << 16)
        // tslint:disable-next-line: no-bitwise
        | (imageData.data[ix * 4 + 1] << 8)
        // tslint:disable-next-line: no-bitwise
        | (imageData.data[ix * 4 + 2])));
    }

    resolve({
      values: values,
      intervalMs: 0,
      sensors: [{
        name: "image",
        units: "rgba"
      }]
    });
  });
}



const cleanCamera = (cameraInner) => {
  cameraInner.current?.querySelectorAll('.bounding-box-container').forEach(el => el.remove());
}
const displayAnomalyScoreBlocks = (res, canvasRef, videoRef, cameraInner) => {

  let widthFactor = Number(canvasRef.current.width) /
    Number(videoRef.current.clientWidth);

  let heightFactor = Number(canvasRef.current.height) /
    Number(videoRef.current.clientHeight);

  const threshold = 5.0;

  for (let b of res.visual_ad_grid_cells) {

    if (b.value < threshold) continue

    if (typeof b.x !== 'number' ||
      typeof b.y !== 'number' ||
      typeof b.width !== 'number' ||
      typeof b.height !== 'number') {
      continue;
    }
    
    let bb = {  
      x: b.x / widthFactor,  
      y: b.y / heightFactor,  
      width: b.width / widthFactor,  
      height: b.height / heightFactor,  
      label: b.label,  
      value: b.value  
    };  
      
    function valueToJetColor(value) {  
      const v = Math.max(0, Math.min(value / 100, 1)); // Ensure value is between 0 and 1  
      const r = Math.floor(255 * Math.min(4 * v - 1.5, -4 * v + 4.5));  
      const g = Math.floor(255 * Math.min(4 * v - 0.5, -4 * v + 3.5));  
      const b = Math.floor(255 * Math.min(4 * v + 0.5, -4 * v + 2.5));  
      return `rgba(${r},${g},${b}, 0.5)`;  
    }  
      
    let el = document.createElement('div');  
    el.classList.add('bounding-box-container');  
    el.style.position = 'absolute';  
    // Apply jet color map based on b.value  
    el.style.background = valueToJetColor(bb.value);  
      
    el.style.width = (bb.width) + 'px';  
    el.style.height = (bb.height) + 'px';  
    el.style.left = (bb.x) + 'px';  
    el.style.top = (bb.y) + 'px';  

    // Render label and/or scores. For visual AD, the score is printed
    // in the middle of the bounding box.
    let score = document.createElement('div');
    score.style.fontSize = `${Math.min(20, bb.width * 0.4)}px`;
    score.style.color = 'white';
    score.textContent = bb.value > 1 ? bb.value.toFixed(1) : bb.value.toFixed(2);
    el.appendChild(score);

    // Center align the score
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';

    cameraInner.current.appendChild(el);
  }
}

export default function Camera() {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInner = useRef(null);

  const [tableData, setTableData]: any = useState([])
  const [classifier, setClassifier]: any = useState({})
  const [isPaused, setPause]: any = useState(true)

  useEffect(() => {

    urlToBlob("/model.zip").then(async (blob) => {
      const data = await unzip(blob);

      if (!data) return

      const model = data.filter((e: any) => e.filename.includes("edge-impulse-standalone.wasm"))?.pop()
      const js = data.filter((e: any) => e.filename.includes("edge-impulse-standalone.js"))?.pop()

      // Load JS
      let loaderText = await blobToText(js.blob);
      loaderText = 'window.WasmLoader = function (wasmBinaryFile) {\n' +
        loaderText + '\n' +
        'return Module;\n' +
        '}';

      loaderText = loaderText.replace('var wasmBinaryFile="edge-impulse-standalone.wasm"', '');
      loaderText = loaderText.replace(`var wasmBinaryFile;\n  wasmBinaryFile = 'edge-impulse-standalone.wasm';`, '');
      const loaderBlob = new Blob([loaderText], { type: 'text/javascript' });
      const script = document.createElement('script');
      script.src = URL.createObjectURL(loaderBlob);
      window.document.body.append(script);

      // wait until script is loaded...
      await new Promise<void>((resolve, reject) => {
        script.addEventListener('load', () => resolve());
        script.addEventListener('error', reject);
      });

      const wasmURL = await blobToDataUrl(model.blob)
      const module = window.WasmLoader(wasmURL);

      const c = new EdgeImpulseClassifier(module);
      await c.init();
      setClassifier(c)
    })


    // Access the user's camera  
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => console.error("Error accessing the camera: ", err));
    }

    // Cleanup function to clear interval and stop camera stream  
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);


  const canvaWidth = 320
  const canvaHeight = 320

  useEffect(() => {

    // Capture an image every second  
    let interval: any = async () => {
      const imageWidth = 128;
      const imageHeight = 128;

      if (canvasRef.current && videoRef.current && classifier.classify && !isPaused) {
        const context = canvasRef.current.getContext('2d');
        let imageData = context.getImageData(0, 0, imageWidth, imageHeight);

        const data: any = await takeSnapshot(videoRef.current, canvasRef.current)

        let d: number[];
        if (data.values[0] instanceof Array) {
          d = (data.values).reduce((curr, v) => curr.concat(v), []);
        }
        else {
          d = data.values;
        }

        const startTime = performance.now();
        const res = await classifier.classify(d, false)
        const endTime = performance.now();
        const timeInMS = endTime - startTime;

        cleanCamera(cameraInner)
        displayAnomalyScoreBlocks(res, canvasRef, videoRef, cameraInner)
        await wait(1)
        interval()
      }
    }

    interval()
    // Cleanup function to clear interval and stop camera stream  
    return () => {
      interval = () => { }
    };
  }, [tableData, classifier, isPaused]);

  return (
    <div class="form">
      <h1>Anomaly Inference (Live)</h1>
      <div class="inputs">
        <label htmlFor="file-input" class="btns">
          <a href="/"><button className={"predict"}>Inference API</button></a>
        </label>
      </div>
      <div ref={cameraInner} className={"camera-inner"}>
        <video ref={videoRef} autoPlay playsInline style={{ width: `500px`, height: `375px`, transform: 'scaleX(-1)' }}></video>
        <canvas ref={canvasRef} style={{ display: 'none' }} width={`${canvaHeight}px`} height={`${canvaWidth}px`}></canvas>
      </div>
      <br />
      <button className={"predict"} onClick={() => {
        setPause(!isPaused)
      }}>{isPaused ? "Start" : "Pause"}</button>

      {/* <table class="nice-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Score</th>
            <th>Time</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr>
              <td>{row.label}</td>
              <td>{row.score}</td>
              <td>{row.time}</td>
              <td><img src={row.image} alt={row.label} style={{ width: `${canvaWidth}px`, height: `${canvaHeight}px` }} /></td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
}
