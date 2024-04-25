import React from 'react';

import { useState, useEffect, useRef } from 'react';
import { cleanCamera, displayAnomalyScoreBlocks, getUserCamera, takeSnapshot, wait } from '~/utils/realtime';
import { cameraStream, realTimePause, realTimeScore } from '~/stores/stores';
import { useStore } from '@nanostores/react';
import { EDGEIMPULSE } from 'astrowind:config';

import { unzip, urlToBlob, blobToText, blobToDataUrl } from '~/utils/edge-impulse/utils';
// import ComparisonSlider from "./ComparisonSlider";
import { EdgeImpulseClassifier } from '~/utils/edge-impulse/classifier';

// Wrap the loading process in a promise
export default function CameraCanva() {
  const videoRef: any = useRef(null);
  const canvasRef: any = useRef(null);
  const cameraInner: any = useRef(null);

  const [tableData, setTableData]: any = useState([]);
  const [classifier, setClassifier]: any = useState({});
  const [isPaused, setPause]: any = useState(false);
  const $cameraStream = useStore(cameraStream);
  const $realTimePause = useStore(realTimePause);

  if ($cameraStream) {
    if (videoRef.current) videoRef.current.srcObject = $cameraStream;
  }

  useEffect(() => {
    urlToBlob('/model.zip').then(async (blob) => {
      const data = await unzip(blob);
      if (!data) return;

      const model: any = data.filter((e: any) => e.filename.includes('edge-impulse-standalone.wasm'))?.pop();
      const js: any = data.filter((e: any) => e.filename.includes('edge-impulse-standalone.js'))?.pop();

      // Load JS
      let loaderText = await blobToText(js.blob);
      loaderText = 'window.WasmLoader = function (wasmBinaryFile) {\n' + loaderText + '\n' + 'return Module;\n' + '}';

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

      const wasmURL = await blobToDataUrl(model.blob);
      const module = window.WasmLoader(wasmURL);

      const c = new EdgeImpulseClassifier(module);
      await c.init();
      setClassifier(c);
    });

    // Access the user's camera
    // if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    //     (async () => {
    //         const permission = await hasCameraPermission();
    //     })();
    // let cam: any = null;
    // if (/Mobi|Android/i.test(navigator.userAgent)) {
    //     cam = navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } })
    // } else {
    //     cam = navigator.mediaDevices.getUserMedia({ video: true })
    // }
    // cam.then((stream) => {
    //     if (videoRef.current) videoRef.current.srcObject = stream;
    // })
    //     .catch((err) => console.error("Error accessing the camera: ", err));
    // }

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
    let interval: any = async () => {
      cleanCamera(cameraInner);
      if ($realTimePause) {
      }
      if (canvasRef.current && videoRef.current && classifier.classify && !$realTimePause && $cameraStream) {
        const context = canvasRef.current.getContext('2d');

        const data: any = await takeSnapshot(videoRef.current, canvasRef.current);
        let d: number[];
        if (data.values[0] instanceof Array) {
          d = data.values.reduce((curr, v) => curr.concat(v), []);
        } else {
          d = data.values;
        }

        const startTime = performance.now();
        const res = await classifier.classify(d, false);
        const timeInMS = performance.now() - startTime;
        realTimeScore.set({
          mean: res.visual_ad_mean,
          max: res.visual_ad_max,
          time: timeInMS,
          classification: res.visual_ad_max > EDGEIMPULSE.model_threshold ? 'anomaly' : 'no anomaly',
        });

        displayAnomalyScoreBlocks(res, canvasRef, videoRef, cameraInner);
        await wait(1);
        await interval();
      }
    };

    interval();
    // Cleanup function to clear interval and stop camera stream
    return () => {
      interval = () => {};
      realTimeScore.set({
        mean: 0,
        max: 0,
        time: 0,
        classification: '',
      });
    };
  }, [$cameraStream, classifier, $realTimePause]);

  return (
    <div
      className={`lg:w-[512px] lg:h-[512px] max-w-[512px] w-full aspect-square relative mx-auto inline-block rounded-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)] bg-gray-200  flex flex-col justify-between  
  dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur border border-[#ffffff29] bg-white dark:bg-slate-900 overflow-hidden`}
    >
      <div ref={cameraInner} className="w-full h-full flex justify-center items-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
        <canvas ref={canvasRef} style={{ display: 'none' }} className="mx-auto"></canvas>
      </div>
    </div>
  );
}
