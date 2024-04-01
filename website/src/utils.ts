import axios from 'axios';

const getAPIURL = () => {
    return document.location.host.includes("localhost") ? "https://dev.segment.parf.ai/api" : "/api"
}

export const getRandomElement = (arr: any) => {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const startLambda = async (isStarted: any, setIsStarted: any) => {
    if (isStarted) return;

    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
        try {
            console.log(`Attempt ${attempt}`)
            const timeout = attempt === 0 ? 180000 : 20000;
            const res: any = await sendSegmentPingRequest(true, timeout);
            console.log(res)
            if (res?.success) {
                setIsStarted(true);
                return;  // Successful, exit the function  
            }
        } catch (e) {
            console.error(`Attempt ${attempt + 1} failed. Error:`, e);
            if (attempt === maxAttempts - 1) {
                alert(`Cannot initialize the service: ${e.message}`);
            }
        }
        attempt++;
    }
    return null;
};

export const sendSegmentRequest = async (img_64: string, throwError: boolean = false, timeout: number = 180000) => {
    try {
        console.log("SENDING")
        const res: any = await axios({
            method: "post",
            url: `${getAPIURL()}/segment`,
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
export const sendSegmentPingRequest = async (throwError: boolean = false, timeout: number = 180000) => {
    try {
        console.log("Sending ping request")
        const res: any = await axios({
            method: "get",
            url: `${getAPIURL()}/segment`,
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