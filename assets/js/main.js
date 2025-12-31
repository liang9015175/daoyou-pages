/**
 * Daoyou - AI Coach for Dota2
 * Main JavaScript
 *
 * 功能模块:
 * - i18n 国际化系统 (支持中英文切换)
 * - 粒子特效系统
 * - 滚动动画效果
 * - 导航交互
 * - 移动端菜单
 */

// ============================================
// i18n 国际化系统
// ============================================
const i18n = (function() {
  'use strict';

  // 默认语言
  let currentLang = 'zh'; // 'zh' 中文, 'en' 英文

  // 语言数据缓存
  const translations = {};

  /**
   * 加载语言文件
   * @param {string} lang - 语言代码
   * @returns {Promise}
   */
  function loadLanguage(lang) {
    // 如果已经加载过，直接返回
    if (translations[lang]) {
      return Promise.resolve(translations[lang]);
    }

    // 获取根目录路径（处理 pages/ 子目录的情况）
    const rootPath = getRootPath();

    return Promise.all([
      fetch(rootPath + `locales/${lang}/common.json`).then(r => r.json()),
      fetch(rootPath + `locales/${lang}/home.json`).then(r => r.json()),
      fetch(rootPath + `locales/${lang}/features.json`).then(r => r.json()),
      fetch(rootPath + `locales/${lang}/aigc.json`).then(r => r.json()),
      fetch(rootPath + `locales/${lang}/community.json`).then(r => r.json()),
      fetch(rootPath + `locales/${lang}/pricing.json`).then(r => r.json()),
      fetch(rootPath + `locales/${lang}/about.json`).then(r => r.json())
    ]).then(([common, home, features, aigc, community, pricing, about]) => {
      translations[lang] = { common, home, features, aigc, community, pricing, about };
      console.log('Language files loaded for:', lang);
      return translations[lang];
    }).catch(err => {
      console.error('Failed to load language file:', err);
      return translations[currentLang] || {};
    });
  }

  /**
   * 获取根目录路径
   * @returns {string}
   */
  function getRootPath() {
    const path = window.location.pathname;
    // 如果在 pages/ 目录下，需要返回上一级
    if (path.includes('/pages/')) {
      return '../';
    }
    return '';
  }

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键，支持点号分隔的嵌套路径，如 'home.hero.title'
   * @param {string} page - 页面名称，默认为当前页面
   * @returns {string}
   */
  function t(key, page = getCurrentPage()) {
    const data = translations[currentLang];
    if (!data) return key;

    // 解析嵌套路径
    const keys = key.split('.');

    // 先从指定的页面中查找
    let value = getNestedValue(data[page], keys);

    // 如果在页面中找不到，从 common 中查找
    if (value === undefined && data.common) {
      value = getNestedValue(data.common, keys);
    }

    return value !== undefined ? value : key;
  }

  /**
   * 从嵌套对象中获取值
   * @param {object} obj - 要查找的对象
   * @param {array} keys - 键路径数组
   * @returns {any|undefined}
   */
  function getNestedValue(obj, keys) {
    if (!obj || typeof obj !== 'object') return undefined;

    let value = obj;
    for (let i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object' && keys[i] in value) {
        value = value[keys[i]];
      } else {
        return undefined;
      }
    }
    return value;
  }

  /**
   * 获取当前页面名称
   * @returns {string}
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('features')) return 'features';
    if (path.includes('aigc')) return 'aigc';
    if (path.includes('community')) return 'community';
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('about')) return 'about';
    return 'home';
  }

  /**
   * 更新页面上的所有翻译文本
   */
  function updatePageTranslations() {
    // 更新带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const page = el.getAttribute('data-i18n-page') || getCurrentPage();
      const translation = t(key, page);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    });

    // 更新带有 data-i18n-attr 属性的元素（用于翻译属性值）
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const attrConfig = el.getAttribute('data-i18n-attr');
      const [attr, key] = attrConfig.split(':');
      const page = el.getAttribute('data-i18n-page') || getCurrentPage();
      el.setAttribute(attr, t(key, page));
    });

    // 更新语言切换按钮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });

    // 更新 HTML lang 属性
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  }

  /**
   * 切换语言
   * @param {string} lang - 语言代码
   * @returns {Promise}
   */
  function setLanguage(lang) {
    if (lang === currentLang) return Promise.resolve();

    currentLang = lang;

    // 保存到 localStorage
    try {
      localStorage.setItem('daoyou-lang', lang);
    } catch (e) {}

    return loadLanguage(lang).then(() => {
      updatePageTranslations();
      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    });
  }

  /**
   * 获取当前语言
   * @returns {string}
   */
  function getLanguage() {
    return currentLang;
  }

  /**
   * 初始化 i18n 系统
   */
  function init() {
    // 从 localStorage 读取保存的语言偏好，或从浏览器语言检测
    const savedLang = localStorage.getItem('daoyou-lang');
    const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
    currentLang = savedLang || browserLang;

    // 加载语言文件并更新页面
    loadLanguage(currentLang).then(() => {
      updatePageTranslations();
      document.body.classList.add('i18n-loaded');
    });
  }

  return {
    init,
    t,
    setLanguage,
    getLanguage,
    loadLanguage,
    updatePageTranslations
  };
})();

// ============================================
// 粒子特效系统
// ============================================
const particles = (function() {
  'use strict';

  let canvas, ctx;
  let particlesArray = [];
  let animationId;

  // 粒子配置
  const config = {
    count: 80,           // 粒子数量
    size: 2,             // 粒子大小
    speed: 0.5,          // 移动速度
    opacity: 0.5,        // 透明度
    connectionDistance: 150, // 连线距离
    colors: ['#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4'] // 粒子颜色
  };

  /**
   * 粒子类
   */
  class Particle {
    constructor(x, y) {
      this.x = x || Math.random() * canvas.width;
      this.y = y || Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * config.speed;
      this.vy = (Math.random() - 0.5) * config.speed;
      this.size = Math.random() * config.size + 1;
      this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
      this.opacity = Math.random() * config.opacity + 0.1;
      this.pulse = Math.random() * 0.02;
      this.pulseDir = 1;
    }

    update() {
      // 移动
      this.x += this.vx;
      this.y += this.vy;

      // 脉冲效果
      this.opacity += this.pulse * this.pulseDir;
      if (this.opacity >= config.opacity || this.opacity <= 0.1) {
        this.pulseDir *= -1;
      }

      // 边界检测
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /**
   * 初始化画布
   */
  function initCanvas() {
    canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resizeCanvas();

    // 创建粒子
    particlesArray = [];
    for (let i = 0; i < config.count; i++) {
      particlesArray.push(new Particle());
    }
  }

  /**
   * 调整画布大小
   */
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /**
   * 绘制粒子连线
   */
  function drawConnections() {
    for (let i = 0; i < particlesArray.length; i++) {
      for (let j = i + 1; j < particlesArray.length; j++) {
        const dx = particlesArray[i].x - particlesArray[j].x;
        const dy = particlesArray[i].y - particlesArray[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.connectionDistance) {
          const opacity = (1 - distance / config.connectionDistance) * 0.2;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
          ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
          ctx.stroke();
        }
      }
    }
  }

  /**
   * 动画循环
   */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesArray.forEach(particle => {
      particle.update();
      particle.draw();
    });

    drawConnections();

    animationId = requestAnimationFrame(animate);
  }

  /**
   * 鼠标交互 - 添加新粒子
   */
  function addParticle(x, y) {
    particlesArray.push(new Particle(x, y));
    // 限制最大粒子数
    if (particlesArray.length > config.count * 2) {
      particlesArray.shift();
    }
  }

  /**
   * 启动粒子系统
   */
  function start() {
    initCanvas();
    if (canvas) {
      animate();
    }
  }

  /**
   * 停止粒子系统
   */
  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  /**
   * 重新启动（用于窗口调整大小后）
   */
  function restart() {
    stop();
    start();
  }

  return {
    start,
    stop,
    restart,
    addParticle
  };
})();

// ============================================
// 滚动动画系统
// ============================================
const scrollReveal = (function() {
  'use strict';

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  let observer;

  /**
   * 处理元素进入视口
   */
  function handleIntersection(entries) {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // 添加延迟以实现交错动画效果
        setTimeout(() => {
          entry.target.classList.add('active');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }

  /**
   * 初始化观察器
   */
  function init() {
    // 检查浏览器支持
    if (!('IntersectionObserver' in window)) {
      // 不支持则直接显示所有元素
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('active');
      });
      return;
    }

    observer = new IntersectionObserver(handleIntersection, observerOptions);

    // 观察所有带有 reveal 类的元素
    document.querySelectorAll('.reveal').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * 刷新观察器
   */
  function refresh() {
    if (observer) {
      document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
      });
    }
  }

  return {
    init,
    refresh
  };
})();

// ============================================
// 导航系统
// ============================================
const navigation = (function() {
  'use strict';

  let header;
  let lastScrollY = 0;

  /**
   * 处理滚动事件
   */
  function handleScroll() {
    const scrollY = window.scrollY;

    // 添加/移除 scrolled 类
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
  }

  /**
   * 更新当前页面的导航链接状态
   */
  function updateActiveLink() {
    const currentPage = window.location.pathname.replace(/\/$/, '').split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html') || (currentPage === 'index.html' && href === '.')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * 平滑滚动到锚点
   */
  function smoothScrollToAnchor(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerHeight = header.offsetHeight;
        const targetPosition = target.offsetTop - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  /**
   * 初始化导航
   */
  function init() {
    header = document.querySelector('.header');
    if (!header) return;

    // 监听滚动
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始检查

    // 更新当前链接
    updateActiveLink();

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', smoothScrollToAnchor);
    });
  }

  return {
    init
  };
})();

// ============================================
// 移动端菜单
// ============================================
const mobileMenu = (function() {
  'use strict';

  let menuBtn;
  let menu;
  let overlay;

  /**
   * 切换菜单
   */
  function toggle() {
    menuBtn.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  }

  /**
   * 关闭菜单
   */
  function close() {
    menuBtn.classList.remove('active');
    menu.classList.remove('active');
    document.body.classList.remove('menu-open');
  }

  /**
   * 初始化移动端菜单
   */
  function init() {
    menuBtn = document.querySelector('.mobile-menu-btn');
    menu = document.querySelector('.mobile-menu');

    if (!menuBtn || !menu) return;

    // 点击按钮切换菜单
    menuBtn.addEventListener('click', toggle);

    // 点击菜单链接后关闭菜单
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', close);
    });

    // 点击菜单外部关闭
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
        close();
      }
    });
  }

  return {
    init,
    toggle,
    close
  };
})();

// ============================================
// 语言切换器
// ============================================
const langSwitcher = (function() {
  'use strict';

  /**
   * 初始化语言切换器
   */
  function init() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        i18n.setLanguage(lang);
      });
    });
  }

  return {
    init
  };
})();

// ============================================
// 表单处理
// ============================================
const forms = (function() {
  'use strict';

  /**
   * 处理表单提交
   */
  function handleSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;

    // 显示加载状态
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span>';

    // 模拟提交（实际项目中替换为真实的 API 调用）
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.t('common.subscribe', 'common') || 'Subscribe';
      form.reset();
      // 显示成功消息
      alert('Thank you for subscribing!');
    }, 1500);
  }

  /**
   * 初始化表单
   */
  function init() {
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', handleSubmit);
    });
  }

  return {
    init
  };
})();

// ============================================
// 加载屏幕
// ============================================
const loadingScreen = (function() {
  'use strict';

  let screen;

  /**
   * 隐藏加载屏幕
   */
  function hide() {
    if (!screen) return;
    screen.classList.add('loaded');
    // 动画结束后从 DOM 中移除
    setTimeout(() => {
      if (screen && screen.parentNode) {
        screen.parentNode.removeChild(screen);
      }
    }, 500);
  }

  /**
   * 创建加载屏幕
   */
  function create() {
    // 检查是否已存在
    if (document.querySelector('.loading-screen')) {
      screen = document.querySelector('.loading-screen');
      return;
    }

    screen = document.createElement('div');
    screen.className = 'loading-screen';
    screen.innerHTML = `
      <div class="loading-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="loading-text">Daoyou</div>
      <div class="loading-bar">
        <div class="loading-bar-progress"></div>
      </div>
    `;

    document.body.appendChild(screen);
  }

  /**
   * 初始化加载屏幕
   */
  function init() {
    create();
    // 页面加载完成后隐藏
    window.addEventListener('load', () => {
      setTimeout(hide, 500);
    });
  }

  return {
    init,
    hide
  };
})();

// ============================================
// 回到顶部按钮
// ============================================
const backToTop = (function() {
  'use strict';

  let button;
  let scrollThreshold = 300;

  /**
   * 切换按钮显示状态
   */
  function toggleVisibility() {
    const scrollY = window.scrollY;
    if (scrollY > scrollThreshold) {
      button.classList.add('visible');
    } else {
      button.classList.remove('visible');
    }
  }

  /**
   * 滚动到顶部
   */
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * 创建按钮
   */
  function create() {
    // 检查是否已存在
    if (document.querySelector('.back-to-top')) {
      button = document.querySelector('.back-to-top');
      return;
    }

    button = document.createElement('button');
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"/>
        <polyline points="18 9 12 3 6 9" style="display: none;"/>
      </svg>
    `;

    document.body.appendChild(button);
  }

  /**
   * 初始化
   */
  function init() {
    create();
    window.addEventListener('scroll', utils.throttle(toggleVisibility, 100));
    button.addEventListener('click', scrollToTop);
  }

  return {
    init
  };
})();

// ============================================
// 工具函数
// ============================================
const utils = {
  /**
   * 节流函数
   */
  throttle(func, wait) {
    let timeout;
    let previous = 0;
    return function(...args) {
      const now = Date.now();
      const remaining = wait - (now - previous);
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          previous = Date.now();
          timeout = null;
          func.apply(this, args);
        }, remaining);
      }
    };
  },

  /**
   * 防抖函数
   */
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * 检测元素是否在视口中
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

// ============================================
// 应用初始化
// ============================================
const app = {
  /**
   * 初始化所有模块
   */
  init() {
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  },

  /**
   * 启动应用
   */
  start() {
    // 初始化各个模块
    // loadingScreen.init();  // 已禁用加载屏幕
    i18n.init();
    particles.start();
    scrollReveal.init();
    navigation.init();
    mobileMenu.init();
    langSwitcher.init();
    forms.init();
    backToTop.init();  // 初始化回到顶部按钮

    // 窗口大小调整处理
    window.addEventListener('resize', utils.throttle(() => {
      particles.restart();
    }, 200));

    // 页面加载完成处理
    window.addEventListener('load', () => {
      document.body.classList.add('loaded');
    });

    console.log('Daoyou App Initialized');
  }
};

// 导出模块（用于其他页面）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n, particles, scrollReveal, navigation, mobileMenu };
}

// 启动应用
app.init();
