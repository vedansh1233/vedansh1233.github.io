// Portfolio motion layer. Everything here is progressive enhancement:
// without JS, or with reduced motion, or if the CDN scripts fail, the page is fully readable.
;(() => {
  document.getElementById('year').textContent = new Date().getFullYear()

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const root = document.documentElement

  // Marquee: duplicate each track so translateX(-50%) loops seamlessly
  document.querySelectorAll('.marquee-row').forEach((row) => {
    const track = row.querySelector('.marquee-track')
    row.appendChild(track.cloneNode(true))
  })

  if (reduceMotion) return
  root.classList.add('motion')

  // Rotating framed word in the hero (also works without GSAP)
  const word = document.querySelector('.frame-word')
  if (word) {
    const words = word.dataset.words.split('|')
    let i = 0
    setInterval(() => {
      i = (i + 1) % words.length
      word.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-40%)', opacity: 0 }], {
        duration: 220,
        easing: 'ease-in',
      }).onfinish = () => {
        word.textContent = words[i]
        word.animate([{ transform: 'translateY(40%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], {
          duration: 260,
          easing: 'cubic-bezier(.2,.7,.2,1)',
        })
      }
    }, 2200)
  }

  // Hero glow follows the pointer
  const hero = document.querySelector('.hero')
  if (hero && finePointer) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect()
      hero.style.setProperty('--gx', `${e.clientX - r.left}px`)
      hero.style.setProperty('--gy', `${e.clientY - r.top}px`)
    })
  }

  // Card spotlight
  document.querySelectorAll('.card, .stats > div').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    })
  })

  // Subtle 3D tilt on screenshots
  if (finePointer) {
    document.querySelectorAll('.shot img').forEach((img) => {
      img.addEventListener('pointermove', (e) => {
        const r = img.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        img.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) scale(1.015)`
      })
      img.addEventListener('pointerleave', () => (img.style.transform = ''))
    })
  }

  // Custom cursor + magnetic buttons (mouse/trackpad only)
  if (finePointer) {
    root.classList.add('has-cursor')
    const cursor = document.querySelector('.cursor')
    const dot = cursor.querySelector('.cursor-dot')
    const ring = cursor.querySelector('.cursor-ring')
    let mx = -100, my = -100, rx = -100, ry = -100
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX
      my = e.clientY
      dot.style.transform = `translate(${mx}px, ${my}px)`
      cursor.classList.toggle('is-link', !!e.target.closest('a, button'))
      cursor.classList.remove('is-hidden')
    })
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'))
    const follow = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      ring.style.transform = `translate(${rx}px, ${ry}px)`
      requestAnimationFrame(follow)
    }
    follow()

    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect()
        const x = e.clientX - r.left - r.width / 2
        const y = e.clientY - r.top - r.height / 2
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`
      })
      btn.addEventListener('pointerleave', () => (btn.style.transform = ''))
    })
  }

  // Everything below needs GSAP; bail out quietly if the CDN failed
  const { gsap, ScrollTrigger, Lenis } = window
  if (!gsap || !ScrollTrigger) return
  gsap.registerPlugin(ScrollTrigger)

  // Inertial smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync
  if (Lenis) {
    const lenis = new Lenis({ lerp: 0.1 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href')
        const target = id === '#top' ? 0 : document.querySelector(id)
        if (target === null) return
        e.preventDefault()
        lenis.scrollTo(target, { offset: -72, duration: 1.2 })
        if (id !== '#top') history.replaceState(null, '', id)
      })
    })
  }

  // Scroll progress bar
  gsap.to('.progress span', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  })

  // Hero intro: split the name into letters that rise into place
  const h1 = document.querySelector('[data-split]')
  if (h1) {
    const text = h1.textContent.trim()
    h1.setAttribute('aria-label', text)
    h1.innerHTML = text
      .split(' ')
      .map(
        (w) =>
          `<span class="line" aria-hidden="true">${[...w].map((c) => `<span class="char">${c}</span>`).join('')}</span>`,
      )
      .join(' ')
  }

  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
  intro
    .from('.hero .status', { y: 16, opacity: 0, duration: 0.6 })
    .from('[data-split] .char', { yPercent: 115, duration: 0.9, stagger: 0.03 }, '-=0.3')
    .from('.hero .role, .hero .lede', { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.6')
    .from('.hero .actions .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
    .from('.hero .stack-pills li', { y: 12, opacity: 0, duration: 0.5, stagger: 0.04 }, '-=0.4')
    .from('.portrait', { scale: 0.85, opacity: 0, rotate: -6, duration: 1.1, ease: 'expo.out' }, 0.2)

  // Portrait drifts up slower than the page
  gsap.to('.portrait', {
    yPercent: -18,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  })

  // Marquee rows slide sideways with scroll, on top of their constant drift
  gsap.utils.toArray('.marquee-track').forEach((track, i) => {
    const dir = track.closest('.reverse') ? 1 : -1
    gsap.fromTo(
      track,
      { x: 0 },
      {
        x: dir * 120,
        ease: 'none',
        scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
  })

  // Section headings and cards reveal as they enter
  gsap.utils.toArray('.section-head, .card, .stats, .project-links, .col-title, .timeline > li, .plain').forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
  })

  // Tags pop in one after another
  gsap.utils.toArray('.tags').forEach((list) => {
    gsap.from(list.children, {
      scale: 0.6,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(2)',
      stagger: 0.04,
      scrollTrigger: { trigger: list, start: 'top 90%', once: true },
    })
  })

  // Main screenshot grows from a framed card to full width as it scrolls in
  gsap.fromTo(
    '.shot-main',
    { scale: 0.86, rotateX: 14, transformPerspective: 1200, transformOrigin: '50% 0%' },
    {
      scale: 1,
      rotateX: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.shot-main', start: 'top 95%', end: 'top 25%', scrub: 0.6 },
    },
  )

  // Secondary screenshots: gentle opposing parallax
  gsap.utils.toArray('.shots-row .shot').forEach((shot, i) => {
    gsap.fromTo(
      shot,
      { y: i % 2 ? 90 : 40 },
      {
        y: i % 2 ? -10 : 0,
        ease: 'none',
        scrollTrigger: { trigger: '.shots-row', start: 'top bottom', end: 'bottom 40%', scrub: true },
      },
    )
  })

  // Stats count up
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count)
    const obj = { v: end === 0 ? 100 : 0 }
    gsap.to(obj, {
      v: end,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = Math.round(obj.v)),
    })
  })

  // Timeline accent line draws as you scroll through it
  gsap.utils.toArray('.timeline').forEach((tl) => {
    gsap.fromTo(
      tl,
      { '--draw': 0 },
      {
        '--draw': 1,
        ease: 'none',
        scrollTrigger: { trigger: tl, start: 'top 75%', end: 'bottom 60%', scrub: true },
      },
    )
  })

  // Contact card scales up into view
  gsap.from('.contact', {
    scale: 0.94,
    borderRadius: 40,
    ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 55%', scrub: true },
  })

  // Re-measure once images have loaded so trigger positions are accurate
  window.addEventListener('load', () => ScrollTrigger.refresh())
})()
