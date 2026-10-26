
import os
import json
import sys
from groq import Groq

MODEL = "whisper-large-v3"


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_groq_asr.py path/to/audio.wav")
        raise SystemExit(1)

    api_key = "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"
    if not api_key:
        print("Error: Set the GROQ_API_KEY environment variable.")
        raise SystemExit(1)

    audio_path = sys.argv[1]
    client = Groq(api_key=api_key, timeout=60.0)

    with open(audio_path, "rb") as audio_file:
        result = client.audio.transcriptions.create(
            file=audio_file,
            model=MODEL,
            response_format="verbose_json",
            language="en",
            temperature=0.0,
        )

    # Convert the SDK response to a dictionary so we can
    # inspect the fields returned by the API.
    response = result.model_dump()

    print("\n=== Full API response ===")
    print(json.dumps(response, indent=2, default=str))

    segments = response.get("segments") or []

    print("\n=== Confidence field verification ===")
    print(f"Transcript: {response.get('text', '')}")
    print(f"Number of segments: {len(segments)}")

    if not segments:
        print("WARNING: No segments returned; cannot verify segment confidence.")
        return

    for index, segment in enumerate(segments):
        print(f"\nSegment {index + 1}: {segment.get('text', '')}")
        for field in ("avg_logprob", "no_speech_prob"):
            value = segment.get(field)
            print(f"  {field}: {value!r} (type: {type(value).__name__})")

    for field in ("avg_logprob", "no_speech_prob"):
        present = [
            segment.get(field) is not None
            for segment in segments
        ]
        print(
            f"\n{field}: "
            f"{sum(present)}/{len(segments)} segments have a value"
        )


if __name__ == "__main__":
    main()
