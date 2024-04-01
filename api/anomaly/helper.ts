// helper.ts  
export function helperFunction(): string {
    return "Hello from helper!";
}

import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";

const runtimeClient = new SageMakerRuntimeClient({ region: "us-east-1" });

// Wait for x ms
export const wait = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reusable to return the object from a lambda
export const returnData = (data: any) => {
    const output = {
        statusCode: 200,
        body: JSON.stringify(data)
    };

    console.log("OUTPUT", output)
    return output
}



export const pingInference = async () => {
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
        if (error.message.includes("No image provided")) {
            console.log("Ping ok")
            return returnData({ success: true })
        } else {
            console.error('Error during ping:', error.message);
            process.exit(1)
        }
    }
};
export const segmentImage = async (encodedString: string) => {
    try {
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
            return returnData(result)
        }
    } catch (error) {
        console.error(error);
    }
};