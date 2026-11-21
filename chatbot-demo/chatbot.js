/*
 * FAQ chatbot widget (demo). Answers from a small FAQ list using keyword matching,
 * and sends visitors to the full FAQ page when it can't find an answer.
 * In a real WordPress setup the same behaviour comes from a plugin such as AI Engine.
 */
(() => {
  const CONFIG = {
    botName: 'Brew Assistant',
    welcome: "Hi there! 👋 I'm the Brew & Bean assistant. Ask me about opening hours, delivery, menu, bookings or payments.",
    faqUrl: 'faq.html',
    fallback: "I'm not sure about that one. You'll find more answers on our full FAQ page:",
    suggestions: ['Opening hours?', 'Do you deliver?', 'Vegan options?', 'Book a table'],
  };

  const FAQ = [
    { q: 'What are your opening hours?', a: "We're open Monday to Saturday, 8 am to 10 pm, and Sunday 9 am to 6 pm.",
      k: ['open', 'opening', 'hour', 'time', 'close', 'closing', 'timing', 'sunday', 'today', 'when'] },
    { q: 'Do you deliver?', a: 'Yes! We deliver within 5 km through our website and on Swiggy and Zomato. Orders usually arrive in 30–40 minutes.',
      k: ['deliver', 'delivery', 'home', 'swiggy', 'zomato', 'order', 'online', 'ship'] },
    { q: 'Do you have vegan or gluten-free options?', a: 'We do: oat and almond milk at no extra cost, vegan banana bread, and gluten-free brownies. Look for the 🌱 and GF marks on the menu.',
      k: ['vegan', 'vegetarian', 'gluten', 'dairy', 'milk', 'oat', 'almond', 'allergy', 'allergen', 'diet', 'veg'] },
    { q: 'Can I book a table?', a: 'Yes, call us on +91 90000 00000 or use the "Book a table" button at the top of the page. Groups of 8+ please book a day ahead.',
      k: ['book', 'booking', 'reserve', 'reservation', 'table', 'seat', 'group', 'party'] },
    { q: 'Which payment methods do you accept?', a: 'Cash, all major cards, and UPI (Google Pay, PhonePe, Paytm).',
      k: ['pay', 'payment', 'card', 'cash', 'upi', 'gpay', 'phonepe', 'paytm', 'credit', 'debit'] },
    { q: 'Where are you located?', a: "We're at 12 MG Road, near Central Park. Free parking is available behind the café.",
      k: ['where', 'location', 'locate', 'address', 'parking', 'park', 'direction', 'find', 'reach'] },
    { q: 'Do you have Wi-Fi?', a: 'Yes, free high-speed Wi-Fi. Ask the staff for the password, and charging points are at every window table.',
      k: ['wifi', 'internet', 'work', 'laptop', 'charging', 'charge', 'plug', 'password'] },
    { q: 'Do you cater events?', a: 'We cater office meetings and small events (10–100 people). Email events@brewandbean.example with your date and headcount.',
      k: ['cater', 'catering', 'event', 'office', 'meeting', 'bulk', 'birthday'] },
  ];

  const STOP = new Set('a an the is are do does you your we our i me my can to of for in on at and or it be have has with what which how any there this that please hi hello'.split(' '));
  const stem = (w) => w.replace(/(ings?|ed|es|s)$/, '') || w;
  const tokens = (text) => text.toLowerCase().replace(/wi-?fi/g, 'wifi').split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)).map(stem);

  const INDEX = FAQ.map((item) => ({ item, words: new Set([...tokens(item.q), ...item.k.map(stem)]) }));

  function answer(text) {
    const words = tokens(text);
    if (/^(hi|hello|hey|namaste)\b/i.test(text.trim()) && words.length === 0) {
      return { text: 'Hello! What would you like to know?' };
    }
    if (/\b(thanks?|thank you|thx)\b/i.test(text)) return { text: "You're welcome! Anything else I can help with?" };
    let best = null;
    let bestScore = 0;
    for (const entry of INDEX) {
      const score = words.filter((w) => entry.words.has(w)).length;
      if (score > bestScore) { best = entry.item; bestScore = score; }
    }
    return bestScore > 0 ? { text: best.a } : { text: CONFIG.fallback, link: true };
  }

  // ---- UI ----
  const root = document.createElement('div');
  root.className = 'cb';
  root.innerHTML = `
    <section class="cb-panel" role="dialog" aria-label="Chat with ${CONFIG.botName}" hidden>
      <header class="cb-head">
        <span class="cb-avatar" aria-hidden="true">☕</span>
        <div><b>${CONFIG.botName}</b><small><span class="cb-online"></span>Usually replies instantly</small></div>
        <button class="cb-close" aria-label="Close chat">✕</button>
      </header>
      <div class="cb-log" aria-live="polite"></div>
      <div class="cb-chips"></div>
      <form class="cb-form">
        <input class="cb-input" placeholder="Type your question…" aria-label="Your message" autocomplete="off" maxlength="300">
        <button class="cb-send" aria-label="Send">➤</button>
      </form>
      <p class="cb-foot">Answers come from our FAQ</p>
    </section>
    <button class="cb-bubble" aria-label="Open chat" aria-expanded="false">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.9 2 11.7c0 2.4 1.1 4.6 3 6.2L4 22l4.6-2.3c1.1.3 2.2.5 3.4.5 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>
      <span class="cb-badge">1</span>
    </button>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const panel = $('.cb-panel');
  const bubble = $('.cb-bubble');
  const log = $('.cb-log');
  const input = $('.cb-input');
  let started = false;

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function add(who, text, link) {
    const msg = document.createElement('div');
    msg.className = 'cb-msg cb-' + who;
    msg.innerHTML = esc(text) + (link ? ` <a href="${CONFIG.faqUrl}">View the full FAQ →</a>` : '');
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  function botReply(text) {
    const typing = document.createElement('div');
    typing.className = 'cb-msg cb-bot cb-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;
    const reply = answer(text);
    setTimeout(() => { typing.remove(); add('bot', reply.text, reply.link); }, 650);
  }

  function ask(text) {
    if (!text.trim()) return;
    add('user', text.trim());
    botReply(text);
  }

  function toggle(open) {
    panel.hidden = !open;
    bubble.setAttribute('aria-expanded', String(open));
    bubble.classList.toggle('cb-open', open);
    $('.cb-badge').hidden = true;
    document.documentElement.classList.toggle('cb-lock', open && innerWidth < 520);
    if (open && !started) {
      started = true;
      add('bot', CONFIG.welcome);
      $('.cb-chips').innerHTML = CONFIG.suggestions.map((s) => `<button type="button">${esc(s)}</button>`).join('');
    }
    if (open) setTimeout(() => input.focus(), 50);
  }

  bubble.addEventListener('click', () => toggle(panel.hidden));
  $('.cb-close').addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
  $('.cb-form').addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); input.value = ''; });
  $('.cb-chips').addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); });
  document.querySelectorAll('[data-open-chat]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); toggle(true); }));

  window.brewChat = { ask: (t) => { if (panel.hidden) toggle(true); ask(t); }, answer };
})();
