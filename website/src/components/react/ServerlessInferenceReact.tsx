import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { cleanCamera, displayAnomalyScoreBlocks, getUserCamera, takeSnapshot, wait } from '~/utils/realtime';
import { TablerLock } from '../ui/icons/TablerLock';
import { cameraStream } from '~/stores/stores';
import { useStore } from '@nanostores/react';
import CameraCanvas from './CameraCanvas';
import RealTimeInferenceReactDetail from './RealTimeInferenceReactDetail';
import ServerlessInferenceReactDetail from './ServerlessInferenceReactDetail';
import ComparisonSlider from '../ComparaisonSlider/ComparisonSlider';

// import { sendAnomalyRequest, startLambda, getRandomElement, urlToBlobText, unzip, urlToBlob, blobToText, blobToDataUrl } from "../utils";
// import ComparisonSlider from "./ComparisonSlider";
// import { EdgeImpulseClassifier } from "../libs/classifier";

// Wrap the loading process in a promise
export default function ServerlessInferenceReact() {
  
  return (
    <div className="mx-auto max-w-7xl p-4 md:px-8">
      {/* <div className="flex flex-col-reverse md:flex-row md:gap-16 py-12 md:py-20"> */}
      {/* <div className="flex flex-col-reverse md:flex-col md:flex md:flex-row md:flex-row-reverse md:gap-16 py-12 md:py-20"> */}
        <ServerlessInferenceReactDetail />
        
    </div>
  );
}
