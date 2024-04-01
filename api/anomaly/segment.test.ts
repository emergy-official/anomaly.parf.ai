import { pingInference, segmentImage } from "./helper";
import fs from "fs"
// Test feedback values
test('Ping inference', async () => {
    const response = await pingInference();
    expect(response).toBe(true)
});

// // Test sending feedback values
test('Segment image', async () => {
    const fileBuffer = fs.readFileSync("test.png");
    const encodedString = fileBuffer.toString("base64");
    const response:any = await segmentImage(encodedString);
    // const body: any = JSON.parse(response.body)
    expect(response?.predictions?.base64_image?.length).toBeGreaterThan(0)
    expect(Object.keys(response?.predictions?.polygons_json)?.length).toBeGreaterThan(0)
});