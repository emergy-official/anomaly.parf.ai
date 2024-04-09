import { useState, useEffect, useRef } from "preact/hooks";
import { sendAnomalyRequest, startLambda, getRandomElement, urlToBlobText, unzip, urlToBlob, blobToText, blobToDataUrl } from "../utils";
import ComparisonSlider from "./ComparisonSlider";
import { EdgeImpulseClassifier } from "../libs/classifier";
export default function Camera() {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
  useEffect(() => {

    // Capture an image every second  
    const interval = setInterval(async () => {
      const imageWidth = 96;
      const imageHeight = 96;
      if (canvasRef.current && videoRef.current && classifier.classify && !isPaused) {
        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, 500, 375);

        const fakeCanvas = document.createElement('canvas');
        fakeCanvas.width = imageWidth;
        fakeCanvas.height = imageHeight;

        const fakeContext = fakeCanvas.getContext('2d');  
        fakeContext.drawImage(videoRef.current, 0, 0, imageWidth, imageHeight);

        const imageDataUrl = canvasRef.current.toDataURL();
        let imageData = fakeContext.getImageData(0, 0, imageWidth, imageHeight);

        let values = [];
        for (let ix = 0; ix < imageWidth * imageHeight; ix++) {
          // tslint:disable-next-line: no-bitwise
          values.push(Number((imageData.data[ix * 4] << 16)
            // tslint:disable-next-line: no-bitwise
            | (imageData.data[ix * 4 + 1] << 8)
            // tslint:disable-next-line: no-bitwise
            | (imageData.data[ix * 4 + 2])));
        }

        const input = values.reduce((curr, v) => curr.concat(v), []);

        const startTime = performance.now();
        const res = await classifier.classify(input, false)
        const endTime = performance.now();
        const timeInMS = endTime - startTime;

        const bestScore = res?.results.reduce((highest, current) => {
          return current.value > highest.value ? current : highest;
        }, res?.results[0]);

        setTableData([
          { label: bestScore.label, score: bestScore.value.toFixed(4), time: `${timeInMS} ms`, image: imageDataUrl },
          ...tableData].slice(0, 5))
      }
    }, 100);

    // Cleanup function to clear interval and stop camera stream  
    return () => {
      clearInterval(interval);
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

      <video ref={videoRef} autoPlay playsInline style={{ width: '500px', height: '375px', transform: 'scaleX(-1)' }}></video>
      <canvas ref={canvasRef} style={{ display: 'none' }} width="500" height="375px"></canvas>

      <br />
      <p>Interval = 100ms</p>
      <button className={"predict"} onClick={() => {
        setPause(!isPaused)
      }}>{isPaused ? "Start" : "Pause"}</button>

      <table class="nice-table">
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
              <td><img src={row.image} alt={row.label} style={{ width: "96px" }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
