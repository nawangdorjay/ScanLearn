#!/usr/bin/env python3
"""Fast video builder for ScanLearn Demo - no zoompan, simple scale+pad"""
import subprocess, os, json

BUILD = "/home/z/my-project/download/scanlearn/video/build"
UPLOAD = "/home/z/my-project/upload"
ASSETS = "/home/z/my-project/download/scanlearn/video"
OUT = "/home/z/my-project/download/scanlearn/video"
W, H, FPS = 854, 480, 24

os.makedirs(BUILD, exist_ok=True)

# Generate title and credit cards
print("Generating cards...")
from PIL import Image, ImageDraw, ImageFont

def make_card(filename, draw_func):
    img = Image.new('RGB', (W, H), '#0f172a')
    draw = ImageDraw.Draw(img)
    colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899']
    for i in range(6):
        draw.rectangle([(0, i*3), (W, (i+1)*3)], fill=colors[i])
        draw.rectangle([(0, H-18+i*3), (W, H-15+(i+1)*3)], fill=colors[5-i])
    draw_func(img, draw)
    path = os.path.join(BUILD, filename)
    img.save(path)
    print(f"  {filename}")
    return path

try:
    ft = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Bold.ttf", 52)
    fs = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 24)
    fc = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 30)
    fcs = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 22)
    fcn = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Bold.ttf", 36)
except:
    ft = fs = fc = fcs = fcn = ImageFont.load_default()

def draw_title(img, draw):
    for txt, font, color, y in [
        ("ScanLearn", ft, '#60a5fa', 140),
        ("Transform Any Textbook Into", fs, '#e2e8f0', 210),
        ("Interactive Quizzes", fs, '#e2e8f0', 245),
        ("Powered by Gemma 4", fs, '#fbbf24', 310),
    ]:
        bbox = draw.textbbox((0,0), txt, font=font)
        draw.text(((W-(bbox[2]-bbox[0]))//2, y), txt, font=font, fill=color)

title_path = make_card("title_card.png", draw_title)

def draw_credit(img, draw):
    for txt, font, color, y in [
        ("Made with", fc, '#e2e8f0', 55),
        ("using Gemma 4", fc, '#60a5fa', 130),
        ("by", fcs, '#94a3b8', 185),
        ("Nawang Dorjay", fcn, '#fbbf24', 220),
    ]:
        bbox = draw.textbbox((0,0), txt, font=font)
        draw.text(((W-(bbox[2]-bbox[0]))//2, y), txt, font=font, fill=color)
    
    dev_photo = os.path.join(UPLOAD, "pasted_image_1779106790759.png")
    if os.path.exists(dev_photo):
        photo = Image.open(dev_photo).convert("RGBA")
        s = min(photo.size)
        photo = photo.crop((0, 0, s, s)).resize((140, 140), Image.LANCZOS)
        mask = Image.new('L', (140, 140), 0)
        ImageDraw.Draw(mask).ellipse([(0,0),(139,139)], fill=255)
        px, py = (W-140)//2, 280
        img.paste(photo, (px, py), mask)
        draw.ellipse([(px-2,py-2),(px+141,py+141)], outline='#60a5fa', width=2)

credit_path = make_card("credit_card.png", draw_credit)

# Define scenes: (image_path, duration, subtitle_text, is_card)
scenes = [
    (f"{ASSETS}/scene1_classroom.png", 18, "Millions of students around the world lack access to personalized learning tools.", False),
    (f"{ASSETS}/scene2_teacher.png", 14, "Teachers spend countless hours creating quizzes from textbooks.", False),
    (title_path, 8, "", True),
    (f"{UPLOAD}/Screenshot 2026-05-18 173225.png", 14, "A clean, intuitive interface designed for educators and students.", False),
    (f"{UPLOAD}/Screenshot 2026-05-18 173400.png", 14, "Simply upload or capture any textbook page with one click.", False),
    (f"{UPLOAD}/Screenshot 2026-05-18 173543.png", 16, "Powered by Gemma 4, ScanLearn analyzes content and generates adaptive quizzes in seconds.", False),
    (f"{UPLOAD}/Screenshot 2026-05-18 173817.png", 16, "Students engage with multiple question types tailored to their learning level.", False),
    (f"{UPLOAD}/Screenshot 2026-05-18 173726.png", 14, "Real-time progress tracking helps identify strengths and areas for improvement.", False),
    (f"{ASSETS}/scene7_student_happy.png", 14, "The result: better engagement, deeper understanding, and improved learning outcomes.", False),
    (f"{ASSETS}/scene9_ripple.png", 12, "From classrooms to communities, the impact ripples outward.", False),
    (f"{UPLOAD}/Screenshot 2026-05-18 173658.png", 12, "Built with Next.js, powered by Gemma 4 multimodal AI.", False),
    (credit_path, 18, "", True),
    (f"{ASSETS}/scene11_boy_smile.png", 10, "The future of education starts here.", False),
]

# Step 1: Create all image clips WITHOUT subtitles (fast)
print("\nCreating image clips (no subtitles yet)...")
clip_paths = []
for i, (img_path, dur, text, is_card) in enumerate(scenes):
    clip = f"{BUILD}/c{i:02d}.mp4"
    clip_paths.append(clip)
    
    # Simple: just scale to fill 854x480, no filters
    vf = f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=black"
    
    cmd = ["ffmpeg", "-y", "-loop", "1", "-i", img_path, "-t", str(dur),
           "-r", str(FPS), "-vf", vf,
           "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an", clip]
    r = subprocess.run(cmd, capture_output=True, timeout=60)
    if r.returncode != 0:
        print(f"  ERROR clip {i}: {r.stderr.decode()[-200:]}")
    else:
        print(f"  c{i:02d}.mp4 [{dur}s]")

# Step 2: Concat all clips
print("\nConcatenating...")
concat_file = f"{BUILD}/concat.txt"
with open(concat_file, 'w') as f:
    for p in clip_paths:
        f.write(f"file '{p}'\n")

raw = f"{BUILD}/raw.mp4"
cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file, "-c", "copy", raw]
subprocess.run(cmd, capture_output=True, timeout=30)

# Get total duration
r = subprocess.run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", raw], capture_output=True)
total_dur = float(r.stdout.decode().strip())
print(f"  Raw duration: {total_dur:.1f}s")

# Step 3: Build the drawtext filter for subtitles at correct timestamps
# We need to enable drawtext only during specific time ranges
print("\nAdding subtitles...")
filter_parts = []
filter_parts.append(f"fade=t=in:st=0:d=1.5")
filter_parts.append(f"fade=t=out:st={total_dur-1.5:.1f}:d=1.5")

current_time = 0
for i, (img_path, dur, text, is_card) in enumerate(scenes):
    if text and not is_card:
        # Escape special characters for ffmpeg drawtext
        safe_text = text.replace("'", "'\\''").replace(":", "\\:")
        enable = f"between(t,{current_time},{current_time+dur})"
        filter_parts.append(
            f"drawtext=text='{safe_text}':fontsize=22:fontcolor=white:borderw=2:bordercolor=black:"
            f"x=(w-text_w)/2:y=h-55:shadowcolor=black@0.5:shadowx=2:shadowy=2:enable='{enable}'"
        )
    current_time += dur

vf_str = ",".join(filter_parts)
final = f"{OUT}/ScanLearn_Demo.mp4"
cmd = ["ffmpeg", "-y", "-i", raw, "-vf", vf_str,
       "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-an", final]
subprocess.run(cmd, capture_output=True, timeout=120)

# Verify
r = subprocess.run(["ffprobe", "-v", "quiet", "-show_entries",
                    "format=duration,size", "-show_entries", "stream=width,height",
                    "-of", "json", final], capture_output=True)
info = json.loads(r.stdout.decode())
print(f"\n=== FINAL VIDEO ===")
print(f"  File: {final}")
for s in info.get('streams', []):
    print(f"  Resolution: {s.get('width')}x{s.get('height')}")
fmt = info.get('format', {})
print(f"  Duration: {float(fmt.get('duration', 0)):.1f}s")
print(f"  Size: {int(fmt.get('size', 0))//1024}KB")
print("DONE!")
