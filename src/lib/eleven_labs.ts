// Define your Eleven Labs API key
const ELEVEN_LABS_API_KEY = ""; // Add your Eleven Labs API key here
const sVoiceId = "21m00Tcm4TlvDq8ikWAM"; // This is the default voiceId. You can change it if needed.

// Function for making a request to Eleven Labs API and playing the response
export default async function textToSpeech(text: string, voiceId: string = sVoiceId): Promise<void> {
    // Preparing the request
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const headers = new Headers();
    headers.append("Accept", "audio/mpeg");
    headers.append("Content-Type", "application/json");
    headers.append("xi-api-key", ELEVEN_LABS_API_KEY);
    const data = {
        text: text,
        voice_settings: { stability: 0, similarity_boost: 0 }
    };
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    };

    // Making the request
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Reading the response as Blob
    const blob = await response.blob();

    // Creating object URL and audio element to play the sound
    const audioURL = URL.createObjectURL(blob);
    const audio = new Audio(audioURL);
    audio.play();
}
