/**
 * 世界烈酒图鉴 v5 - 背景粒子系统模块
 * 职责：Canvas 粒子动画，琥珀色光点装饰
 */

class ParticleSystem {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 默认配置
    this.config = {
      count: 80,
      speed: { min: 0.3, max: 0.8 },
      size: { min: 1, max: 3 },
      opacity: { min: 0.3, max: 0.7 },
      color: '#c6a15b',
      glow: true,
      glowIntensity: 0.4,
      drift: { x: 0.5, y: -0.3 },
      twinkle: true
    };

    // 合并自定义配置
    Object.assign(this.config, config);

    // 粒子数组
    this.particles = [];
    
    // 动画状态
    this.isRunning = false;
    this.animationId = null;
    this.intensity = 1;

    // 初始化
    this.init();
  }

  // 初始化画布尺寸
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  // 调整画布尺寸
  resize() {
    if (!this.canvas) return;
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // 重新创建粒子
    if (this.particles.length > 0) {
      this.createParticles();
    }
  }

  // 生成随机数
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // 创建单个粒子
  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: this.random(this.config.size.min, this.config.size.max),
      speedX: this.random(this.config.speed.min, this.config.speed.max) * this.config.drift.x,
      speedY: this.random(this.config.speed.min, this.config.speed.max) * this.config.drift.y,
      opacity: this.random(this.config.opacity.min, this.config.opacity.max),
      targetOpacity: this.random(this.config.opacity.min, this.config.opacity.max),
      twinkleSpeed: this.random(0.01, 0.03),
      phase: Math.random() * Math.PI * 2
    };
  }

  // 创建所有粒子
  createParticles() {
    this.particles = [];
    const count = Math.round(this.config.count * this.intensity);
    
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  // 更新粒子状态
  updateParticle(particle) {
    // 移动
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    // 边界检测（环绕）
    if (particle.x < 0) particle.x = this.canvas.width;
    if (particle.x > this.canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = this.canvas.height;
    if (particle.y > this.canvas.height) particle.y = 0;

    // 闪烁效果
    if (this.config.twinkle) {
      particle.phase += particle.twinkleSpeed;
      particle.opacity = this.config.opacity.min + 
        (Math.sin(particle.phase) + 1) / 2 * (this.config.opacity.max - this.config.opacity.min);
      particle.opacity *= this.intensity;
    }
  }

  // 绘制单个粒子
  drawParticle(particle) {
    const { ctx, config } = this;
    
    // 设置透明度
    ctx.globalAlpha = particle.opacity;

    if (config.glow) {
      // 绘制发光效果
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      
      gradient.addColorStop(0, config.color);
      gradient.addColorStop(0.3, this.adjustColorOpacity(config.color, config.glowIntensity));
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 绘制核心点
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
    } else {
      // 绘制普通圆点
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
    }

    // 重置透明度
    ctx.globalAlpha = 1;
  }

  // 调整颜色透明度
  adjustColorOpacity(color, opacity) {
    // 将 hex 颜色转换为 rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // 清空画布
  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // 动画循环
  animate() {
    if (!this.isRunning) return;

    this.clear();

    // 更新和绘制所有粒子
    for (const particle of this.particles) {
      this.updateParticle(particle);
      this.drawParticle(particle);
    }

    // 继续动画循环
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  // 开始动画
  start() {
    if (this.isRunning) return;
    
    if (this.particles.length === 0) {
      this.createParticles();
    }

    this.isRunning = true;
    this.animate();
  }

  // 停止动画
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // 暂停动画
  pause() {
    this.stop();
  }

  // 恢复动画
  resume() {
    if (!this.isRunning) {
      this.start();
    }
  }

  // 销毁
  destroy() {
    this.stop();
    this.particles = [];
    window.removeEventListener('resize', this.resize);
  }

  // 设置粒子密度
  setIntensity(level) {
    // level: 0-1
    this.intensity = Math.max(0, Math.min(1, level));
    this.createParticles();
  }

  // 更新配置
  setConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.createParticles();
  }

  // 获取当前粒子数量
  getParticleCount() {
    return this.particles.length;
  }
}

// 创建默认粒子系统实例的工厂函数
const createParticleSystem = (canvas, config) => {
  return new ParticleSystem(canvas, config);
};

// ES Module 导出
export default ParticleSystem;
export {
  ParticleSystem,
  createParticleSystem
};