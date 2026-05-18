#!/bin/bash
set -e

AUDIO="/home/z/my-project/download/scanlearn/video/audio"
BUILD="/home/z/my-project/download/scanlearn/video/build"
VIDEO="/home/z/my-project/download/scanlearn/video/ScanLearn_Demo.mp4"
OUT="/home/z/my-project/download/scanlearn/video/ScanLearn_Demo_Final.mp4"

# Scene durations (must match video)
DURS=(18 14 8 14 14 16 16 14 14 12 12 18 10)

# Step 1: Pad or trim each audio to match scene duration
echo "=== Adjusting audio to scene durations ==="
for i in $(seq 0 12); do
    idx=$(printf "%02d" $((i+1)))
    scene_dur=${DURS[$i]}
    in_file="$AUDIO/scene${idx}.mp3"
    out_file="$BUILD/audio_padded_${idx}.mp3"
    
    # Get actual duration
    actual=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$in_file")
    
    # If audio longer than scene, trim. If shorter, pad with silence
    if python3 -c "exit(0 if float('$actual') > float('$scene_dur') else 1)"; then
        # Trim
        ffmpeg -y -i "$in_file" -t "$scene_dur" -c:a libmp3lame -q:a 2 "$out_file" 2>/dev/null
        echo "  Scene $((i+1)): ${actual}s -> TRIMMED to ${scene_dur}s"
    else
        # Pad with silence at end
        ffmpeg -y -i "$in_file" -filter_complex "apad=whole_dur=${scene_dur}" -t "$scene_dur" -c:a libmp3lame -q:a 2 "$out_file" 2>/dev/null
        echo "  Scene $((i+1)): ${actual}s -> PADDED to ${scene_dur}s"
    fi
done

# Step 2: Create concat file
echo "=== Concatenating audio ==="
> "$BUILD/audio_concat.txt"
for i in $(seq 0 12); do
    idx=$(printf "%02d" $((i+1)))
    echo "file '$BUILD/audio_padded_${idx}.mp3'" >> "$BUILD/audio_concat.txt"
done

ffmpeg -y -f concat -safe 0 -i "$BUILD/audio_concat.txt" -c:a libmp3lame -q:a 2 "$BUILD/full_narration.mp3" 2>/dev/null
echo "  Full narration: $(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$BUILD/full_narration.mp3")s"

# Step 3: Merge video + audio
echo "=== Merging video + audio ==="
ffmpeg -y -i "$VIDEO" -i "$BUILD/full_narration.mp3" \
    -c:v copy -c:a aac -b:a 128k \
    -shortest \
    "$OUT" 2>/dev/null

echo "=== FINAL VIDEO WITH AUDIO ==="
ffprobe -v quiet -show_entries format=duration,size -show_entries stream=width,height,codec_name -of json "$OUT"

echo ""
echo "Output: $OUT"
echo "Done!"
