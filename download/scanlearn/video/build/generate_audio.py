#!/usr/bin/env python3
"""Generate audio narration for all ScanLearn video scenes using SarvamAI TTS"""
import os, json, time

from sarvamai import SarvamAI

client = SarvamAI(
    api_subscription_key="sk_3tnn3of1_EYNw1Sw28QHDUAOxLAcd6KZ3",
)

AUDIO_DIR = "/home/z/my-project/download/scanlearn/video/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Scene narrations - timed to match video scenes
scenes = [
    {
        "id": 1,
        "file": "scene01_problem.mp3",
        "duration": 18,
        "text": "Every day, millions of students around the world sit in classrooms, struggling to learn from textbooks that were never designed for them. In rural schools, in underfunded communities, and even in well-equipped classrooms, one-size-fits-all education leaves countless students behind. They read the same pages, memorize the same facts, and take the same tests, but true understanding remains out of reach."
    },
    {
        "id": 2,
        "file": "scene02_teacher.mp3",
        "duration": 14,
        "text": "And it's not just the students who suffer. Teachers, the backbone of our education system, spend countless hours after school creating quizzes, worksheets, and assessments from textbook pages. It's exhausting, time-consuming, and unsustainable. What if there was a better way?"
    },
    {
        "id": 3,
        "file": "scene03_title.mp3",
        "duration": 8,
        "text": "ScanLearn. Transform any textbook into interactive quizzes. Powered by Gemma 4."
    },
    {
        "id": 4,
        "file": "scene04_intro.mp3",
        "duration": 14,
        "text": "Introducing ScanLearn. A smart, AI powered tool that transforms any textbook page into an interactive, personalized quiz in seconds. With a clean, intuitive interface, ScanLearn is designed for both educators and students. No complex setup, no steep learning curve. Just upload and learn."
    },
    {
        "id": 5,
        "file": "scene05_upload.mp3",
        "duration": 14,
        "text": "Using ScanLearn is as simple as taking a photo. Open the app, point your camera at any textbook page, or upload an image from your device. ScanLearn accepts photos of physical books, screenshots of digital textbooks, even handwritten notes. One tap, and the magic begins."
    },
    {
        "id": 6,
        "file": "scene06_gemini.mp3",
        "duration": 16,
        "text": "This is where the real power of ScanLearn comes to life. Powered by Gemma 4, Google's cutting edge multimodal AI, ScanLearn doesn't just read the text. It understands the context, identifies key concepts, and generates a variety of question types. Multiple choice, fill in the blank, short answer, and more. The quizzes adapt to the student's learning level, ensuring the right challenge at the right time."
    },
    {
        "id": 7,
        "file": "scene07_quiz.mp3",
        "duration": 16,
        "text": "Students engage with dynamically generated questions that test comprehension, not just memorization. Each question is crafted to match the difficulty and subject matter of the uploaded content. Instant feedback helps students learn from mistakes in real time, turning every quiz into a meaningful learning experience."
    },
    {
        "id": 8,
        "file": "scene08_dashboard.mp3",
        "duration": 14,
        "text": "But ScanLearn doesn't stop at quizzes. A real-time results dashboard gives educators and students clear insights into performance. Track progress over time, identify strengths, and pinpoint areas that need more attention. Data-driven learning, made beautifully simple."
    },
    {
        "id": 9,
        "file": "scene09_impact.mp3",
        "duration": 14,
        "text": "The result? Students who were once disengaged are now excited to learn. They're scoring higher on tests, asking better questions in class, and developing a genuine love for learning. ScanLearn doesn't just quiz. It empowers."
    },
    {
        "id": 10,
        "file": "scene10_ripple.mp3",
        "duration": 12,
        "text": "And the impact doesn't stop at individual classrooms. When one teacher adopts ScanLearn, it ripples outward. Schools see improved test scores across the board. Communities gain access to quality education tools. And the gap between well-funded and under-resourced schools begins to close."
    },
    {
        "id": 11,
        "file": "scene11_tech.mp3",
        "duration": 12,
        "text": "ScanLearn is built with modern web technologies, designed to run on any device with a browser. And because it's powered by Gemma 4, it can even run locally on edge devices, bringing AI powered education to schools with limited or no internet access."
    },
    {
        "id": 12,
        "file": "scene12_credit.mp3",
        "duration": 18,
        "text": "ScanLearn was built with passion and purpose, using Gemma 4, by Nawang Dorjay. Because every student, no matter where they are, deserves access to the future of learning."
    },
    {
        "id": 13,
        "file": "scene13_closing.mp3",
        "duration": 10,
        "text": "The future of education starts here. The future of education starts now. ScanLearn. Learn Smarter, Not Harder."
    },
]

# Generate audio for each scene
for scene in scenes:
    out_path = os.path.join(AUDIO_DIR, scene["file"])
    
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        print(f"Scene {scene['id']}: Already exists, skipping")
        continue
    
    print(f"Scene {scene['id']}: Generating audio...", end=" ", flush=True)
    
    try:
        response = client.text_to_speech.convert(
            model="bulbul:v3",
            text=scene["text"],
            target_language_code="en-IN",
            speaker="shubh",
        )
        
        # Save audio - response should contain audio data
        if hasattr(response, 'audios') and response.audios:
            audio_data = response.audios[0]
            if isinstance(audio_data, bytes):
                with open(out_path, 'wb') as f:
                    f.write(audio_data)
                size_kb = os.path.getsize(out_path) // 1024
                print(f"OK ({size_kb}KB)")
            elif isinstance(audio_data, str):
                # It might be base64 encoded
                import base64
                audio_bytes = base64.b64decode(audio_data)
                with open(out_path, 'wb') as f:
                    f.write(audio_bytes)
                size_kb = os.path.getsize(out_path) // 1024
                print(f"OK ({size_kb}KB, base64)")
            else:
                print(f"Response type: {type(audio_data)}, value: {str(audio_data)[:200]}")
        else:
            # Print full response to understand format
            print(f"Response format: {type(response)}")
            print(f"  Dir: {[x for x in dir(response) if not x.startswith('_')]}")
            print(f"  Str: {str(response)[:500]}")
            
            # Try to save raw response
            resp_str = str(response)
            if resp_str:
                with open(out_path + ".txt", 'w') as f:
                    f.write(resp_str)
                print(f"  Saved response debug to {out_path}.txt")
        
        time.sleep(0.5)  # Rate limit safety
        
    except Exception as e:
        print(f"ERROR: {e}")
        # Save error
        with open(os.path.join(AUDIO_DIR, f"scene{scene['id']:02d}_error.txt"), 'w') as f:
            f.write(str(e))

print("\nDone! Check audio files in:", AUDIO_DIR)
