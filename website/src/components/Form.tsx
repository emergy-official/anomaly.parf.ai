import { useState, useEffect, useRef } from "preact/hooks";
import { sendAnomalyRequest, startLambda, getRandomElement } from "../utils";
import ComparisonSlider from "./ComparisonSlider";
export default function Form() {

  const [lambdaStarted, setLambdaStarted] = useState(false);
  const [image, setImage] = useState('');
  const [prediction, setPrediction] = useState({
    label: "",
    score: 0
  });
  const [loading, setLoading] = useState(false);
  const fileRef: any = useRef();

  const triggerClick = () => {
    fileRef.current.click()
  }

  useEffect(() => {
    startLambda(lambdaStarted, setLambdaStarted)
  }, []);

  const processNewImage = async (imgBase64: string) => {
    setLoading(true)
    setImage(imgBase64);
    setPrediction({
      label: "",
      score: 0
    })
    const res = await sendAnomalyRequest(imgBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ""))
    if (res?.predictions?.label) {
      setPrediction({
        label: res?.predictions?.label,
        score: res?.predictions?.score
      })
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
      <h1>Anomaly Inference (API)</h1>
      <div class="inputs">
        <input ref={fileRef} type="file" id="file-input" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <label htmlFor="file-input" class="btns">
          <button disabled={loading} className={"predict"} onClick={triggerClick}>Upload an image</button>
          <a href="/live"><button disabled={loading} className={"predict"}>Live camera</button></a>
        </label>
      </div>

      {image && <img className="img" src={image} alt="Uploaded preview" style={{ maxWidth: '300px' }} />}
      {prediction?.label ? <>
        <br/> {prediction.label} ({prediction.score.toFixed(4)})
      </> : ""}

      <div class={`loading ${loading ? "icon-visible" : ""}`}>
        <br/>
        <i class="fa-solid fa-spinner-scale fa-spin-pulse"></i>
      </div>

    </div>
  );
}
