import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
import fs from "fs"
/*
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_REGION=us-east-1
export INFERANCE_NAME=segment-api
export INFERANCE_URL=https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/segment-api
*/

const runtimeClient = new SageMakerRuntimeClient({ region: "us-east-1" });

// Send empty data to wake up the inference endpoint if not started
// Small hack that can win some time and avoid paying ~12$x3GB per months
const ping = async () => {
    try {

        const data = JSON.stringify({ ping: "pong" });

        const command = new InvokeEndpointCommand({
            EndpointName: process.env.INFERANCE_NAME,
            ContentType: "application/json",
            Body: data,
        });

        const response = await runtimeClient.send(command);

        // Assuming the response is a Buffer, convert it to JSON  
        // This part may vary depending on the response format from your SageMaker endpoint  
        if (response.Body) {
            console.log(response.Body);
        }
    } catch (error: any) {
        if(error.message.includes("No image provided")) {
            console.log("Ping ok")
        } else {
            console.error('Error during ping:', error.message);
            process.exit(1)
        }
    }
};
const main = async () => {
    try {
        const fileBuffer = fs.readFileSync("test.png");
        const encodedString = fileBuffer.toString("base64");

        const data = JSON.stringify({ image: encodedString });

        const command = new InvokeEndpointCommand({
            EndpointName: process.env.INFERANCE_NAME,
            ContentType: "application/json",
            Body: data,
        });

        const response = await runtimeClient.send(command);

        // Assuming the response is a Buffer, convert it to JSON  
        // This part may vary depending on the response format from your SageMaker endpoint  
        if (response.Body) {
            let resultString = "";
            if (response.Body instanceof Buffer) {
                resultString = response.Body.toString("utf-8");
            } else if (response.Body instanceof Uint8Array || typeof response.Body === "string") {
                resultString = Buffer.from(response.Body).toString("utf-8");
            }
            const result = JSON.parse(resultString);
            console.log(result);
        }
    } catch (error) {
        console.error(error);
    }
};

ping();  