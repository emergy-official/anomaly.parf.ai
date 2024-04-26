import { pingInference, anomalyImage } from "./helper";
import fs from "fs"
// Test feedback values
// UPDATE THIS CODE FOR THE ANOMALY API IF NEEDED
// test('Ping inference', async () => {
//     const response = await pingInference();
//     expect(response).toBe(true)
// });

// // // Test sending feedback values
// test('Anomaly image', async () => {
//     const fileBuffer = fs.readFileSync("test.png");
//     const encodedString = fileBuffer.toString("base64");
//     const response:any = await anomalyImage(encodedString);
//     // const body: any = JSON.parse(response.body)
//     expect(response?.predictions?.base64_image?.length).toBeGreaterThan(0)
//     expect(Object.keys(response?.predictions?.polygons_json)?.length).toBeGreaterThan(0)
// });