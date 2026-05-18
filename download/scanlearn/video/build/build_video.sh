#!/bin/bash
set -e

BUILD="/home/z/my-project/download/scanlearn/video/build"
UPLOAD="/home/z/my-project/upload"
ASSETS="/home/z/my-project/download/scanlearn/video"
OUT="/home/z/my-project/download/scanlearn/video"

W=854
H=480
FPS=24

# First, generate title and credit cards
python3 << 'PYEOF'
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 854, 480
build = "/home/z/my-project/download/scanlearn/video/build"

try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Bold.ttf", 52)
    font_sub = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 24)
    font_credit = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 30)
    font_credit_sub = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos.ttf", 22)
    font_credit_name = ImageFont.truetype("/usr/share/fonts/truetype/english/Tinos-Bold.ttf", 36)
except:
    font_title = ImageFont.load_default()
    font_sub = font_credit = font_credit_sub = font_credit_name = ImageFont.load_default()

# ---- TITLE CARD ----
img = Image.new('RGB', (W, H), '#0f172a')
draw = ImageDraw.Draw(img)
colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899']
for i in range(6):
    draw.rectangle([(0, i*3), (W, (i+1)*3)], fill=colors[i])

title = "ScanLearn"
bbox = draw.textbbox((0,0), title, font=font_title)
draw.text(((W-(bbox[2]-bbox[0]))//2, 140), title, font=font_title, fill='#60a5fa')

for i, txt in enumerate(["Transform Any Textbook Into", "Interactive Quizzes"]):
    bbox = draw.textbbox((0,0), txt, font=font_sub)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 210+i*35), txt, font=font_sub, fill='#e2e8f0')

badge = "Powered by Gemma 4"
bbox = draw.textbbox((0,0), badge, font=font_sub)
draw.text(((W-(bbox[2]-bbox[0]))//2, 310), badge, font=font_sub, fill='#fbbf24')

for i in range(6):
    draw.rectangle([(0, H-18+i*3), (W, H-15+(i+1)*3)], fill=colors[5-i])
img.save(os.path.join(build, "title_card.png"))
print("OK: title_card.png")

# ---- DEVELOPER CREDIT CARD ----
img2 = Image.new('RGB', (W, H), '#0f172a')
draw2 = ImageDraw.Draw(img2)
for i in range(6):
    draw2.rectangle([(0, i*3), (W, (i+1)*3)], fill=colors[i])

for txt, font, color, y in [
    ("Made with", font_credit, '#e2e8f0', 55),
    ("using Gemma 4", font_credit, '#60a5fa', 130),
    ("by", font_credit_sub, '#94a3b8', 185),
    ("Nawang Dorjay", font_credit_name, '#fbbf24', 220),
]:
    bbox = draw2.textbbox((0,0), txt, font=font)
    draw2.text(((W-(bbox[2]-bbox[0]))//2, y), txt, font=font, fill=color)

# Developer photo
dev_photo = "/home/z/my-project/upload/pasted_image_1779106790759.png"
if os.path.exists(dev_photo):
    photo = Image.open(dev_photo).convert("RGBA")
    size = min(photo.size)
    photo = photo.crop((0, 0, size, size)).resize((140, 140), Image.LANCZOS)
    mask = Image.new('L', (140, 140), 0)
    ImageDraw.Draw(mask).ellipse([(0,0),(139,139)], fill=255)
    px, py = (W-140)//2, 280
    img2.paste(photo, (px, py), mask)
    draw2.ellipse([(px-2,py-2),(px+141,py+141)], outline='#60a5fa', width=2)

for i in range(6):
    draw2.rectangle([(0, H-18+i*3), (W, H-15+(i+1)*3)], fill=colors[5-i])
img2.save(os.path.join(build, "credit_card.png"))
print("OK: credit_card.png")
PYEOF

echo "=== Building video clips (fast mode) ==="

# Fast clip: scale+pad to 854x480 + drawtext subtitle
make_clip() {
    local out="$1" img="$2" dur="$3" text="$4"
    ffmpeg -y -loop 1 -i "$img" -t "$dur" -r $FPS \
        -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=#0f172a,drawtext=text='${text}':fontsize=22:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-55:shadowcolor=black@0.5:shadowx=2:shadowy=2" \
        -c:v libx264 -preset ultrafast -pix_fmt yuv420p "$out" 2>/dev/null
    echo "  $(basename $out) ${dur}s"
}

make_card_clip() {
    local out="$1" img="$2" dur="$3"
    ffmpeg -y -loop 1 -i "$img" -t "$dur" -r $FPS \
        -vf "scale=${W}:${H}" \
        -c:v libx264 -preset ultrafast -pix_fmt yuv420p "$out" 2>/dev/null
    echo "  $(basename $out) ${dur}s"
}

# Scene 1: Problem - Classroom (18s)
make_clip "${BUILD}/clip01.mp4" "${ASSETS}/scene1_classroom.png" 18 \
    "Millions of students around the world lack access to personalized learning tools."

# Scene 2: Teacher burden (14s)
make_clip "${BUILD}/clip02.mp4" "${ASSETS}/scene2_teacher.png" 14 \
    "Teachers spend countless hours creating quizzes from textbooks."

# Scene 3: Title card (8s)
make_card_clip "${BUILD}/clip03.mp4" "${BUILD}/title_card.png" 8

# Scene 4: Landing page (14s)
make_clip "${BUILD}/clip04.mp4" "${UPLOAD}/Screenshot 2026-05-18 173225.png" 14 \
    "A clean, intuitive interface designed for educators and students."

# Scene 5: Upload page (14s)
make_clip "${BUILD}/clip05.mp4" "${UPLOAD}/Screenshot 2026-05-18 173400.png" 14 \
    "Simply upload or capture any textbook page with one click."

# Scene 6: Quiz generation (16s)
make_clip "${BUILD}/clip06.mp4" "${UPLOAD}/Screenshot 2026-05-18 173543.png" 16 \
    "Powered by Gemma 4, ScanLearn analyzes content and generates adaptive quizzes in seconds."

# Scene 7: Quiz interaction (16s)
make_clip "${BUILD}/clip07.mp4" "${UPLOAD}/Screenshot 2026-05-18 173817.png" 16 \
    "Students engage with multiple question types tailored to their learning level."

# Scene 8: Results dashboard (14s)
make_clip "${BUILD}/clip08.mp4" "${UPLOAD}/Screenshot 2026-05-18 173726.png" 14 \
    "Real-time progress tracking helps identify strengths and areas for improvement."

# Scene 9: Student success (14s)
make_clip "${BUILD}/clip09.mp4" "${ASSETS}/scene7_student_happy.png" 14 \
    "The result: better engagement, deeper understanding, and improved learning outcomes."

# Scene 10: Ripple effect (12s)
make_clip "${BUILD}/clip10.mp4" "${ASSETS}/scene9_ripple.png" 12 \
    "From classrooms to communities, the impact ripples outward."

# Scene 11: How it works (12s)
make_clip "${BUILD}/clip11.mp4" "${UPLOAD}/Screenshot 2026-05-18 173658.png" 12 \
    "Built with Next.js, powered by Gemma 4 multimodal AI."

# Scene 12: Developer credit (18s)
make_card_clip "${BUILD}/clip12.mp4" "${BUILD}/credit_card.png" 18

# Scene 13: Closing (10s)
make_clip "${BUILD}/clip13.mp4" "${ASSETS}/scene11_boy_smile.png" 10 \
    "The future of education starts here."

echo "=== Concatenating ==="

# Create concat list
> "${BUILD}/concat.txt"
for i in $(seq -w 1 13); do echo "file '${BUILD}/clip${i}.mp4'" >> "${BUILD}/concat.txt"; done

ffmpeg -y -f concat -safe 0 -i "${BUILD}/concat.txt" -c copy "${BUILD}/raw.mp4" 2>/dev/null

# Get duration and add fades
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${BUILD}/raw.mp4")
FADE_OUT=$(python3 -c "print(f'{float(\"$DUR\")-1.5:.1f}')")

ffmpeg -y -i "${BUILD}/raw.mp4" \
    -vf "fade=t=in:st=0:d=1.5,fade=t=out:st=${FADE_OUT}:d=1.5" \
    -c:v libx264 -preset fast -crf 23 \
    "${OUT}/ScanLearn_Demo.mp4" 2>/dev/null

echo "=== FINAL VIDEO ==="
ffprobe -v quiet -show_entries format=duration,size -show_entries stream=width,height -of json "${OUT}/ScanLearn_Demo.mp4"
echo "DONE!"
