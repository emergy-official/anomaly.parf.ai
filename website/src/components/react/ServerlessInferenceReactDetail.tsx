import React from 'react';
import QRCodeSVG from '~/assets/images/qr-code.svg';
import { EDGEIMPULSE } from 'astrowind:config';

import { cameraStream, realTimePause, realTimeScore } from '~/stores/stores';
import { useStore } from '@nanostores/react';
import { useRef, useState } from 'react';
import { sendAnomalyRequest } from '~/utils/serverless';
import ComparisonSlider from '../ComparaisonSlider/ComparisonSlider';

import serverlessSample from '~/utils/serverless-sample';
import anomaly from '~/assets/images/anomaly.jpeg';
import anomalyResult from '~/assets/images/anomaly-result.png';

export default function ServerlessInferenceReactDetail() {
  const inputFile: any = useRef();

  const $realTimeScore = useStore(realTimeScore);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(anomaly.src);
  const [mask, setMask] = useState(anomalyResult.src);
  const [error, setError] = useState('');

  const [prediction, setPrediction] = useState({
    label: 'anomaly',
    score: 1.3962,
    time: 12.39,
  });

  const randomSample = async () => {
    if (loading) return;
    const randomElement = serverlessSample[Math.floor(Math.random() * serverlessSample.length)];
    const response = await fetch(randomElement);
    const blob = await response.blob();

    const reader: any = new FileReader();

    reader.onloadend = () => {
      if (reader.result) {
        processNewImage(reader?.result);
      }
    };

    reader.readAsDataURL(blob);
  };
  const toggleFileInput = () => inputFile.current.click();
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader: any = new FileReader();
      reader.onloadend = async () => {
        if (reader?.result) {
          processNewImage(reader?.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processNewImage = async (imgBase64: string) => {
    setLoading(true);
    setImage(imgBase64);
    setMask('');
    setError('');
    setPrediction({
      label: '',
      score: 0,
      time: 0,
    });

    const startTime = performance.now();
    const res = await sendAnomalyRequest(imgBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ''), setError);
    const timeInMS = performance.now() - startTime;

    if (res?.predictions?.classification) {
      setPrediction({
        label: res?.predictions?.classification,
        score: res?.predictions?.score,
        time: timeInMS / 1000,
      });
      setMask(`data:image/png;base64,${res?.predictions?.heatmap_image}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col-reverse md:flex md:flex-row-reverse md:gap-16 py-12 md:py-20">
      <div className="md:basis-1/2 md:self-start mt-5 sm:mt-0">
        <div className="text-lg dark:text-slate-400">
          <h3 className="hidden sm:block text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
            <span className="text-accent dark:text-white highlight">Serverless</span> inference
          </h3>

          <div className="">
            <p className="text-xl text-muted mb-6 dark:text-slate-300">
              <span className="sm:inline">
                Using the{' '}
                <a
                  className="underline text-[var(--aw-color-primary)]"
                  href="https://arxiv.org/abs/2303.14535"
                  target={'_blank'}
                >
                  Efficient AD
                </a>{' '}
                approach, trained on the cookies dataset number three!
              </span>
            </p>
            <div className="mx-auto w-full max-w-4xl">
              <p className="text-xl mb-6 font-bold dark:text-slate-300">Anomaly Results</p>
              <div className="p-4 grid grid-cols-2 gap-4">
                <p className="font-medium">Score</p>
                <p>{prediction.score.toFixed(4)}</p>

                <p className="font-medium">Time</p>
                <p>{prediction.time.toFixed(2)} (sec)</p>

                <p className="font-medium">Classification</p>
                <p>{prediction.label}</p>
              </div>
            </div>
            <div className="mt-5 mx-auto gap-8 gap-y-4 md:gap-y-8">
              <input
                ref={inputFile}
                type="file"
                id="file-input"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                disabled={loading}
                className={`btn-primary ${loading ? 'cursor-not-allowed' : ''}`}
                onClick={toggleFileInput}
              >
                Upload an image
              </button>
              <button
                disabled={loading}
                className={`mt-2 ml-0 lg:mt-0 lg:ml-5 btn-primary ${loading ? 'cursor-not-allowed' : ''}`}
                onClick={randomSample}
              >
                Test a random sample
              </button>
              {error ? (
                <p className="mt-5 text-red-500">
                  {error}.<br />
                  See below for more details.
                </p>
              ) : (
                ''
              )}
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="md:mt-0 md:basis-1/2 md:self-start">
        <div className="relative m-auto max-w-4xl">
          <h3 className="sm:hidden text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
            <span className="text-accent dark:text-white highlight">Serverless</span> inference
          </h3>
          <ComparisonSlider loading={loading} topImage={image} bottomImage={mask} />
        </div>
      </div>
    </div>
  );
}
