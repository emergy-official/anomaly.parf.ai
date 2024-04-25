import React from 'react';
import QRCodeSVG from '~/assets/images/qr-code.svg';
import { EDGEIMPULSE } from 'astrowind:config';

import { cameraStream, realTimePause, realTimeScore } from '~/stores/stores';
import { useStore } from '@nanostores/react';

export default function RealTimeInferenceReactDetail() {
  const $cameraStream = useStore(cameraStream);
  const $realTimePause = useStore(realTimePause);
  const $realTimeScore = useStore(realTimeScore);

  const tooglePause = () => realTimePause.set(!$realTimePause);

  return (
    <div className="md:basis-1/2 md:self-start mt-5 sm:mt-0">
      <div className="text-lg dark:text-slate-400">
        <h3 className="hidden sm:block text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
          <span className="text-accent dark:text-white highlight">Real-time</span> inference
        </h3>

        {!$cameraStream ? (
          <div className="hidden sm:block ">
            <p className="text-xl text-muted mb-6 dark:text-slate-300">
              <span className="sm:inline">Scan the QR code with your phone's camera or click allow access.</span>
            </p>
            <img className="rounded-lg" src={QRCodeSVG.src} width="250px" />
          </div>
        ) : (
          <div className="">
            <p className="text-xl text-muted mb-6 dark:text-slate-300">
              <span className="sm:inline">
                Try out the{' '}
                <a
                  className="underline text-[var(--aw-color-primary)]"
                  href="https://studio.edgeimpulse.com/public/376268/latest"
                  target={'_blank'}
                >
                  Edge Impulse FOMO-AD
                </a>{' '}
                model trained on the cookies dataset number three!
              </span>
            </p>
            <div className="mx-auto w-full max-w-4xl">
              <p className="text-xl mb-6 font-bold dark:text-slate-300">Anomaly Results</p>
              <div className="p-4 grid grid-cols-2 gap-4">
                <p className="font-medium">Threshold</p>
                <p>{EDGEIMPULSE.model_threshold.toFixed(1)}</p>

                <p className="font-medium">Mean</p>
                <p>{$realTimeScore.mean.toFixed(2)}</p>

                <p className="font-medium">Max</p>
                <p>{$realTimeScore.max.toFixed(2)}</p>

                <p className="font-medium">Time</p>
                <p>{$realTimeScore.time} (ms)</p>

                <p className="font-medium">Classification</p>
                <p>{$realTimeScore.classification}</p>
              </div>
            </div>
            <div className="mt-5 mx-auto gap-8 gap-y-4 md:gap-y-8">
              <button className="btn-primary" onClick={tooglePause}>
                {$realTimePause ? 'Start' : 'Pause'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
