#!/usr/bin/env python3
"""Ultra-fast video builder: generate frames in Python, encode once with ffmpeg"""
import subprocess, os, json, struct

BUILD = "/home/z/my-project/download/scanlearn/video/build"
UPLOAD = "/home/z/my-project/upload"
ASSETS = "/home/z/my-project/download/scanlearn/video"
OUT = "/home/z/my-project/download/scanlearn/video"
W, H, FPS = 854, 480, 12  # Lower FPS = fewer frames = faster

os.makedirs(BUILD, exist_ok=True)

from PIL import Image, ImageDraw, ImageFont

# Load fonts
try:
    ft = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Bold.ttf", 52)
    fs = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 24)
    fc = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 30)
    fcs = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 22)
    fcn = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Bold.ttf", 36)
    fsub = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 20)
except:
    ft = fs = fc = fcs = fcn = fsub = ImageFont.load_default()

def scale_and_pad(img_path, w=W, h=H, bg='#0f172a'):
    """Scale image to fit within w x h and pad with background color"""
    img = Image.open(img_path).convert('RGB')
    iw, ih = img.size
    ratio = min(w / iw, h / ih)
    new_w, new_h = int(iw * ratio), int(ih * ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new('RGB', (w, h), bg)
    canvas.paste(img, ((w - new_w) // 2, (h - new_h) // 2))
    return canvas

def draw_gradient_bars(draw, w=W, h=H):
    colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899']
    for i in range(6):
        draw.rectangle([(0, i*3), (w, (i+1)*3)], fill=colors[i])
        draw.rectangle([(0, h-18+i*3), (w, h-15+(i+1)*3)], fill=colors[5-i])

def add_subtitle(draw, text, font=fsub, w=W, h=H):
    """Draw clean subtitle text at bottom - white with shadow, NO background box"""
    if not text:
        return
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (w - tw) // 2
    y = h - 55
    # Shadow
    draw.text((x+2, y+2), text, font=font, fill='black')
    # Main text
    draw.text((x, y), text, font=font, fill='white')

def make_title_card():
    img = Image.new('RGB', (W, H), '#0f172a')
    draw = ImageDraw.Draw(img)
    draw_gradient_bars(draw)
    for txt, font, color, y in [
        ("ScanLearn", ft, '#60a5fa', 140),
        ("Transform Any Textbook Into", fs, '#e2e8f0', 210),
        ("Interactive Quizzes", fs, '#e2e8f0', 245),
        ("Powered by Gemma 4", fs, '#fbbf24', 310),
    ]:
        bbox = draw.textbbox((0,0), txt, font=font)
        draw.text(((W-(bbox[2]-bbox[0]))//2, y), txt, font=font, fill=color)
    return img

def make_credit_card():
    img = Image.new('RGB', (W, H), '#0f172a')
    draw = ImageDraw.Draw(img)
    draw_gradient_bars(draw)
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
    return img

# Define scenes: (image_source, duration_seconds, subtitle_text, is_card)
scenes = [
    ("scene1_classroom.png", 18, "Millions of students around the world lack access to personalized learning tools.", False),
    ("scene2_teacher.png", 14, "Teachers spend countless hours creating quizzes from textbooks.", False),
    ("TITLE_CARD", 8, "", True),
    ("Screenshot 2026-05-18 173225.png", 14, "A clean, intuitive interface designed for educators and students.", False),
    ("Screenshot 2026-05-18 173400.png", 14, "Simply upload or capture any textbook page with one click.", False),
    ("Screenshot 2026-05-18 173543.png", 16, "Powered by Gemma 4, ScanLearn analyzes content and generates adaptive quizzes in seconds.", False),
    ("Screenshot 2026-05-18 173817.png", 16, "Students engage with multiple question types tailored to their learning level.", False),
    ("Screenshot 2026-05-18 173726.png", 14, "Real-time progress tracking helps identify strengths and areas for improvement.", False),
    ("scene7_student_happy.png", 14, "The result: better engagement, deeper understanding, and improved learning outcomes.", False),
    ("scene9_ripple.png", 12, "From classrooms to communities, the impact ripples outward.", False),
    ("Screenshot 2026-05-18 173658.png", 12, "Built with Next.js, powered by Gemma 4 multimodal AI.", False),
    ("CREDIT_CARD", 18, "", True),
    ("scene11_boy_smile.png", 10, "The future of education starts here.", False),
]

# Pre-load all scene base images
print("Loading scene images...")
scene_images = []
for name, dur, text, is_card in scenes:
    if is_card:
        if name == "TITLE_CARD":
            scene_images.append(make_title_card())
        else:
            scene_images.append(make_credit_card())
    elif name.startswith("scene"):
        img = scale_and_pad(os.path.join(ASSETS, name))
        scene_images.append(img)
    else:
        img = scale_and_pad(os.path.join(UPLOAD, name))
        scene_images.append(img)
    print(f"  Loaded: {name}")

# Calculate fade frame ranges
total_frames = sum(dur * FPS for _, dur, _, _ in scenes)
fade_in_frames = int(1.5 * FPS)  # 18 frames
fade_out_frames = int(1.5 * FPS)
fade_out_start = total_frames - fade_out_frames

print(f"\nTotal frames: {total_frames}, FPS: {FPS}")

# Generate all frames as raw RGB data and pipe to ffmpeg
print("Generating video (piping frames to ffmpeg)...")

cmd = [
    'ffmpeg', '-y',
    '-f', 'rawvideo', '-vcodec', 'rawvideo',
    '-s', f'{W}x{H}', '-pix_fmt', 'rgb24',
    '-r', str(FPS),
    '-i', '-',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-an',
    os.path.join(OUT, 'ScanLearn_Demo.mp4')
]

proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

frame_idx = 0
scene_idx = 0
frame_offset = 0

for si, (name, dur, text, is_card) in enumerate(scenes):
    n_frames = dur * FPS
    base_img = scene_images[si]
    
    for f in range(n_frames):
        # Create frame copy
        frame = base_img.copy()
        draw = ImageDraw.Draw(frame)
        
        # Add subtitle text
        if text and not is_card:
            add_subtitle(draw, text)
        
        # Fade in/out
        alpha = 1.0
        if frame_idx < fade_in_frames:
            alpha = frame_idx / fade_in_frames
        elif frame_idx >= fade_out_start:
            alpha = (total_frames - frame_idx) / fade_out_frames
        
        if alpha < 1.0:
            black = Image.new('RGB', (W, H), (0, 0, 0))
            frame = Image.blend(black, frame, alpha)
        
        # Write raw bytes
        proc.stdin.write(frame.tobytes())
        
        frame_idx += 1
        
        if frame_idx % (FPS * 5) == 0:  # Progress every 5 seconds
            pct = frame_idx * 100 / total_frames
            print(f"  Progress: {pct:.0f}% ({frame_idx}/{total_frames} frames)")

proc.stdin.close()
stderr = proc.stderr.read().decode()
proc.wait()

if proc.returncode != 0:
    print(f"FFmpeg error: {stderr[-500:]}")
else:
    # Verify
    r = subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries',
                        'format=duration,size', '-show_entries', 'stream=width,height',
                        '-of', 'json', os.path.join(OUT, 'ScanLearn_Demo.mp4')],
                       capture_output=True)
    info = json.loads(r.stdout.decode())
    print(f"\n=== FINAL VIDEO ===")
    for s in info.get('streams', []):
        print(f"  Resolution: {s.get('width')}x{s.get('height')}")
    fmt = info.get('format', {})
    dur_s = float(fmt.get('duration', 0))
    print(f"  Duration: {dur_s:.1f}s")
    print(f"  Size: {int(fmt.get('size', 0))//1024}KB")
    print(f"  Path: {os.path.join(OUT, 'ScanLearn_Demo.mp4')}")
    print("DONE!")
