// Overlays a voiceover audio track onto deck/video/pramaan-demo-silent.mp4.
//   node scripts/mux.mjs <audioFile> [outFile]
// Length-safe: if the audio is shorter it's padded with trailing silence to the video
// length; if it's longer, the last video frame is frozen out to the audio length — so
// nothing (video action or spoken words) ever gets cut off.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const VIDEO = join(ROOT, "deck", "video", "pramaan-demo-silent.mp4");
const audio = process.argv[2];
const out = process.argv[3] ?? join(ROOT, "deck", "video", "pramaan-demo-final.mp4");

if (!audio || !existsSync(audio)) {
  console.error("Usage: node scripts/mux.mjs <audioFile> [outFile]");
  process.exit(1);
}
if (!existsSync(VIDEO)) {
  console.error("Missing silent video:", VIDEO, "— run scripts/record.mjs first.");
  process.exit(1);
}

const dur = (f) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])
      .toString()
      .trim(),
  );

const vd = dur(VIDEO);
const ad = dur(audio);
console.log(`video=${vd.toFixed(2)}s  audio=${ad.toFixed(2)}s`);

let args;
if (ad <= vd + 0.05) {
  // audio fits: pad it with silence to the video length (final = video length)
  args = [
    "-y", "-i", VIDEO, "-i", audio,
    "-filter_complex", "[1:a]apad[a]",
    "-map", "0:v:0", "-map", "[a]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-t", vd.toFixed(3), "-movflags", "+faststart", out,
  ];
} else {
  // audio overruns: freeze the last frame to cover the overflow (final = audio length)
  const pad = (ad - vd).toFixed(3);
  args = [
    "-y", "-i", VIDEO, "-i", audio,
    "-filter_complex", `[0:v]tpad=stop_mode=clone:stop_duration=${pad}[v]`,
    "-map", "[v]", "-map", "1:a:0",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-t", ad.toFixed(3), "-movflags", "+faststart", out,
  ];
}

execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("FINAL:", out);
