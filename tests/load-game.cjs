const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function element(id = '') {
  const el = {
    id, children: [], style: {}, dataset: {}, _innerHTML: '', textContent: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(v) { this._innerHTML = v; this.children.length = 0; },
    disabled: false, className: '', src: '', alt: '', title: '', onclick: null,
    classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; },
    },
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    prepend(child) { this.children.unshift(child); child.parentElement = this; return child; },
    remove() { if (this.parentElement && this.parentElement.children) this.parentElement.children = this.parentElement.children.filter(x => x !== this); },
    get lastChild() { return this.children[this.children.length - 1] || null; },
    addEventListener() {}, removeEventListener() {}, setAttribute() {},
  };
  el.parentElement = { classList: { add() {}, remove() {}, toggle() {} } };
  return el;
}

function loadGame() {
  const elements = new Map();
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); },
    createElement(tag) { return element(tag); },
    querySelectorAll() { return []; },
    addEventListener() {},
  };
  const storage = new Map();
  const context = {
    console, document, elements,
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
    performance: { now: () => 1000 },
    Image: class { set src(value) { this._src = value; } get src() { return this._src; } },
    setTimeout, clearTimeout, Math, JSON, Date,
    window: {},
  };
  context.window = context;
  vm.createContext(context);
  const root = path.resolve(__dirname, '..', 'anime-extra-random-defense-3d');
  for (const file of ['i18n.js', 'data.js', 'ferd-skills.js', 'game.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  return context;
}

function unit(id = 'ATE', uid = 1) {
  return { id, uid, cd: 0 };
}

module.exports = { loadGame, unit };
