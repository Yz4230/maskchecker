import "regenerator-runtime";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`
);
tf.setBackend("wasm");

const video = document.getElementById("video") as HTMLVideoElement;
const canvas = document.getElementById("output") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const faceCanvas = document.getElementById("face") as HTMLCanvasElement;
const faceCtx = faceCanvas.getContext("2d") as CanvasRenderingContext2D;

const videoWidth = 640;
const videoHeight = 480;

video.width = videoWidth;
video.height = videoHeight;
canvas.width = videoWidth;
canvas.height = videoHeight;

faceCanvas.width = 64;
faceCanvas.height = 64;

async function renderPrediction(
  bfModel: blazeface.BlazeFaceModel,
  maskModel: tf.LayersModel
) {
  const flipHorizontal = true;
  const annotateBoxes = true;
  const predictions = await bfModel.estimateFaces(
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
      if (i == 0) {
        faceCtx.drawImage(
          video,
          canvas.width - (start[0] + size[0]),
          start[1],
          size[0],
          size[1],
          0,
          0,
          64,
          64
        );
      }
      const faceImageTensor = tf.browser.fromPixels(faceCanvas);
      const maskPrediction = maskModel.predict(tf.expandDims(faceImageTensor));
      if (!Array.isArray(maskPrediction)) {
        const output = tf.sigmoid(await maskPrediction.array());
        const arr = output.arraySync();

        if (Array.isArray(arr) && arr.length > 0 && arr[0] < 0.95) {
          ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
        } else {
          ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        }
      }

      ctx.fillRect(start[0] - 25, start[1] - 25, size[0] + 50, size[1] + 50);
    }
  }

  requestAnimationFrame(() => renderPrediction(bfModel, maskModel));
}

async function main() {
  let stream: MediaStream | null = null;

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

  const bfModel = await blazeface.load();
  const maskModel = await tf.loadLayersModel("./weights_3000/model.json");
  // const maskModel = await tf.loadLayersModel("/weights_10000/model.json");
  video.addEventListener("loadeddata", () =>
    renderPrediction(bfModel, maskModel)
  );

  await startVideo();
  // renderPrediction(bfModel, maskModel);
}

main().catch(console.error);
