import "regenerator-runtime";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs-core";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`
);
tf.setBackend("wasm");

async function renderPrediction(
  model: blazeface.BlazeFaceModel,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const flipHorizontal = true;
  const annotateBoxes = true;
  const predictions = await model.estimateFaces(
    video,
    false,
    flipHorizontal,
    annotateBoxes
  );

  if (predictions.length > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < predictions.length; i++) {
      const start = predictions[i].topLeft as [number, number];
      const end = predictions[i].bottomRight as [number, number];
      const size = [end[0] - start[0], end[1] - start[1]];
      ctx.fillRect(start[0], start[1], size[0], size[1]);
    }
  }

  requestAnimationFrame(() => renderPrediction(model, video, canvas, ctx));
}

async function main() {
  let stream: MediaStream | null = null;
  const video = document.getElementById("video") as HTMLVideoElement;
  const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
  const stopBtn = document.getElementById("stop-btn") as HTMLButtonElement;
  const startVideo = async () => {
    if (stream) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user" },
      })
      .then(async (s) => {
        stream = s;
        video.srcObject = stream;
        await video.play();
      });
  };
  startBtn.onclick = startVideo;
  stopBtn.onclick = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  };
  await startVideo();

  const canvas = document.getElementById("output") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  const videoWidth = 640;
  const videoHeight = 480;

  video.width = videoWidth;
  video.height = videoHeight;
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  renderPrediction(await blazeface.load(), video, canvas, ctx);
}

main().catch(console.error);
