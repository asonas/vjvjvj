import Veda from "vedajs";

// ===== BPM設定 =====
// ここでBPMを手動設定してください
const MANUAL_BPM = 150; // お好みのBPMに変更してください
const USE_MANUAL_BPM = true; // true: 手動BPM, false: 自動検出BPM
// ==================

// ===== DJ設定 =====
const CURRENT_DJ = {
  name: "てらお",
  icon: "players/てらお.jpg",
};
// ================

// ===== アニメーション設定 =====
const PATTERN_SWITCH_INTERVAL = 15000; // パターン切り替え間隔（ミリ秒）
const ANIMATION_PATTERNS = [
  "heartbeat_pulse", // 鼓動パルス
  "rhythmic_breathing", // リズミック呼吸
  // "flowing_ribbons", // 流れるリボン
  "tunnel_zoom", // トンネルズーム
  "liquid_metal", // 液体金属
  "kaleidoscope", // 万華鏡
  "wave_interference", // 波の干渉
  "waveform_visualizer", // 波形ビジュアライザー
  "particle_field", // パーティクルフィールド
  "organic_growth", // 有機的成長
  "crystal_formation", // 結晶形成
  "energy_streams", // エネルギーストリーム
  "morphing_grid", // 変形グリッド
  "fluid_dynamics", // 流体力学
  "neural_network", // ニューラルネットワーク
];
// ===========================

class BPMDetector {
  private peaks: number[] = [];
  private lastPeakTime = 0;
  private intervals: number[] = [];
  private threshold = 0.7;

  detectBPM(volume: number, currentTime: number): number {
    // ピーク検出
    if (volume > this.threshold && currentTime - this.lastPeakTime > 0.3) {
      if (this.lastPeakTime > 0) {
        const interval = currentTime - this.lastPeakTime;
        this.intervals.push(interval);

        // 最新10個の間隔のみ保持
        if (this.intervals.length > 10) {
          this.intervals.shift();
        }
      }
      this.lastPeakTime = currentTime;
    }

    // BPM計算（最低3個の間隔が必要）
    if (this.intervals.length >= 3) {
      const avgInterval =
        this.intervals.reduce((a, b) => a + b) / this.intervals.length;
      return Math.round(60 / avgInterval);
    }

    return 0;
  }

  updateThreshold(volume: number) {
    // 動的閾値調整
    this.threshold = Math.max(0.3, Math.min(0.8, volume * 0.8));
  }
}

class VJApp {
  private veda: Veda;
  private canvas: HTMLCanvasElement;
  private waveformCanvas: HTMLCanvasElement;
  private waveformCtx: CanvasRenderingContext2D;
  private startBtn: HTMLButtonElement;
  private status: HTMLElement;
  private debugElements: {
    audioDevice: HTMLElement;
    audioContext: HTMLElement;
    volume: HTMLElement;
    fftSize: HTMLElement;
    sampleRate: HTMLElement;
    bpm: HTMLElement;
    waveform: HTMLElement;
    currentPattern: HTMLElement;
  };
  private oscilloscope: HTMLCanvasElement;
  private oscilloscopeCtx: CanvasRenderingContext2D;
  private isStarted = false;
  private debugInterval: number | null = null;

  // BPM検出用
  private bpmDetector: BPMDetector;
  private currentBPM = MANUAL_BPM;

  // アニメーションパターン管理
  private currentPatternIndex = Math.floor(
    Math.random() * ANIMATION_PATTERNS.length
  );
  private patternStartTime = 0;
  private lastPatternSwitchTime = 0;

  // eyecatch表示
  private eyecatch: HTMLImageElement;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.waveformCanvas = document.getElementById("waveform-bg") as HTMLCanvasElement;
    this.waveformCtx = this.waveformCanvas.getContext("2d")!;
    this.startBtn = document.getElementById("startBtn") as HTMLButtonElement;
    this.status = document.getElementById("status") as HTMLElement;
    this.debugElements = {
      audioDevice: document.getElementById("audioDevice") as HTMLElement,
      audioContext: document.getElementById("audioContext") as HTMLElement,
      volume: document.getElementById("volume") as HTMLElement,
      fftSize: document.getElementById("fftSize") as HTMLElement,
      sampleRate: document.getElementById("sampleRate") as HTMLElement,
      bpm: document.getElementById("bpm") as HTMLElement,
      waveform: document.getElementById("waveform") as HTMLElement,
      currentPattern: document.getElementById("currentPattern") as HTMLElement,
    };

    this.oscilloscope = document.getElementById(
      "oscilloscope"
    ) as HTMLCanvasElement;
    this.oscilloscopeCtx = this.oscilloscope.getContext("2d")!;
    this.bpmDetector = new BPMDetector();

    // eyecatch要素を取得
    this.eyecatch = document.getElementById("eyecatch") as HTMLImageElement;

    // DJ情報を設定
    this.setupDJInfo();

    this.setupCanvas();
    this.setupControls();
    this.initVeda();

    // ページロード後に自動でマイクを開始
    setTimeout(() => {
      this.autoStartAudio();
    }, 1000);

    // パターン切り替えタイマー開始
    this.lastPatternSwitchTime = Date.now();

    // eyecatchを右上に表示
    this.setupEyecatch();
  }

  private setupDJInfo() {
    const djIcon = document.getElementById("dj-icon") as HTMLImageElement;
    const djName = document.getElementById("dj-name") as HTMLElement;

    if (djIcon && djName) {
      djIcon.src = CURRENT_DJ.icon;
      djIcon.alt = CURRENT_DJ.name;
      djName.textContent = CURRENT_DJ.name;
    }
  }

  private setupEyecatch() {
    // eyecatch要素を取得して表示設定を確認
    this.eyecatch = document.getElementById("eyecatch") as HTMLImageElement;
    if (this.eyecatch) {
      console.log("Eyecatch element found and displayed in top-right corner");
    }
  }

  private initBlockBreakerGame() {
    // 既存のeyecatch要素を非表示にする
    this.eyecatch.style.display = 'none';
    
    // ブロックの設定
    const blockWidth = 120;
    const blockHeight = 60;
    const blocksPerRow = Math.floor(window.innerWidth / (blockWidth + 10));
    const blockRows = 4;
    const startX = (window.innerWidth - (blocksPerRow * (blockWidth + 10) - 10)) / 2;
    const startY = 50;

    // ブロックを生成
    this.blocks = [];
    for (let row = 0; row < blockRows; row++) {
      for (let col = 0; col < blocksPerRow; col++) {
        const blockElement = document.createElement('img');
        blockElement.src = 'images/eyecatch.png';
        blockElement.style.position = 'fixed';
        blockElement.style.width = `${blockWidth}px`;
        blockElement.style.height = `${blockHeight}px`;
        blockElement.style.opacity = '0.7';
        blockElement.style.zIndex = '90';
        blockElement.style.transition = 'opacity 0.3s ease';
        
        const x = startX + col * (blockWidth + 10);
        const y = startY + row * (blockHeight + 10);
        
        blockElement.style.left = `${x}px`;
        blockElement.style.top = `${y}px`;
        
        document.body.appendChild(blockElement);
        
        this.blocks.push({
          x,
          y,
          width: blockWidth,
          height: blockHeight,
          element: blockElement,
          active: true
        });
      }
    }

    // ボールを生成
    const ballElement = document.createElement('div');
    ballElement.style.position = 'fixed';
    ballElement.style.width = '20px';
    ballElement.style.height = '20px';
    ballElement.style.backgroundColor = '#fff';
    ballElement.style.borderRadius = '50%';
    ballElement.style.zIndex = '95';
    ballElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
    document.body.appendChild(ballElement);

    this.ball = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      velocityX: 3,
      velocityY: -4,
      size: 20,
      element: ballElement
    };

    this.startBlockBreakerAnimation();
  }

  private startBlockBreakerAnimation() {
    if (this.blockBreakerAnimationId) {
      cancelAnimationFrame(this.blockBreakerAnimationId);
    }

    const animate = () => {
      if (!this.ball) return;

      // ボールの位置を更新
      this.ball.x += this.ball.velocityX;
      this.ball.y += this.ball.velocityY;

      // 壁との衝突判定
      if (this.ball.x <= 0 || this.ball.x >= window.innerWidth - this.ball.size) {
        this.ball.velocityX = -this.ball.velocityX;
        this.ball.x = Math.max(0, Math.min(window.innerWidth - this.ball.size, this.ball.x));
      }

      if (this.ball.y <= 0 || this.ball.y >= window.innerHeight - this.ball.size) {
        this.ball.velocityY = -this.ball.velocityY;
        this.ball.y = Math.max(0, Math.min(window.innerHeight - this.ball.size, this.ball.y));
      }

      // ブロックとの衝突判定
      this.blocks.forEach(block => {
        if (!block.active || !this.ball) return;

        if (this.ball.x < block.x + block.width &&
            this.ball.x + this.ball.size > block.x &&
            this.ball.y < block.y + block.height &&
            this.ball.y + this.ball.size > block.y) {
          
          // ブロックを無効化
          block.active = false;
          block.element.style.opacity = '0';
          setTimeout(() => {
            block.element.remove();
          }, 300);

          // ボールの反射
          const ballCenterX = this.ball.x + this.ball.size / 2;
          const ballCenterY = this.ball.y + this.ball.size / 2;
          const blockCenterX = block.x + block.width / 2;
          const blockCenterY = block.y + block.height / 2;

          const diffX = Math.abs(ballCenterX - blockCenterX);
          const diffY = Math.abs(ballCenterY - blockCenterY);

          if (diffX > diffY) {
            this.ball.velocityX = -this.ball.velocityX;
          } else {
            this.ball.velocityY = -this.ball.velocityY;
          }
        }
      });

      // 全てのブロックが消えたかチェック
      const activeBlocks = this.blocks.filter(block => block.active);
      if (activeBlocks.length === 0) {
        // 少し待ってからブロックを再配置
        setTimeout(() => {
          this.resetBlocks();
        }, 1000);
      }

      // ボールの位置を更新
      this.ball.element.style.left = `${this.ball.x}px`;
      this.ball.element.style.top = `${this.ball.y}px`;

      // 次のフレームをリクエスト
      this.blockBreakerAnimationId = requestAnimationFrame(animate);
    };

    // アニメーション開始
    animate();
  }

  private resetBlocks() {
    // ブロックの設定
    const blockWidth = 120;
    const blockHeight = 60;
    const blocksPerRow = Math.floor(window.innerWidth / (blockWidth + 10));
    const blockRows = 4;
    const startX = (window.innerWidth - (blocksPerRow * (blockWidth + 10) - 10)) / 2;
    const startY = 50;

    // 新しいブロックを生成
    this.blocks = [];
    for (let row = 0; row < blockRows; row++) {
      for (let col = 0; col < blocksPerRow; col++) {
        const blockElement = document.createElement('img');
        blockElement.src = 'images/eyecatch.png';
        blockElement.style.position = 'fixed';
        blockElement.style.width = `${blockWidth}px`;
        blockElement.style.height = `${blockHeight}px`;
        blockElement.style.opacity = '0.7';
        blockElement.style.zIndex = '90';
        blockElement.style.transition = 'opacity 0.3s ease';
        
        const x = startX + col * (blockWidth + 10);
        const y = startY + row * (blockHeight + 10);
        
        blockElement.style.left = `${x}px`;
        blockElement.style.top = `${y}px`;
        
        document.body.appendChild(blockElement);
        
        this.blocks.push({
          x,
          y,
          width: blockWidth,
          height: blockHeight,
          element: blockElement,
          active: true
        });
      }
    }
  }

  private setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.waveformCanvas.width = window.innerWidth;
    this.waveformCanvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.waveformCanvas.width = window.innerWidth;
      this.waveformCanvas.height = window.innerHeight;
      if (this.veda) {
        this.veda.resize(window.innerWidth, window.innerHeight);
      }
    });
  }

  private setupControls() {
    this.startBtn.addEventListener("click", () => {
      if (!this.isStarted) {
        this.startAudio();
      } else {
        this.stopAudio();
      }
    });
  }

  private initVeda() {
    this.veda = new Veda({
      MIDI: false,
      GAMEPAD: false,
      CAMERA: false,
      AUDIO: true,
      pixelRatio: window.devicePixelRatio,
    });

    this.veda.setCanvas(this.canvas);
    this.veda.resize(window.innerWidth, window.innerHeight);

    // 初期シェーダーをロード
    this.loadCurrentPattern();

    this.status.textContent = "Veda初期化完了";
  }

  private generateShaderPattern(patternName: string): string {
    const bpmFreq = MANUAL_BPM / 60.0; // BPMをHzに変換

    const baseUniforms = `
      precision mediump float;
      uniform float time;
      uniform vec2 resolution;
      uniform float volume;
      uniform sampler2D spectrum;
      uniform sampler2D samples;

      // BPM同期鼓動効果関数
      float getBeatPulse(float time, float bpmFreq) {
        float bpmTime = time * bpmFreq;
        float mainPulse = fract(bpmTime);

        float beatIntensity = 0.0;
        if (mainPulse < 0.1) {
          // 主要な鼓動
          beatIntensity = smoothstep(0.0, 0.05, mainPulse) * smoothstep(0.1, 0.05, mainPulse);
        } else if (mainPulse < 0.2) {
          // 二次的な鼓動（控えめ）
          float secondPulse = (mainPulse - 0.1) / 0.1;
          beatIntensity = smoothstep(0.0, 0.5, secondPulse) * smoothstep(1.0, 0.5, secondPulse) * 0.3;
        }

        return beatIntensity;
      }

      // 穏やかな鼓動効果（明滅を控えめに）
      float getGentlePulse(float time, float bpmFreq) {
        float bpmTime = time * bpmFreq;
        float cycle = sin(bpmTime * 6.28318) * 0.5 + 0.5;
        return 0.7 + cycle * 0.15; // 0.7から0.85の範囲で変動
      }
    `;

    switch (patternName) {
      case "heartbeat_pulse":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            // 中心からの距離
            float dist = length(uv);

            // 周波数スペクトラムによる色の変化
            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            // 複数の同心円による鼓動効果（控えめ）
            float rings = 0.0;
            for(int i = 0; i < 5; i++) {
              float fi = float(i);
              float ringTime = time * ${bpmFreq.toFixed(3)} - fi * 0.15;
              float ringPulse = fract(ringTime);

              if (ringPulse < 0.4) {
                float ringRadius = 0.2 + ringPulse * 1.2;
                float ringWidth = 0.08;
                float ringIntensity = (1.0 - ringPulse) * 0.4 * (1.0 + heartbeat * 0.6);

                if (abs(dist - ringRadius) < ringWidth) {
                  rings += ringIntensity * smoothstep(ringWidth, 0.0, abs(dist - ringRadius));
                }
              }
            }

            // 背景のグラデーション（鼓動に合わせて微妙に変化）
            float bgGradient = 1.0 - smoothstep(0.0, 1.2, dist);
            vec3 bgColor = vec3(0.15, 0.08, 0.2) * bgGradient * gentlePulse;

            // 鼓動に合わせた色の変化（控えめ）
            vec3 heartColor = vec3(
              0.6 + heartbeat * 0.15 + bassFreq * 0.2,
              0.3 + heartbeat * 0.2 + midFreq * 0.25,
              0.2 + heartbeat * 0.1 + highFreq * 0.15
            );

            // 最終的な色の合成
            vec3 finalColor = bgColor + heartColor * bgGradient + vec3(0.8, 0.4, 0.6) * rings;

            // 全体の明度調整（控えめに）
            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            finalColor *= gentlePulse * (1.0 + audioIntensity * 0.2);

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
        );

      case "rhythmic_breathing":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // BPMに基づく呼吸のリズム（鼓動の半分の速度）
            float breathTime = time * ${(bpmFreq / 2.0).toFixed(3)};

            // 呼吸のサイクル（吸う→止める→吐く→止める）
            float breathCycle = fract(breathTime);
            float breathIntensity = 0.0;

            if (breathCycle < 0.4) {
              // 吸気 (0.0 - 0.4)
              breathIntensity = smoothstep(0.0, 0.4, breathCycle);
            } else if (breathCycle < 0.5) {
              // 吸気後の停止 (0.4 - 0.5)
              breathIntensity = 1.0;
            } else if (breathCycle < 0.9) {
              // 呼気 (0.5 - 0.9)
              breathIntensity = 1.0 - smoothstep(0.5, 0.9, breathCycle);
            } else {
              // 呼気後の停止 (0.9 - 1.0)
              breathIntensity = 0.0;
            }

            // 中心からの距離
            float dist = length(uv);

            // 呼吸による全体的な拡張・収縮
            float breathScale = 0.7 + breathIntensity * 0.6;
            vec2 breathUV = uv / breathScale;
            float breathDist = length(breathUV);

            // 同心円による呼吸の可視化
            float circles = 0.0;
            for(int i = 0; i < 8; i++) {
              float fi = float(i);
              float circleRadius = 0.2 + fi * 0.15;
              float adjustedRadius = circleRadius * breathScale;

              // 呼吸に合わせて円の透明度を変更
              float circleIntensity = sin(breathTime * 6.28318 + fi * 0.5) * 0.5 + 0.5;
              circleIntensity *= breathIntensity;

              // 円の描画
              float circleDist = abs(dist - adjustedRadius);
              if (circleDist < 0.02) {
                circles += circleIntensity * (1.0 - circleDist / 0.02);
              }
            }

            // 周波数スペクトラムによる色の変化
            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            // 呼吸に合わせた背景グラデーション
            float bgGradient = 1.0 - smoothstep(0.0, 1.0, breathDist);
            bgGradient *= breathIntensity * 0.8 + 0.2;

            // 呼吸による色の変化（穏やかな青から温かいオレンジへ）
            vec3 inhaleColor = vec3(0.2, 0.4, 0.8) + vec3(bassFreq * 0.2, midFreq * 0.3, highFreq * 0.1);
            vec3 exhaleColor = vec3(0.8, 0.5, 0.2) + vec3(highFreq * 0.2, midFreq * 0.1, bassFreq * 0.3);
            vec3 breathColor = mix(exhaleColor, inhaleColor, breathIntensity);

            // 中心部の光る効果
            float centerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
            centerGlow *= breathIntensity;

            // パーティクル効果（呼吸に合わせて浮遊）
            float particles = 0.0;
            for(int i = 0; i < 12; i++) {
              float fi = float(i);
              vec2 particlePos = vec2(
                sin(breathTime * 2.0 + fi * 2.5) * (0.5 + breathIntensity * 0.3),
                cos(breathTime * 1.5 + fi * 3.0) * (0.4 + breathIntensity * 0.2)
              );

              float particleDist = length(uv - particlePos);
              particles += (0.01 / (particleDist + 0.01)) * breathIntensity;
            }

            // 最終的な色の合成
            vec3 finalColor = breathColor * bgGradient;
            finalColor += vec3(0.9, 0.9, 0.7) * centerGlow;
            finalColor += vec3(1.0, 1.0, 0.8) * circles;
            finalColor += vec3(0.7, 0.8, 1.0) * particles * 0.3;

            // 音楽の強度による全体的な明度調整
            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            finalColor *= (0.5 + breathIntensity * 0.5 + audioIntensity * 0.3);

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
        );

      case "flowing_ribbons":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            float flow = time * ${bpmFreq.toFixed(3)};

            // 波形データから動きを取得
            float waveform = texture2D(samples, vec2(abs(uv.x) * 0.5 + 0.25, 0.5)).r;
            waveform = (waveform - 0.5) * 2.0; // -1.0 to 1.0に正規化

            // 鼓動に合わせてリボンの動きを強調
            float beatOffset = heartbeat * 0.3;
            float ribbon1 = sin(uv.y * 3.0 + uv.x + flow + waveform * 2.0 + beatOffset) * 0.5 + 0.5;
            float ribbon2 = sin(uv.y * 2.0 - uv.x * 1.5 + flow * 1.3 + waveform * 1.5 + beatOffset * 0.8) * 0.5 + 0.5;
            float ribbon3 = sin(uv.x * 2.5 + uv.y * 0.8 + flow * 0.7 + waveform + beatOffset * 1.2) * 0.5 + 0.5;

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            // 音量による強度調整（控えめに）
            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            audioIntensity = smoothstep(0.1, 0.8, audioIntensity);

            vec3 color = vec3(
              ribbon1 * (0.4 + bassFreq * 0.4 + abs(waveform) * 0.2 + heartbeat * 0.15),
              ribbon2 * (0.3 + midFreq * 0.5 + abs(waveform) * 0.15 + heartbeat * 0.2),
              ribbon3 * (0.5 + highFreq * 0.4 + abs(waveform) * 0.25 + heartbeat * 0.1)
            );

            float intensity = smoothstep(0.2, 0.8, (ribbon1 + ribbon2 + ribbon3) / 3.0);
            intensity *= gentlePulse * (1.0 + audioIntensity * 0.2);

            gl_FragColor = vec4(color * intensity, 1.0);
          }
        `
        );

      case "tunnel_zoom":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
            float d = length(uv);
            float angle = atan(uv.y, uv.x);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            // 鼓動に合わせてトンネルの動きを調整
            float tunnelSpeed = 2.0 + heartbeat * 0.5;
            float tunnel = fract(d * (8.0 + heartbeat * 2.0) - time * ${bpmFreq.toFixed(
              3
            )} * tunnelSpeed);
            float rings = smoothstep(0.3, 0.7, tunnel) * gentlePulse;

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            // 鼓動に合わせてスパイラルを強調
            float spiral = angle * 3.0 + time * ${bpmFreq.toFixed(
              3
            )} + bassFreq * 3.0 + heartbeat * 2.0;

            vec3 color = vec3(
              0.2 + 0.5 * sin(spiral) + heartbeat * 0.15,
              0.3 + 0.4 * cos(spiral + 2.0) + heartbeat * 0.2,
              0.4 + 0.3 * sin(spiral + 4.0) + heartbeat * 0.1
            );

            // 音楽強度による色調整（控えめ）
            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            color *= (1.0 + audioIntensity * 0.3);

            gl_FragColor = vec4(color * rings, 1.0);
          }
        `
        );

      case "liquid_metal":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            float flow = time * ${bpmFreq.toFixed(3)} * 0.5;
            vec2 warp = vec2(
              sin(uv.y * 2.0 + flow + heartbeat * 0.5) * (0.3 + heartbeat * 0.1),
              cos(uv.x * 1.5 + flow * 1.2 + heartbeat * 0.3) * (0.2 + heartbeat * 0.08)
            );

            vec2 liquid = uv + warp;
            float metal = sin(liquid.x * 8.0) * sin(liquid.y * 6.0);

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            metal += midFreq * 1.5 + heartbeat * 0.8;

            vec3 color = vec3(0.5, 0.6, 0.7) * (0.4 + metal * 0.4 + heartbeat * 0.2);
            color += vec3(0.2, 0.15, 0.08) * smoothstep(0.2, 0.6, metal) * gentlePulse;

            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            color *= gentlePulse * (1.0 + audioIntensity * 0.2);

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "kaleidoscope":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
            float angle = atan(uv.y, uv.x);
            float d = length(uv);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            // 万華鏡効果（鼓動に合わせて回転）
            float segments = 8.0;
            angle += heartbeat * 0.2;
            angle = mod(angle, 6.28318 / segments);
            if (mod(floor(angle * segments / 6.28318), 2.0) == 1.0) {
              angle = 6.28318 / segments - angle;
            }

            vec2 kaleid = vec2(cos(angle) * d, sin(angle) * d);

            float pattern = sin(kaleid.x * (10.0 + heartbeat * 2.0) + time * ${bpmFreq.toFixed(
              3
            )}) *
                           cos(kaleid.y * (8.0 + heartbeat * 1.5) + time * ${bpmFreq.toFixed(
                             3
                           )} * 1.3);

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            pattern += highFreq * 1.0 + heartbeat * 0.8;

            vec3 color = vec3(
              0.4 + 0.3 * sin(pattern * 3.0) + heartbeat * 0.2,
              0.3 + 0.4 * cos(pattern * 2.0 + 2.0) + heartbeat * 0.25,
              0.5 + 0.2 * sin(pattern * 4.0 + 4.0) + heartbeat * 0.15
            );

            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            color *= gentlePulse * (1.0 + audioIntensity * 0.2);

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "wave_interference":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // 実際の音声波形から干渉パターンを生成
            float waveData1 = texture2D(samples, vec2(0.25, 0.5)).r;
            float waveData2 = texture2D(samples, vec2(0.5, 0.5)).r;
            float waveData3 = texture2D(samples, vec2(0.75, 0.5)).r;

            // 波形データを-1.0から1.0に正規化
            waveData1 = (waveData1 - 0.5) * 2.0;
            waveData2 = (waveData2 - 0.5) * 2.0;
            waveData3 = (waveData3 - 0.5) * 2.0;

            // 実音声に基づく干渉パターン
            float wave1 = sin(length(uv - vec2(0.5, 0.0)) * (12.0 + waveData1 * 8.0) - time * ${bpmFreq.toFixed(
              3
            )} * 2.0);
            float wave2 = sin(length(uv - vec2(-0.5, 0.0)) * (10.0 + waveData2 * 6.0) - time * ${bpmFreq.toFixed(
              3
            )} * 1.8);
            float wave3 = sin(length(uv - vec2(0.0, 0.5)) * (14.0 + waveData3 * 10.0) - time * ${bpmFreq.toFixed(
              3
            )} * 2.2);

            float interference = (wave1 + wave2 + wave3) / 3.0;

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            // 波形の振幅も考慮
            float waveAmplitude = (abs(waveData1) + abs(waveData2) + abs(waveData3)) / 3.0;
            interference += bassFreq * 1.5 + waveAmplitude * 0.8;

            vec3 color = vec3(
              0.4 + 0.6 * interference + waveData1 * 0.2,
              0.3 + 0.7 * abs(interference) + waveData2 * 0.15,
              0.8 + 0.2 * interference + waveData3 * 0.25
            );

            // 音声強度による全体の輝度調整
            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            color *= (0.7 + audioIntensity * 0.6);

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "waveform_visualizer":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            float waveform = 0.0;
            float spectrumVis = 0.0;

            // 横方向の波形表示
            if (abs(uv.y) < 0.6) {
              float samplePos = (uv.x + 1.0) * 0.5; // -1.0〜1.0を0.0〜1.0に変換
              samplePos = clamp(samplePos, 0.0, 1.0);

              float waveData = texture2D(samples, vec2(samplePos, 0.5)).r;
              waveData = (waveData - 0.5) * 2.0; // -1.0 to 1.0に正規化

              // 波形の線を描画
              float waveY = waveData * 0.4;
              float dist = abs(uv.y - waveY);
              waveform = smoothstep(0.02, 0.005, dist);

              // 波形の強度による色付け
              float intensity = abs(waveData);
              waveform *= (0.5 + intensity * 0.8);
            }

            // 上部にスペクトラム表示
            if (uv.y > 0.3 && uv.y < 0.9) {
              float freqPos = (uv.x + 1.0) * 0.5;
              freqPos = clamp(freqPos, 0.0, 1.0);

              float spectrumData = texture2D(spectrum, vec2(freqPos, 0.5)).r;
              float spectrumHeight = (uv.y - 0.3) / 0.6; // 0.0〜1.0に正規化

              if (spectrumHeight < spectrumData) {
                spectrumVis = 1.0 - spectrumHeight;
                spectrumVis *= spectrumData;
              }
            }

            // 下部に逆向きスペクトラム表示
            if (uv.y < -0.3 && uv.y > -0.9) {
              float freqPos = (uv.x + 1.0) * 0.5;
              freqPos = clamp(freqPos, 0.0, 1.0);

              float spectrumData = texture2D(spectrum, vec2(freqPos, 0.5)).r;
              float spectrumHeight = (-uv.y - 0.3) / 0.6; // 0.0〜1.0に正規化

              if (spectrumHeight < spectrumData) {
                spectrumVis = 1.0 - spectrumHeight;
                spectrumVis *= spectrumData;
              }
            }

            // 色の合成
            vec3 waveColor = vec3(0.0, 1.0, 0.5) * waveform;
            vec3 spectrumColor = vec3(1.0, 0.3, 0.8) * spectrumVis;

            // 周波数別の色分け
            float freqPos = (uv.x + 1.0) * 0.5;
            if (freqPos < 0.33) {
              spectrumColor = mix(vec3(1.0, 0.2, 0.2), vec3(1.0, 0.8, 0.2), freqPos * 3.0);
            } else if (freqPos < 0.66) {
              spectrumColor = mix(vec3(1.0, 0.8, 0.2), vec3(0.2, 1.0, 0.2), (freqPos - 0.33) * 3.0);
            } else {
              spectrumColor = mix(vec3(0.2, 1.0, 0.2), vec3(0.2, 0.2, 1.0), (freqPos - 0.66) * 3.0);
            }
            spectrumColor *= spectrumVis;

            // BPM同期鼓動効果を追加
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            vec3 finalColor = waveColor * (1.0 + heartbeat * 0.2) + spectrumColor * gentlePulse;

            // 背景のグリッド（控えめに）
            float grid = 0.0;
            vec2 gridUV = uv * 10.0;
            vec2 gridLines = abs(fract(gridUV) - 0.5);
            if (min(gridLines.x, gridLines.y) < 0.05) {
              grid = 0.05 * gentlePulse;
            }

            finalColor += vec3(grid * 0.2, grid * 0.2, grid * 0.3);
            finalColor *= gentlePulse;

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
        );

      case "particle_field":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            float particles = 0.0;
            for(int i = 0; i < 8; i++) {
              float fi = float(i);
              vec2 pos = vec2(
                sin(time * ${bpmFreq.toFixed(
                  3
                )} * (1.0 + fi * 0.3) + fi * 2.0 + heartbeat * 0.5) * (0.7 + heartbeat * 0.2),
                cos(time * ${bpmFreq.toFixed(
                  3
                )} * (1.2 + fi * 0.2) + fi * 3.0 + heartbeat * 0.3) * (0.6 + heartbeat * 0.15)
              );

              float dist = length(uv - pos);
              particles += (0.015 + heartbeat * 0.01) / (dist + 0.01);
            }

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            particles *= gentlePulse * (1.0 + highFreq * 1.0 + heartbeat * 0.8);

            vec3 color = vec3(
              particles * (0.6 + heartbeat * 0.2),
              particles * (0.4 + heartbeat * 0.3),
              particles * (0.8 + heartbeat * 0.1)
            );

            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            color *= (1.0 + audioIntensity * 0.2);

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "organic_growth":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            float growth = 0.0;
            for(int i = 0; i < 5; i++) {
              float fi = float(i);
              vec2 seed = vec2(sin(fi * 2.3), cos(fi * 1.7)) * 0.5;
              float dist = length(uv - seed);

              float branch = sin(dist * 8.0 - time * ${bpmFreq.toFixed(
                3
              )} + fi) *
                            sin(atan(uv.y - seed.y, uv.x - seed.x) * 3.0 + time * ${bpmFreq.toFixed(
                              3
                            )});

              growth += exp(-dist * 2.0) * (0.5 + branch * 0.5);
            }

            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            growth *= (0.8 + midFreq * 0.4);

            vec3 color = vec3(0.2 + growth * 0.3, 0.6 + growth * 0.4, 0.3 + growth * 0.2);
            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "crystal_formation":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            float crystal = 0.0;
            for(int i = 0; i < 6; i++) {
              float angle = float(i) * 6.28318 / 6.0;
              vec2 dir = vec2(cos(angle), sin(angle));

              float edge = abs(dot(uv, dir));
              edge = smoothstep(0.1, 0.3, edge);

              float facet = sin(edge * 20.0 + time * ${bpmFreq.toFixed(3)});
              crystal += edge * (0.5 + facet * 0.5);
            }

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            crystal += bassFreq * 0.8;

            vec3 color = vec3(0.9, 0.95, 1.0) * crystal;
            color += vec3(0.3, 0.8, 1.0) * smoothstep(0.7, 1.0, crystal);

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "energy_streams":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            float energy = 0.0;
            for(int i = 0; i < 4; i++) {
              float fi = float(i);
              float stream = sin(uv.y * 5.0 + uv.x * (2.0 + fi) - time * ${bpmFreq.toFixed(
                3
              )} * (2.0 + fi * 0.5) + heartbeat * 0.8);

              float width = 0.08 + sin(time * ${bpmFreq.toFixed(
                3
              )} + fi * 2.0) * 0.03 + heartbeat * 0.02;
              energy += exp(-abs(stream) / width) * (0.6 + fi * 0.08 + heartbeat * 0.2);
            }

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            energy *= gentlePulse * (0.5 + highFreq * 0.6 + heartbeat * 0.3);

            vec3 color = vec3(
              energy * (0.8 + heartbeat * 0.4),
              energy * (0.6 + heartbeat * 0.2),
              energy * (0.3 + heartbeat * 0.1)
            );

            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            color *= (1.0 + audioIntensity * 0.2);

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "morphing_grid":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            vec2 morph = uv + vec2(
              sin(uv.y * 3.0 + time * ${bpmFreq.toFixed(3)}) * 0.2,
              cos(uv.x * 2.5 + time * ${bpmFreq.toFixed(3)} * 1.3) * 0.15
            );

            vec2 grid = fract(morph * 8.0);
            float lines = smoothstep(0.0, 0.1, grid.x) * smoothstep(0.1, 0.0, grid.x) +
                         smoothstep(0.0, 0.1, grid.y) * smoothstep(0.1, 0.0, grid.y);

            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            lines += midFreq * 0.5;

            vec3 color = vec3(0.4 + lines * 0.6, 0.8 + lines * 0.2, 0.3 + lines * 0.7);
            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "fluid_dynamics":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            float flow = time * ${bpmFreq.toFixed(3)} * 0.3;
            vec2 fluid = uv;

            for(int i = 0; i < 3; i++) {
              float fi = float(i);
              fluid += vec2(
                sin(fluid.y * 2.0 + flow + fi) * 0.1,
                cos(fluid.x * 1.8 + flow * 1.2 + fi) * 0.08
              );
            }

            float turbulence = sin(fluid.x * 8.0) * cos(fluid.y * 6.0);

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            turbulence += bassFreq * 1.2;

            vec3 color = vec3(
              0.2 + turbulence * 0.4,
              0.4 + abs(turbulence) * 0.6,
              0.7 + turbulence * 0.3
            );

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      case "neural_network":
        return (
          baseUniforms +
          `
          void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

            // BPM同期鼓動効果
            float heartbeat = getBeatPulse(time, ${bpmFreq.toFixed(3)});
            float gentlePulse = getGentlePulse(time, ${bpmFreq.toFixed(3)});

            float network = 0.0;
            for(int i = 0; i < 12; i++) {
              float fi = float(i);
              vec2 node = vec2(
                sin(fi * 2.3 + time * ${bpmFreq.toFixed(
                  3
                )} * 0.5 + heartbeat * 0.3) * (0.8 + heartbeat * 0.1),
                cos(fi * 1.7 + time * ${bpmFreq.toFixed(
                  3
                )} * 0.7 + heartbeat * 0.2) * (0.6 + heartbeat * 0.08)
              );

              float dist = length(uv - node);
              float connection = exp(-dist * (3.0 + heartbeat * 0.5)) * (1.0 + heartbeat * 0.3);

              // ニューロン間の接続線
              for(int j = i + 1; j < 12; j++) {
                float fj = float(j);
                vec2 node2 = vec2(
                  sin(fj * 2.3 + time * ${bpmFreq.toFixed(
                    3
                  )} * 0.5 + heartbeat * 0.3) * (0.8 + heartbeat * 0.1),
                  cos(fj * 1.7 + time * ${bpmFreq.toFixed(
                    3
                  )} * 0.7 + heartbeat * 0.2) * (0.6 + heartbeat * 0.08)
                );

                float lineDist = length(cross(vec3(uv - node, 0.0), vec3(node2 - node, 0.0))) / length(node2 - node);
                if(lineDist < 0.015 && length(node2 - node) < 0.4) {
                  connection += exp(-lineDist * 40.0) * 0.2 * (1.0 + heartbeat * 0.5);
                }
              }

              network += connection;
            }

            float bassFreq = texture2D(spectrum, vec2(0.1, 0.5)).r;
            float midFreq = texture2D(spectrum, vec2(0.5, 0.5)).r;
            float highFreq = texture2D(spectrum, vec2(0.9, 0.5)).r;

            network *= gentlePulse * (0.5 + midFreq * 0.4 + heartbeat * 0.3);

            vec3 color = vec3(
              network * (0.6 + heartbeat * 0.3),
              network * (0.8 + heartbeat * 0.3),
              network * (0.5 + heartbeat * 0.2)
            );

            float audioIntensity = (bassFreq + midFreq + highFreq) / 3.0;
            color *= (1.0 + audioIntensity * 0.2);

            gl_FragColor = vec4(color, 1.0);
          }
        `
        );

      default:
        return this.generateShaderPattern("flowing_ribbons"); // デフォルト
    }
  }

  private loadCurrentPattern() {
    const currentPattern = ANIMATION_PATTERNS[this.currentPatternIndex];
    const fragmentShader = this.generateShaderPattern(currentPattern);

    this.veda.loadShader([
      {
        fs: fragmentShader,
      },
    ]);

    // パターン名を日本語で表示
    const patternNames: Record<string, string> = {
      heartbeat_pulse: "鼓動パルス",
      rhythmic_breathing: "リズミック呼吸",
      // flowing_ribbons: "流れるリボン",
      tunnel_zoom: "トンネルズーム",
      liquid_metal: "液体金属",
      kaleidoscope: "万華鏡",
      wave_interference: "波の干渉",
      waveform_visualizer: "波形ビジュアライザー",
      particle_field: "パーティクルフィールド",
      organic_growth: "有機的成長",
      crystal_formation: "結晶形成",
      energy_streams: "エネルギーストリーム",
      morphing_grid: "変形グリッド",
      fluid_dynamics: "流体力学",
      neural_network: "ニューラルネットワーク",
    };

    this.debugElements.currentPattern.textContent = `パターン: ${
      patternNames[currentPattern] || currentPattern
    } (${this.currentPatternIndex + 1}/${ANIMATION_PATTERNS.length})`;
    console.log(`Pattern switched to: ${currentPattern}`);
  }

  private checkPatternSwitch() {
    const now = Date.now();
    if (now - this.lastPatternSwitchTime > PATTERN_SWITCH_INTERVAL) {
      // ランダムに次のパターンを選択（現在のパターンは除外）
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * ANIMATION_PATTERNS.length);
      } while (
        nextIndex === this.currentPatternIndex &&
        ANIMATION_PATTERNS.length > 1
      );

      this.currentPatternIndex = nextIndex;
      this.loadCurrentPattern();
      this.lastPatternSwitchTime = now;
    }
  }

  private async autoStartAudio() {
    try {
      this.status.textContent = "自動でマイクアクセス中...";
      await this.startAudio();
    } catch (error) {
      console.log("自動開始失敗、手動操作を待機中:", error);
      this.status.textContent = "クリックしてマイクを許可してください";
    }
  }

  // 直接のオーディオ処理用
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;

  private async startAudio() {
    try {
      this.status.textContent = "オーディオアクセス中...";

      // 直接マイクにアクセス
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1,
        },
      });

      // AudioContextとAnalyserNodeを作成
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // マイクをAnalyserに接続
      this.microphone = this.audioContext.createMediaStreamSource(this.micStream);
      this.microphone.connect(this.analyser);

      // デバッグ情報更新
      const audioTrack = this.micStream.getAudioTracks()[0];
      this.debugElements.audioDevice.textContent = `オーディオデバイス: ${
        audioTrack.label || "デフォルト"
      }`;

      // AudioContextの情報
      this.debugElements.audioContext.textContent = `AudioContext: 直接接続済み`;
      this.debugElements.sampleRate.textContent = `サンプルレート: ${this.audioContext.sampleRate}Hz`;
      this.debugElements.fftSize.textContent = `FFTサイズ: ${this.analyser.fftSize}`;

      // Vedaも並行して起動
      this.veda.play();

      this.isStarted = true;
      this.startBtn.textContent = "停止";
      this.status.textContent = "オーディオリアクティブ実行中";

      // デバッグ情報の定期更新開始
      this.startDebugLoop();
    } catch (error) {
      console.error("Audio initialization failed:", error);
      this.status.textContent = "マイクアクセスが拒否されました";
      this.debugElements.audioDevice.textContent = `オーディオデバイス: アクセス拒否`;
    }
  }

  private startDebugLoop() {
    if (this.debugInterval) {
      clearInterval(this.debugInterval);
    }

    this.debugInterval = setInterval(() => {
      // パターン切り替えチェック
      this.checkPatternSwitch();

      if (this.veda && (this.veda as any).audioLoader) {
        const audioLoader = (this.veda as any).audioLoader;
        if (audioLoader.isEnabled) {
          const volume = audioLoader.getVolume ? audioLoader.getVolume() : 0;
          this.debugElements.volume.textContent = `音量: ${(
            volume * 100
          ).toFixed(1)}%`;

          // BPM表示
          if (USE_MANUAL_BPM) {
            this.debugElements.bpm.textContent = `BPM: ${MANUAL_BPM} (手動設定)`;
          } else {
            const currentTime = Date.now() / 1000;
            this.bpmDetector.updateThreshold(volume);
            const detectedBPM = this.bpmDetector.detectBPM(volume, currentTime);
            if (detectedBPM > 0) {
              this.currentBPM = detectedBPM;
            }
            this.debugElements.bpm.textContent = `BPM: ${
              this.currentBPM || "未検出"
            } (自動検出)`;
          }

          if (audioLoader.ctx) {
            this.debugElements.sampleRate.textContent = `サンプルレート: ${audioLoader.ctx.sampleRate}Hz`;
          }

          if (audioLoader.analyser) {
            this.debugElements.fftSize.textContent = `FFTサイズ: ${audioLoader.analyser.fftSize}`;

            // オシロスコープ描画
            this.drawOscilloscope(audioLoader);
          }
        }
      }

      // 直接接続したマイクからも波形を描画
      if (this.analyser && this.audioContext) {
        this.drawDirectOscilloscope();
        this.drawBackgroundWaveform();
      }
    }, 50); // より高頻度で更新
  }

  private drawOscilloscope(audioLoader: any) {
    const canvas = this.oscilloscope;
    const ctx = this.oscilloscopeCtx;
    const width = canvas.width;
    const height = canvas.height;

    try {
      // 時間領域データ（波形）を取得
      const bufferLength = audioLoader.analyser
        ? audioLoader.analyser.fftSize
        : 2048;
      const dataArray = new Uint8Array(bufferLength);

      if (audioLoader.analyser) {
        audioLoader.analyser.getByteTimeDomainData(dataArray);
      } else {
        // アナライザーがない場合はダミーデータ
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 128 + Math.sin(Date.now() * 0.01 + i * 0.1) * 50;
        }
      }

      // キャンバスをクリア
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(0, 0, width, height);

      // 波形を描画
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00ff41";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // 中央線とグリッド
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // 波形状態をデバッグ表示
      const amplitude = Math.max(...dataArray) - Math.min(...dataArray);
      const isActive = amplitude > 5; // 5以上で信号ありと判定
      this.debugElements.waveform.textContent = `波形: 振幅${amplitude} ${
        isActive ? "✓信号あり" : "✗信号なし"
      } (${bufferLength}samples)`;

      // AudioLoaderの詳細状態
      if (audioLoader.input) {
        this.debugElements.audioContext.textContent = `AudioContext: 接続済み (${
          audioLoader.isEnabled ? "有効" : "無効"
        })`;
      } else {
        this.debugElements.audioContext.textContent = `AudioContext: 未接続`;
      }
    } catch (error) {
      console.log("オシロスコープ描画エラー:", error);
      this.debugElements.waveform.textContent = `波形: エラー - ${error.message}`;
    }
  }

  private drawDirectOscilloscope() {
    if (!this.analyser) return;

    const canvas = this.oscilloscope;
    const ctx = this.oscilloscopeCtx;
    const width = canvas.width;
    const height = canvas.height;

    try {
      // 時間領域データ（波形）を取得
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(dataArray);

      // 音量も計算
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
      }
      const volume = Math.sqrt(sum / bufferLength);

      // キャンバスをクリア
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(0, 0, width, height);

      // 波形を描画
      ctx.lineWidth = 2;
      ctx.strokeStyle = volume > 0.01 ? "#00ff41" : "#ffff00";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // 中央線とグリッド
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // 波形状態をデバッグ表示
      const amplitude = Math.max(...dataArray) - Math.min(...dataArray);
      const isActive = amplitude > 10;
      
      this.debugElements.waveform.textContent = `波形: 振幅${amplitude} 音量${(volume * 100).toFixed(1)}% ${
        isActive ? "✓信号あり" : "✗信号なし"
      }`;
      this.debugElements.volume.textContent = `音量: ${(volume * 100).toFixed(1)}%`;

    } catch (error) {
      console.log("直接オシロスコープ描画エラー:", error);
      this.debugElements.waveform.textContent = `波形: エラー - ${error.message}`;
    }
  }

  private drawBackgroundWaveform() {
    if (!this.analyser) return;

    const canvas = this.waveformCanvas;
    const ctx = this.waveformCtx;
    const width = canvas.width;
    const height = canvas.height;

    // デバッグ用ログ（最初の数回のみ）
    if (Math.random() < 0.01) {
      console.log("Background waveform drawing:", { width, height, canvas: canvas.style.display });
    }

    try {
      // 周波数データと時間領域データの両方を取得
      const freqBufferLength = this.analyser.frequencyBinCount;
      const timeBufferLength = this.analyser.fftSize;
      const freqData = new Uint8Array(freqBufferLength);
      const timeData = new Uint8Array(timeBufferLength);
      
      this.analyser.getByteFrequencyData(freqData);
      this.analyser.getByteTimeDomainData(timeData);

      // キャンバスをクリア（フェード効果）
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      // 1. 中央に大きな波形を描画
      ctx.strokeStyle = "rgba(0, 255, 100, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();

      const centerY = height / 2;
      const waveScale = height * 0.6; // 波形の最大振幅

      for (let i = 0; i < timeBufferLength; i++) {
        const x = (i / timeBufferLength) * width;
        const value = (timeData[i] - 128) / 128; // -1 to 1
        const y = centerY + value * waveScale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 2. 周波数スペクトラムを円形に描画
      ctx.strokeStyle = "rgba(100, 200, 255, 0.8)";
      ctx.lineWidth = 2;
      
      const centerX = width / 2;
      const baseRadius = Math.min(width, height) * 0.15;
      
      ctx.beginPath();
      for (let i = 0; i < freqBufferLength / 4; i++) { // 1/4だけ使用
        const angle = (i / (freqBufferLength / 4)) * Math.PI * 2;
        const amplitude = freqData[i] / 255;
        const radius = baseRadius + amplitude * 80;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // 3. 上下に反復する波形パターン
      ctx.strokeStyle = "rgba(255, 100, 150, 0.5)";
      ctx.lineWidth = 2;
      
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const layerY = (height / 4) * (layer + 1);
        const layerScale = (3 - layer) * 40;
        
        for (let i = 0; i < timeBufferLength / 2; i++) {
          const x = (i / (timeBufferLength / 2)) * width;
          const value = (timeData[i] - 128) / 128;
          const y = layerY + value * layerScale;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

    } catch (error) {
      console.log("背景波形描画エラー:", error);
    }
  }

  private stopAudio() {
    this.veda.stop();
    
    // 直接マイクのリソースをクリーンアップ
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    
    this.isStarted = false;
    this.startBtn.textContent = "オーディオ開始";
    this.status.textContent = "停止中";

    // デバッグ情報の更新停止
    if (this.debugInterval) {
      clearInterval(this.debugInterval);
      this.debugInterval = null;
    }

    // デバッグ情報リセット
    this.debugElements.volume.textContent = "音量: 0%";
    this.debugElements.audioContext.textContent = "AudioContext: 停止";
    this.debugElements.waveform.textContent = "波形: 停止中";
    
    // 背景波形をクリア
    this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
  }
}

// アプリケーション初期化
new VJApp();
