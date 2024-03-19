const { fft, util: fftUtil } = require("fft-js");
const plt = require("nodeplotlib");

const muteNoise = false;
const muteFiltered = false;

const Fs = 8192;
const T = 1;
const N = Fs * T;
const t = Array.from({ length: N }, (_, i) => i / Fs);

const f1 = 10,
  f2 = 60,
  A1 = 2,
  A2 = 0.5;
const signal = t.map(
  (ti) =>
    A1 * Math.sin(2 * Math.PI * f1 * ti) + A2 * Math.sin(2 * Math.PI * f2 * ti)
);
const noise = t.map(() => Number(!muteNoise) * (Math.random() * 2 - 1));
const signalPlusNoise = signal.map((val, index) => val + noise[index]);

function movingAverageFilter(data, windowSize) {
  const kernel = new Array(windowSize).fill(1 / windowSize);
  return data.map((_, i, arr) =>
    kernel.reduce(
      (acc, cur, k) => acc + (arr[i - k] || 0) * cur * Number(!muteFiltered),
      0
    )
  );
}

const filteredSignal = movingAverageFilter(signal, 4);
const filteredNoise = movingAverageFilter(noise, 4);
const filteredSignalPlusNoise = movingAverageFilter(signalPlusNoise, 5);

function calculateFFT(data) {
  const fftResult = fft(data);
  const frequencies = fftUtil.fftFreq(fftResult, Fs);
  const magnitudes = fftUtil.fftMag(fftResult);
  return frequencies
    .map((f, i) => ({ frequency: f, magnitude: magnitudes[i] }))
    .filter((f) => f.frequency <= Fs / 2);
}

function autocorrelation(data) {
  const result = new Array(data.length).fill(0);
  for (let lag = 0; lag < data.length; lag++) {
    for (let i = 0; i < data.length - lag; i++) {
      result[lag] += data[i] * data[i + lag];
    }
    result[lag] /= data.length;
  }
  return result.slice(0, data.length / 2);
}

function plotData(plots, title, xLabel = "X", yLabel = "Y") {
  const data = plots.map((plot) => ({
    x: plot.x,
    y: plot.y,
    type: "line",
    name: plot.name,
  }));
  plt.plot(data);
}

plotData(
  [
    { x: t, y: signal, name: "Signal" },
    { x: t, y: filteredSignal, name: "Filtered Signal" },
  ],
  "Signal and its Filtered Version",
  "Time (s)",
  "Amplitude"
);
plotData(
  [
    { x: t, y: noise, name: "Noise" },
    { x: t, y: filteredNoise, name: "Filtered Noise" },
  ],
  "Noise and its Filtered Version",
  "Time (s)",
  "Amplitude"
);
plotData(
  [
    { x: t, y: signalPlusNoise, name: "Signal + Noise" },
    { x: t, y: filteredSignalPlusNoise, name: "Filtered Signal + Noise" },
  ],
  "Signal + Noise and its Filtered Version",
  "Time (s)",
  "Amplitude"
);

const fftSignal = calculateFFT(signal);
const fftNoise = calculateFFT(noise);
const fftSignalPlusNoise = calculateFFT(signalPlusNoise);
const fftFilteredSignal = calculateFFT(filteredSignal);
const fftFilteredNoise = calculateFFT(filteredNoise);
const fftFilteredSignalPlusNoise = calculateFFT(filteredSignalPlusNoise);

plotData(
  [
    {
      x: fftSignal.map((d) => d.frequency),
      y: fftSignal.map((d) => d.magnitude),
      name: "Signal",
    },
    {
      x: fftFilteredSignal.map((d) => d.frequency),
      y: fftFilteredSignal.map((d) => d.magnitude),
      name: "Filtered Signal",
    },
  ],
  "Spectrum of the Signal and its Filtered Version",
  "Frequency (Hz)",
  "Amplitude"
);
plotData(
  [
    {
      x: fftNoise.map((d) => d.frequency),
      y: fftNoise.map((d) => d.magnitude),
      name: "Noise",
    },
    {
      x: fftFilteredNoise.map((d) => d.frequency),
      y: fftFilteredNoise.map((d) => d.magnitude),
      name: "Filtered Noise",
    },
  ],
  "Spectrum of the Noise and its Filtered Version",
  "Frequency (Hz)",
  "Amplitude"
);
plotData(
  [
    {
      x: fftSignalPlusNoise.map((d) => d.frequency),
      y: fftSignalPlusNoise.map((d) => d.magnitude),
      name: "Signal + Noise",
    },
    {
      x: fftFilteredSignalPlusNoise.map((d) => d.frequency),
      y: fftFilteredSignalPlusNoise.map((d) => d.magnitude),
      name: "Filtered Signal + Noise",
    },
  ],
  "Spectrum of the Signal + Noise and its Filtered Version",
  "Frequency (Hz)",
  "Amplitude"
);

const acfSignal = autocorrelation(signal);
const acfNoise = autocorrelation(noise);
const acfSignalPlusNoise = autocorrelation(signalPlusNoise);

plotData(
  [{ x: t.slice(0, acfSignal.length), y: acfSignal, name: "Signal" }],
  "ACF of the Signal",
  "Lag (s)",
  "Amplitude"
);
plotData(
  [{ x: t.slice(0, acfNoise.length), y: acfNoise, name: "Noise" }],
  "ACF of the Noise",
  "Lag (s)",
  "Amplitude"
);
plotData(
  [
    {
      x: t.slice(0, acfSignalPlusNoise.length),
      y: acfSignalPlusNoise,
      name: "Signal + Noise",
    },
  ],
  "ACF of the Signal + Noise",
  "Lag (s)",
  "Amplitude"
);
