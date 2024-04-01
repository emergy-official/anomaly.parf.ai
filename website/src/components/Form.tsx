import { useState, useEffect, useRef } from "preact/hooks";
import { sendSegmentRequest, startLambda, getRandomElement } from "../utils";
import ComparisonSlider from "./ComparisonSlider";
export default function Form() {

  const [lambdaStarted, setLambdaStarted] = useState(false);
  const [image, setImage] = useState('');
  const [mask, setMask] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef: any = useRef();

  const sampleImages = [
    "sample1.png",
    "sample2.png",
    "sample3.png",
    "sample4.png",
    "sample5.png",
    "sample6.png",
    "sample7.png",
    "sample8.png",
    "sample9.png",
  ]


  const triggerClick = () => {
    fileRef.current.click()
  }
  const getImgToBase64 = async (imgPath: string) => {
    try {
      const response = await fetch(imgPath);
      const blob = await response.blob(); // Convert the response to a blob  

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Resolve the promise with the Base64 data  
        reader.onerror = reject; // Reject the promise on error  
        reader.readAsDataURL(blob); // Read the blob as Base64  
      });
    } catch (error) {
      console.error('Error:', error);
      throw error; // Rethrow the error to handle it outside  
    }
  }

  const triggerClickRandom = async () => {
    setLoading(true)

    const imgPath = `/samples/${getRandomElement(sampleImages)}` // e.g., "/public/samples/sample1.png"  
    const imgBase64 = await getImgToBase64(imgPath)
    processNewImage(imgBase64 as string)
  }

  useEffect(() => {
    startLambda(lambdaStarted, setLambdaStarted)
  }, []);

  const processNewImage = async (imgBase64: string) => {
    setLoading(true)
    setImage(imgBase64);
    setMask("");
    const res = await sendSegmentRequest(imgBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ""))
    if (res?.predictions?.base64_image) {
      console.log(res?.predictions?.base64_image)
      setMask(`data:image/png;base64,${res?.predictions?.base64_image}`);
    }
    setLoading(false)
  }
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader: any = new FileReader();
      reader.onloadend = async () => {
        if (reader?.result) {
          processNewImage(reader?.result)
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div class="form">
      <h1>Semantic Segmentation</h1>
      <div class="inputs">
        <input ref={fileRef} type="file" id="file-input" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <label htmlFor="file-input" class="btns">
          <button disabled={loading} className={"predict"} onClick={triggerClick}>Click to segment an image</button>
          <button disabled={loading} className={"predict"} onClick={triggerClickRandom}>Random</button>
        </label>
      </div>


      {/* {mask && <img src={mask} alt="Uploaded preview" style={{ maxWidth: '512px', maxHeight: '400px' }} />}
      {mask && (
        <div style={{ position: 'relative' }}>
          <img src={image} alt="Uploaded preview" style={{ maxWidth: '512px', maxHeight: '400px' }} />
          <img
            src={mask}
            alt="Mask"
            style={{ maxWidth: '512px', maxHeight: '400px', position: 'absolute', top: 0, left: 0, opacity: 0.5 }}
          />
        </div>
      )} */}
      {image && <ComparisonSlider topImage={image} bottomImage={mask} />}
      {/* {image && <ComparisonSlider topImage={image} bottomImage={mask} />} */}


    </div>
  );
}
