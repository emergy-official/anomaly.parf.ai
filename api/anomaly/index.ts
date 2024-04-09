// index.ts  
import { pingInference, returnData, anomalyImage } from './helper';

// Incoming lambda request
export async function handler(event: any, _: any) {
  console.log("INPUT", event);

  // POST method to submit the feedback
  if (event.httpMethod == "POST") {
    const params = JSON.parse(event.body);
    if (params.base64) {
      return anomalyImage(params.base64)
    }
  } else if (event.httpMethod == "GET") {
    // Ping the inference
    return pingInference()
  }

  // Something else that should not happen.
  return returnData({
    message: "Nothing to say"
  })
}  