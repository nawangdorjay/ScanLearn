#!/usr/bin/env python3
"""Generate audio narration for all 13 ScanLearn video scenes via SarvamAI TTS"""
import os, base64, time
from sarvamai import SarvamAI

client = SarvamAI(
    api_subscription_key="sk_3tnn3of1_EYNw1Sw28QHDUAOxLAcd6KZ3",
)

AUDIO_DIR = "/home/z/my-project/download/scanlearn/video/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

scenes = [
    {
        "id": 1, "file": "scene01.mp3", "dur": 18,
        "text": "Every day, millions of students around the world sit in classrooms, struggling to learn from textbooks that were never designed for them. In rural schools, in underfunded communities, and even in well-equipped classrooms, one-size-fits-all education leaves countless students behind. They read the same pages, memorize the same facts, and take the same tests, but true understanding remains out of reach."
    },
    {
        "id": 2, "file": "scene02.mp3", "dur": 14,
        "text": "And it's not just the students who suffer. Teachers, the backbone of our education system, spend countless hours after school creating quizzes, worksheets, and assessments from textbook pages. It's exhausting, time-consuming, and unsustainable. What if there was a better way?"
    },
    {
        "id": 3, "file": "scene03.mp3", "dur": 8,
        "text": "ScanLearn. Transform any textbook into interactive quizzes. Powered by Gemma 4."
    },
    {
        "id": 4, "file": "scene04.mp3", "dur": 14,
        "text": "Introducing ScanLearn. A smart, AI powered tool that transforms any textbook page into an interactive, personalized quiz in seconds. With a clean, intuitive interface, ScanLearn is designed for both educators and students. No complex setup, no steep learning curve. Just upload and learn."
    },
    {
        "id": 5, "file": "scene05.mp3", "dur": 14,
        "text": "Using ScanLearn is as simple as taking a photo. Open the app, point your camera at any textbook page, or upload an image from your device. ScanLearn accepts photos of physical books, screenshots of digital textbooks, even handwritten notes. One tap, and the magic begins."
    },
    {
        "id": 6, "file": "scene06.mp3", "dur": 16,
        "text": "This is where the real power of ScanLearn comes to life. Powered by Gemma 4, Google's cutting edge multimodal AI, ScanLearn doesn't just read the text. It understands the context, identifies key concepts, and generates a variety of question types. Multiple choice, fill in the blank, short answer, and more. The quizzes adapt to the student's learning level, ensuring the right challenge at the right time."
    },
    {
        "id": 7, "file": "scene07.mp3", "dur": 16,
        "text": "Students engage with dynamically generated questions that test comprehension, not just memorization. Each question is crafted to match the difficulty and subject matter of the uploaded content. Instant feedback helps students learn from mistakes in real time, turning every quiz into a meaningful learning experience."
    },
    {
        "id": 8, "file": "scene08.mp3", "dur": 14,
        "text": "But ScanLearn doesn't stop at quizzes. A real-time results dashboard gives educators and students clear insights into performance. Track progress over time, identify strengths, and pinpoint areas that need more attention. Data-driven learning, made beautifully simple."
    },
    {
        "id": 9, "file": "scene09.mp3", "dur": 14,
        "text": "The result? Students who were once disengaged are now excited to learn. They're scoring higher on tests, asking better questions in class, and developing a genuine love for learning. ScanLearn doesn't just quiz. It empowers."
    },
    {
        "id": 10, "file": "scene10.mp3", "dur": 12,
        "text": "And the impact doesn't stop at individual classrooms. When one teacher adopts ScanLearn, it ripples outward. Schools see improved test scores across the board. Communities gain access to quality education tools. And the gap between well-funded and under-resourced schools begins to close."
    },
    {
        "id": 11, "file": "scene11.mp3", "dur": 12,
        "text": "ScanLearn is built with modern web technologies, designed to run on any device with a browser. And because it's powered by Gemma 4, it can even run locally on edge devices, bringing AI powered education to schools with limited or no internet access."
    },
    {
        "id": 12, "file": "scene12.mp3", "dur": 18,
        "text": "ScanLearn was built with passion and purpose, using Gemma 4, by Nawang Dorjay. Because every student, no matter where they are, deserves access to the future of learning."
    },
    {
        "id": 13, "file": "scene13.mp3", "dur": 10,
        "text": "The future of education starts here. The future of education starts now. ScanLearn. Learn Smarter, Not Harder."
    },
]

success = 0
errors = 0

for scene in scenes:
    out_path = os.path.join(AUDIO_DIR, scene["file"])
    
    # Remove test file if it exists for scene 1
    test_path = os.path.join(AUDIO_DIR, f"test_scene0{scene['id']}.mp3")
    if os.path.exists(test_path):
        os.rename(test_path, out_path)
        print(f"Scene {scene['id']:2d}: Renamed test file -> {scene['file']}")
        success += 1
        continue
    
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        print(f"Scene {scene['id']:2d}: Already exists ({os.path.getsize(out_path)//1024}KB)")
        success += 1
        continue
    
    print(f"Scene {scene['id']:2d}: Generating...", end=" ", flush=True)
    
    try:
        response = client.text_to_speech.convert(
            model="bulbul:v3",
            text=scene["text"],
            target_language_code="en-IN",
            speaker="shubh",
        )
        
        audio_b64 = response.audios[0]
        audio_bytes = base64.b64decode(audio_b64)
        
        with open(out_path, 'wb') as f:
            f.write(audio_bytes)
        
        print(f"OK ({len(audio_bytes)//1024}KB)")
        success += 1
        time.sleep(0.5)
        
    except Exception as e:
        print(f"ERROR: {e}")
        errors += 1

print(f"\n{'='*40}")
print(f"Generated: {success}/13 | Errors: {errors}/13")
print(f"Audio files in: {AUDIO_DIR}")
