import { useState, useEffect, useRef } from 'preact/hooks';
import { cleanCamera, displayAnomalyScoreBlocks, getUserCamera, takeSnapshot, wait } from '~/utils/realtime';
import { TablerLock } from '../ui/icons/TablerLock';
import { cameraStream } from '~/stores/stores';
import { useStore } from '@nanostores/preact';
import CameraCanvas from './CameraCanvas';
import RealTimeInferencePreactDetail from './RealTimeInferencePreactDetail';
import ServerlessInferencePreactDetail from './ServerlessInferencePreactDetail';
import ComparisonSlider from '../ComparaisonSlider/ComparisonSlider';

// import { sendAnomalyRequest, startLambda, getRandomElement, urlToBlobText, unzip, urlToBlob, blobToText, blobToDataUrl } from "../utils";
// import ComparisonSlider from "./ComparisonSlider";
// import { EdgeImpulseClassifier } from "../libs/classifier";

// Wrap the loading process in a promise
export default function ServerlessInferencePreact() {
  
  return (
    <div class="mx-auto max-w-7xl p-4 md:px-8">
      {/* <div class="flex flex-col-reverse md:flex-row md:gap-16 py-12 md:py-20"> */}
      {/* <div class="flex flex-col-reverse md:flex-col md:flex md:flex-row md:flex-row-reverse md:gap-16 py-12 md:py-20"> */}
        <ServerlessInferencePreactDetail />
        
    </div>
  );
}
