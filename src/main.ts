import "./style.css";

const slider = document.querySelector<HTMLInputElement>("#freqSlider")!;
const yPosSliders = [document.querySelector<HTMLInputElement>("#yPosCH1")!];
const yPosSliderDiv =
  document.querySelector<HTMLDivElement>("#channelSliders")!;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;

//Audio Globals
let myArrayBuffer: AudioBuffer;
let audioCtx;
let channel = 1;
let length;
let source;
let sampleRate = 44100;
let channelPos = [1024 / 2];

//yPosCH1slider!.oninput =
function yPosUpdate(ev: Event) {
  channelPos[yPosSliders.indexOf(ev.target as HTMLInputElement)] = +(
    ev.target as HTMLInputElement
  ).value;
  drawFade();
  refreshBuffer();
}
for (const slider of yPosSliders) {
  slider.oninput = yPosUpdate;
}

const addButton = document.querySelector<HTMLInputElement>("#addButton")!;
addButton.onclick = () => {
  const slider = document.createElement("input");
  yPosSliders.push(slider);
  channelPos.push(512);
  channel++;
  slider.type = "range";
  slider.min = "0";
  slider.max = "" + height;
  slider.value = "" + height / 2;
  slider.oninput = yPosUpdate;
  const label = document.createElement("label");
  label.innerText = "Ch" + yPosSliders.length;

  yPosSliderDiv.appendChild(label);
  yPosSliderDiv.appendChild(slider);
};
const removeButton = document.querySelector<HTMLInputElement>("#removeButton")!;
removeButton.onclick = () => {
  const children = yPosSliderDiv.childNodes;
  yPosSliders.pop();
  channelPos.pop();
  channel--;
  yPosSliderDiv.removeChild(children.item(children.length - 1));
  yPosSliderDiv.removeChild(children.item(children.length - 1));
  drawFade();
};

slider!.oninput = (ev: Event) => {
  sampleRate = +(ev.target as HTMLInputElement).value;
  let oldBuffer = myArrayBuffer;
  myArrayBuffer = audioCtx!.createBuffer(
    oldBuffer.numberOfChannels,
    oldBuffer.length,
    sampleRate
  );
  refreshBuffer();
  source!.stop();
  source = audioCtx!.createBufferSource();
  source.buffer = myArrayBuffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = 999;
  source.connect(audioCtx!.destination);
  source.start();
};

//Image Globals
const ctx = canvas.getContext("2d");

const width = 1024;
const height = 1024;

canvas.width = width;
canvas.height = height;

function toHex(d: number) {
  return ("0" + Number(d).toString(16)).slice(-2).toUpperCase();
}

function drawFade() {
  if (!ctx) return;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < height; x++) {
      for (let i = 0; i < 3; i++) {
        img.data[(x + y * height) * 4 + i] = Math.floor(
          128 + Math.sin(x * 0.08) * Math.tan(y * 0.003) * 128
        );
      }
      img.data[(x + y + height) * 4 + 3] = 255;
    }
  }
  //console.log(img.data);
  ctx.putImageData(img, 0, 0);

  //draw X Lines
  for (const cPos of channelPos) {
    const line = ctx.getImageData(0, cPos, width, 1);
    if (line == null) return;
    for (let x = 0; x < width; x++) {
      for (let i = 0; i < 3; i++) {
        line.data[x * 4 + i] = 255 - line.data[x * 4 + i];
      }
    }
    ctx.putImageData(line, 0, cPos - 1);
    ctx.putImageData(line, 0, cPos);
    ctx.putImageData(line, 0, cPos + 1);
  }
}
drawFade();

let running = false;
canvas.onclick = () => {
  if (running) return;
  running = true;

  console.log("Start");

  length = width;
  audioCtx = new window.AudioContext();

  myArrayBuffer = audioCtx.createBuffer(channel, length, sampleRate);

  source = audioCtx.createBufferSource();
  source.buffer = myArrayBuffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = 999;
  source.connect(audioCtx.destination);

  refreshBuffer();

  source.start();
};

function refreshBuffer() {
  for (let channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
    const nowBuffering = myArrayBuffer.getChannelData(channel);
    let data = ctx?.getImageData(0, channelPos[channel], width, 1).data;
    if (data == null) {
      continue;
    }
    let idx = 0;
    for (let i = 0; i < data.length; i += 4) {
      nowBuffering[idx] = (data[i] + data[i + 1] + data[i] + 2) / 255.0 / 3;
      idx++;
    }
  }
}
