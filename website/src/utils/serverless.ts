import axios from 'axios';
import { SITE } from 'astrowind:config';

const getAPIURL = () => {
    return document.location.host.includes("localhost") ? SITE.devAPIURL : "/api"
}

export const sendAnomalyRequest = async (img_64: string, setError, timeout: number = 180000) => {
    try {
        const res: any = await axios({
            method: "post",
            url: `${getAPIURL()}/anomaly`,
            data: { base64: img_64 },
            timeout
        })
        return res?.data
    } catch (e) {
        setError(e.message)
        return null
    }
}