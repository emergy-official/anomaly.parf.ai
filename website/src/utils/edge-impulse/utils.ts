declare global {
    interface Window {
        WasmLoader: (wasmUrl: string) => any;
        blb: Blob;
        wasmFeatureDetect: {
            simd: () => Promise<boolean>;
        };
    }
}
export const getRandomElement = (arr: any) => {
    return arr[Math.floor(Math.random() * arr.length)];
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