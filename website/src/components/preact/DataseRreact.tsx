import { useState, useEffect, useRef } from 'react';
import DatasetReactDetail from './DatasetReactDetail';

// import { sendAnomalyRequest, startLambda, getRandomElement, urlToBlobText, unzip, urlToBlob, blobToText, blobToDataUrl } from "../utils";
// import ComparisonSlider from "./ComparisonSlider";
// import { EdgeImpulseClassifier } from "../libs/classifier";

// Wrap the loading process in a promise
export default function DatasetReact({...props}) {
  
  return (
    <div className="mx-auto max-w-7xl p-4 md:px-8">
      {/* <div className="flex flex-col-reverse md:flex-row md:gap-16 py-12 md:py-20"> */}
      {/* <div className="flex flex-col-reverse md:flex-col md:flex md:flex-row md:flex-row-reverse md:gap-16 py-12 md:py-20"> */}
        <DatasetReactDetail isDark={props.isDark}/>
        
    </div>
  );
}
