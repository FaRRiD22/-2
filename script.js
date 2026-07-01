(() => {
  const body = document.body;
  const header = document.querySelector('[data-elevate]');
  const menuButton = document.querySelector('.menu-button');
  const searchButton = document.querySelector('.search-button');
  const closeSearchButton = document.querySelector('.close-search');
  const searchModal = document.querySelector('.search-modal');
  const searchInput = document.querySelector('.search-dialog input');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  if (menuButton) {
    menuButton.addEventListener('click', () => {
      const isOpen = body.classList.toggle('nav-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-open');
      if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    });
  });

  const openSearch = () => {
    body.classList.add('search-open');
    if (searchModal) searchModal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => searchInput && searchInput.focus(), 80);
  };

  const closeSearch = () => {
    body.classList.remove('search-open');
    if (searchModal) searchModal.setAttribute('aria-hidden', 'true');
  };

  if (searchButton) searchButton.addEventListener('click', openSearch);
  if (closeSearchButton) closeSearchButton.addEventListener('click', closeSearch);
  if (searchModal) {
    searchModal.addEventListener('click', (event) => {
      if (event.target === searchModal) closeSearch();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      body.classList.remove('nav-open');
      if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    }
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = String(Math.min(index % 4, 3) * 70) + 'ms';
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (reducedMotion) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = 'perspective(900px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 7).toFixed(2) + 'deg) translateY(-4px)';
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  const canvas = document.getElementById('medScene');
  const ctx = canvas && canvas.getContext('2d');
  if (!canvas || !ctx) return;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;

  const helixA = [];
  const helixB = [];
  for (let i = 0; i < 76; i += 1) {
    const t = i * 0.32;
    const y = (i - 38) * 6.4;
    helixA.push({ x: Math.cos(t) * 110, y: y, z: Math.sin(t) * 110, color: '#9de5dd' });
    helixB.push({ x: Math.cos(t + Math.PI) * 110, y: y, z: Math.sin(t + Math.PI) * 110, color: '#ff9aa1' });
  }

  const molecule = [
    { x: -190, y: -120, z: -40, color: '#35a85a' },
    { x: -88, y: -58, z: 62, color: '#00a9c8' },
    { x: -12, y: -145, z: 118, color: '#f3b83f' },
    { x: 72, y: -38, z: -72, color: '#e63f46' },
    { x: 178, y: -112, z: 36, color: '#9de5dd' },
    { x: 122, y: 40, z: 116, color: '#00a9c8' },
    { x: 20, y: 102, z: -104, color: '#35a85a' },
    { x: -120, y: 82, z: 18, color: '#f3b83f' }
  ];

  const moleculeLinks = [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6], [6, 7], [7, 1]];

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const rotate = (point, angle, scale) => {
    const ay = angle + pointerX * 0.32;
    const ax = -0.23 + pointerY * 0.18;
    const cy = Math.cos(ay);
    const sy = Math.sin(ay);
    const cx = Math.cos(ax);
    const sx = Math.sin(ax);
    const px = point.x * scale;
    const py = point.y * scale;
    const pz = point.z * scale;
    const x1 = px * cy - pz * sy;
    const z1 = px * sy + pz * cy;
    const y1 = py * cx - z1 * sx;
    const z2 = py * sx + z1 * cx;
    return { x: x1, y: y1, z: z2, color: point.color };
  };

  const project = (point, centerX, centerY) => {
    const perspective = 620;
    const depth = perspective / (perspective + point.z + 190);
    return {
      x: centerX + point.x * depth,
      y: centerY + point.y * depth,
      size: depth,
      z: point.z,
      color: point.color
    };
  };

  const line = (a, b, color, opacity, lineWidth) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const dot = (point, radius, color) => {
    const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 4);
    glow.addColorStop(0, color);
    glow.addColorStop(0.38, color + '88');
    glow.addColorStop(1, color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const crossPath = (x, y, size) => {
    const a = size;
    const b = size * 0.38;
    ctx.beginPath();
    ctx.moveTo(x - b, y - a);
    ctx.lineTo(x + b, y - a);
    ctx.lineTo(x + b, y - b);
    ctx.lineTo(x + a, y - b);
    ctx.lineTo(x + a, y + b);
    ctx.lineTo(x + b, y + b);
    ctx.lineTo(x + b, y + a);
    ctx.lineTo(x - b, y + a);
    ctx.lineTo(x - b, y + b);
    ctx.lineTo(x - a, y + b);
    ctx.lineTo(x - a, y - b);
    ctx.lineTo(x - b, y - b);
    ctx.closePath();
  };

  const drawCross = (centerX, centerY, time, scale) => {
    const size = 34 * scale;
    const wobble = Math.sin(time * 1.4) * 7;
    for (let i = 9; i >= 1; i -= 1) {
      crossPath(centerX + i * 2.1, centerY + wobble - i * 1.3, size);
      ctx.fillStyle = 'rgba(90, 16, 24, 0.13)';
      ctx.fill();
    }
    crossPath(centerX, centerY + wobble, size);
    ctx.fillStyle = '#e63f46';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.stroke();
  };

  const draw = () => {
    frame += reducedMotion ? 0 : 1;
    const time = frame / 60;
    const scale = Math.max(0.62, Math.min(width, height) / 660);
    const centerX = width * 0.53;
    const centerY = height * 0.52;
    const angle = reducedMotion ? 0.45 : time * 0.38;

    ctx.clearRect(0, 0, width, height);

    const ringAlpha = 0.2 + Math.sin(time) * 0.04;
    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle = '#9de5dd';
    ctx.lineWidth = 1;
    for (let r = 82; r <= 280; r += 66) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, r * scale, r * 0.34 * scale, angle * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const strandA = helixA.map((point) => project(rotate(point, angle, scale), centerX, centerY));
    const strandB = helixB.map((point) => project(rotate(point, angle, scale), centerX, centerY));

    for (let i = 0; i < strandA.length - 1; i += 1) {
      const opacity = 0.2 + Math.max(strandA[i].size, strandB[i].size) * 0.34;
      line(strandA[i], strandA[i + 1], '#9de5dd', opacity, 2.2 * strandA[i].size);
      line(strandB[i], strandB[i + 1], '#ff9aa1', opacity, 2.2 * strandB[i].size);
      if (i % 5 === 0) line(strandA[i], strandB[i], '#ffffff', 0.22, 1.2);
    }

    const allDots = strandA.concat(strandB).sort((a, b) => a.z - b.z);
    allDots.forEach((point, index) => {
      if (index % 2 === 0) dot(point, Math.max(2.2, 4.2 * point.size), point.color);
    });

    const molProjected = molecule.map((point) => project(rotate(point, -angle * 0.72, scale * 0.86), centerX + 36 * scale, centerY + 12 * scale));
    moleculeLinks.forEach((pair) => {
      line(molProjected[pair[0]], molProjected[pair[1]], '#ffffff', 0.28, 1.4);
    });
    molProjected.sort((a, b) => a.z - b.z).forEach((point) => {
      dot(point, Math.max(4, 7 * point.size), point.color);
    });

    drawCross(centerX - 130 * scale, centerY - 72 * scale, time, scale);

    if (!reducedMotion) window.requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
    pointerY = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
  }, { passive: true });
  draw();
})();