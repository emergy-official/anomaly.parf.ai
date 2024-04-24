import { atom } from "nanostores";
export const cameraStream: any = atom(null);
export const realTimeScore: any = atom({
    mean: 0, max: 0, classification: "", time: 0
});
export const realTimePause: any = atom(false);
