import axios from 'axios';

declare global {
    interface Window {
        WasmLoader: (wasmUrl: string) => any;
        blb: Blob;
        wasmFeatureDetect: {
            simd: () => Promise<boolean>;
        };
    }
}

const getAPIURL = () => {
    return document.location.host.includes("localhost") ? "https://dev.anomaly.parf.ai/api" : "/api"
}

export const getRandomElement = (arr: any) => {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const startLambda = async (isStarted: any, setIsStarted: any) => {
    if (isStarted) return;

    let attempt = 0;
    const maxAttempts = 10;
    setIsStarted(true);

    // while (attempt < maxAttempts) {
    //     try {
    //         console.log(`Attempt ${attempt}`)
    //         const timeout = attempt === 0 ? 180000 : 20000;
    //         const res: any = await sendAnomalyPingRequest(true, timeout);
    //         console.log(res)
    //         if (res?.success) {
    //             setIsStarted(true);
    //             return;  // Successful, exit the function  
    //         }
    //     } catch (e) {
    //         console.error(`Attempt ${attempt + 1} failed. Error:`, e);
    //         if (attempt === maxAttempts - 1) {
    //             alert(`Cannot initialize the service: ${e.message}`);
    //         }
    //     }
    //     attempt++;
    // }
    return null;
};

export const sendAnomalyRequest = async (img_64: string, throwError: boolean = false, timeout: number = 180000) => {
    try {
        console.log("SENDING")
        const res: any = await axios({
            method: "post",
            url: `${getAPIURL()}/anomaly`,
            data: { base64: img_64 },
            timeout
        })

        return res?.data
    } catch (e) {
        if (throwError) {
            throw e
        } else {
            console.error("Error", e)
            alert(`Error response of the API ${e.message}`)
            return null
        }
    }
}
export const sendAnomalyPingRequest = async (throwError: boolean = false, timeout: number = 180000) => {
    try {
        console.log("Sending ping request")
        const res: any = await axios({
            method: "get",
            url: `${getAPIURL()}/anomaly`,
            timeout
        })

        return res?.data
    } catch (e) {
        if (throwError) {
            throw e
        } else {
            console.error("Error", e)
            alert(`Error response of the API ${e.message}`)
            return null
        }
    }
}

export const unzip = (blob: Blob): Promise<{ filename: string; blob: Blob }[]> => {
    const ret: { filename: string; blob: Blob }[] = [];

    return new Promise((resolve, reject) => {
        window.blb = blob;

        (<any>window).zip.createReader(new (<any>window).zip.BlobReader(blob), (reader: any) => {
            reader.getEntries((entries: any) => {
                for (const e of entries) {
                    e.getData(new (<any>window).zip.BlobWriter(), (file: Blob) => {
                        ret.push({
                            filename: e.filename,
                            blob: file
                        });
                        if (ret.length === entries.length) {
                            return resolve(ret);
                        }
                    });
                }
            });
        }, (error: Error) => {
            reject(error);
        });
    });
}

export const urlToBlobText = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
            const text = reader.result;
            resolve((text || '').toString());
        });
        reader.readAsText(blob, 'UTF-8');
    });
}
export const urlToBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    return await response.blob();
}
export const blobToText = async (blob: Blob): Promise<string> => {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
            const text = reader.result;
            resolve((text || '').toString());
        });
        reader.readAsText(blob, 'UTF-8');
    });
}

export const blobToDataUrl = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const a = new FileReader();
        a.onload = e => resolve(((e.target && e.target.result) || '').toString());
        a.onerror = err => reject(err);
        a.readAsDataURL(blob);
    });
}