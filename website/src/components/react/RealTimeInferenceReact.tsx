import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { cleanCamera, displayAnomalyScoreBlocks, getUserCamera, takeSnapshot, wait } from '~/utils/realtime';
import { TablerLock } from '../ui/icons/TablerLock';
import { cameraStream } from '~/stores/stores';
import { useStore } from '@nanostores/react';
import CameraCanvas from './CameraCanvas';
import RealTimeInferenceReactDetail from './RealTimeInferenceReactDetail';

// Wrap the loading process in a promise
export default function RealTimeInferenceReact() {
  const askForCameraAccess = async () => {
    const stream = await getUserCamera();
    if (stream) {
      cameraStream.set(stream);
    }
  };

  const $cameraStream = useStore(cameraStream);

  return (
    <div className="mx-auto max-w-7xl p-4 md:px-8">
      {/* <div className="flex flex-col-reverse md:flex-row md:gap-16 py-12 md:py-20"> */}
      {/* <div className="flex flex-col-reverse md:flex-col md:flex md:flex-row md:flex-row-reverse md:gap-16 py-12 md:py-20"> */}
      <div className="flex flex-col-reverse md:flex md:flex-row md:gap-16 py-12 md:py-20">
        <RealTimeInferenceReactDetail />
        <div className="md:mt-0 md:basis-1/2 md:self-start">
          <div className="relative m-auto max-w-4xl">
            <h3 className="sm:hidden text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
              <span className="text-accent text-[#2a9d8f] highlight">Real-time</span> inference
            </h3>
            {$cameraStream ? (
              <CameraCanvas />
            ) : (
              <button
                onClick={askForCameraAccess}
                className={`lg:w-[512px] lg:h-[512px] max-w-[512px] w-full aspect-square relative mx-auto inline-block rounded-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)] bg-gray-200 flex flex-col justify-between  
            dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur border border-[#ffffff29] bg-white dark:bg-slate-900 overflow-hidden`}
              >
                <span className="flex items-center justify-center self-center flex-grow">
                  <TablerLock width="5em" height="5em" />
                </span>
                <div className="btn-primary w-full mt-auto rounded-none">Allow camera access</div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
