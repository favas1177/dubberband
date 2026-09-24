const sarvamKey = process.env.SARVAM_API_KEY;

async function testTranslate() {
  console.log("Testing translate API...");
  const res = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": sarvamKey || "",
    },
    body: JSON.stringify({
      input: "Please process this video: https://res.cloudinary.com/bex5ixba/video/upload/v1790232026/dubberband_sample.mp4",
      source_language_code: "ml-IN",
      target_language_code: "ta-IN",
      speaker_gender: "Male",
      mode: "formal",
      model: "sarvam-translate:v1"
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.text();
    console.error("Translate failed:", errorData);
  } else {
    const data = await res.json();
    console.log("Translate success:", JSON.stringify(data).substring(0, 500));
  }
}

async function testTTS() {
  console.log("Testing TTS API...");
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": sarvamKey || "",
    },
    body: JSON.stringify({
      inputs: ["Test input for dubbing"],
      target_language_code: "ta-IN",
      speaker: "gokul",
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_sample_rate: 8000,
      enable_preprocessing: true,
      model: "bulbul:v3"
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.text();
    console.error("TTS failed:", errorData);
  } else {
    const data = await res.json();
    console.log("TTS success (audio URL or base64 length):", data.audio_url || (data.audios ? data.audios[0].length : 0));
  }
}

async function run() {
  await testTranslate();
  await testTTS();
}
run();
