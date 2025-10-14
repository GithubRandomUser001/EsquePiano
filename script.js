const context = new (window.AudioContext || window.webkitAudioContext)();

const notes = [
  {note: 'C2', freq: 65.41},
  {note: 'C#2', freq: 69.30, black: true},
  {note: 'D2', freq: 73.42},
  {note: 'D#2', freq: 77.78, black: true},
  {note: 'E2', freq: 82.41},
  {note: 'F2', freq: 87.31},
  {note: 'F#2', freq: 92.50, black: true},
  {note: 'G2', freq: 98.00},
  {note: 'G#2', freq: 103.83, black: true},
  {note: 'A2', freq: 110.00},
  {note: 'A#2', freq: 116.54, black: true},
  {note: 'B2', freq: 123.47},

  {note: 'C3', freq: 130.81},
  {note: 'C#3', freq: 138.59, black: true},
  {note: 'D3', freq: 146.83},
  {note: 'D#3', freq: 155.56, black: true},
  {note: 'E3', freq: 164.81},
  {note: 'F3', freq: 174.61},
  {note: 'F#3', freq: 185.00, black: true},
  {note: 'G3', freq: 196.00},
  {note: 'G#3', freq: 207.65, black: true},
  {note: 'A3', freq: 220.00},
  {note: 'A#3', freq: 233.08, black: true},
  {note: 'B3', freq: 246.94},

  {note: 'C4', freq: 261.63},
  {note: 'C#4', freq: 277.18, black: true},
  {note: 'D4', freq: 293.66},
  {note: 'D#4', freq: 311.13, black: true},
  {note: 'E4', freq: 329.63},
  {note: 'F4', freq: 349.23},
  {note: 'F#4', freq: 369.99, black: true},
  {note: 'G4', freq: 392.00},
  {note: 'G#4', freq: 415.30, black: true},
  {note: 'A4', freq: 440.00},
  {note: 'A#4', freq: 466.16, black: true},
  {note: 'B4', freq: 493.88},

  {note: 'C5', freq: 523.25},
  {note: 'C#5', freq: 554.37, black: true},
  {note: 'D5', freq: 587.33},
  {note: 'D#5', freq: 622.25, black: true},
  {note: 'E5', freq: 659.25},
  {note: 'F5', freq: 698.46},
  {note: 'F#5', freq: 739.99, black: true},
  {note: 'G5', freq: 783.99},
  {note: 'G#5', freq: 830.61, black: true},
  {note: 'A5', freq: 880.00},
  {note: 'A#5', freq: 932.33, black: true},
  {note: 'B5', freq: 987.77},

  {note: 'C6', freq: 1046.50},
  {note: 'C#6', freq: 1108.73, black: true},
  {note: 'D6', freq: 1174.66},
  {note: 'D#6', freq: 1244.51, black: true},
  {note: 'E6', freq: 1318.51},
  {note: 'F6', freq: 1396.91},
  {note: 'F#6', freq: 1479.98, black: true},
  {note: 'G6', freq: 1567.98},
  {note: 'G#6', freq: 1661.22, black: true},
  {note: 'A6', freq: 1760.00},
  {note: 'A#6', freq: 1864.66, black: true},
  {note: 'B6', freq: 1975.53}
];

const piano = document.getElementById('piano');
const waveTypeSelect = document.getElementById('waveType');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');

let mediaRecorder;
let recordedChunks = [];
let dest = context.createMediaStreamDestination();
mediaRecorder = new MediaRecorder(dest.stream);

mediaRecorder.ondataavailable = e => {
  if (e.data.size > 0) {
    recordedChunks.push(e.data);
  }
};
mediaRecorder.onstop = e => {
  saveBtn.disabled = false;
};

notes.forEach(n => {
  const key = document.createElement('div');
  key.classList.add('key');
  if (n.black) key.classList.add('black');
  key.dataset.freq = n.freq;
  key.textContent = n.note.replace('#','♯');
  piano.appendChild(key);
});

const activeOscillators = new Map();

function createOscillator(freq, type) {
  const osc = context.createOscillator();
  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0.2, context.currentTime);
  osc.frequency.setValueAtTime(freq, context.currentTime);

  if (type.startsWith('square')) {
    // Duty cycle conforme o tipo
    const pulseWidth = type === 'square50' ? 0.5 : type === 'square25' ? 0.25 : 0.125;

    // Criação de onda periódica PWM customizada via série de Fourier
    const harmonics = 50; // Número de harmônicos para a aproximação
    const real = new Float32Array(harmonics + 1);
    const imag = new Float32Array(harmonics + 1);

    for (let n = 1; n <= harmonics; n++) {
      // Coeficiente baseado na fórmula da série de Fourier para PWM
      real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * pulseWidth);
      imag[n] = 0;
    }

    const wave = context.createPeriodicWave(real, imag, {disableNormalization: true});
    osc.setPeriodicWave(wave);

    osc.connect(gainNode);
    gainNode.connect(dest);
    gainNode.connect(context.destination);

    osc.start();

    return {osc, gainNode};
  } else {
    osc.type = type;
    osc.connect(gainNode);
    gainNode.connect(dest);
    gainNode.connect(context.destination);
    osc.start();
    return {osc, gainNode};
  }
}

recordBtn.onclick = () => {
  recordBtn.disabled = true;
  stopBtn.disabled = false;
  saveBtn.disabled = true;
  recordedChunks = [];
  mediaRecorder.start();
};

stopBtn.onclick = () => {
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  mediaRecorder.stop();
};

saveBtn.onclick = () => {
  const blob = new Blob(recordedChunks, {type: 'audio/webm'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'piano_recording.webm';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
};

piano.addEventListener('mousedown', e => {
  if (!e.target.classList.contains('key')) return;
  activeOscillators.set(e.target, playNote(e.target.dataset.freq));
});

piano.addEventListener('mouseup', e => {
  if (!e.target.classList.contains('key')) return;
  stopNote(e.target);
});

piano.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('key')) {
      if (!activeOscillators.has(target)) {
        activeOscillators.set(target, playNote(target.dataset.freq));
      }
    }
  }
});

piano.addEventListener('touchend', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('key')) {
      stopNote(target);
    }
  }
});

function playNote(freq) {
  const waveType = waveTypeSelect.value;
  return createOscillator(parseFloat(freq), waveType);
}

function stopNote(key) {
  const oscObj = activeOscillators.get(key);
  if (!oscObj) return;
  activeOscillators.delete(key);
  oscObj.osc.stop();
}