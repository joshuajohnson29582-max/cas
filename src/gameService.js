// Async service boundary. Replace this implementation with a backend adapter without changing UI/3D code.
let balance = 2500;
const listeners = new Set();

const wait = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const gameService = {
  getBalance: () => balance,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  notify() { listeners.forEach(fn => fn(balance)); },
  async addDemoCoins(amount = 5000) {
    await wait();
    balance += amount;
    this.notify();
    return balance;
  },
  async placeBet(amount, game) {
    await wait();
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Неверная ставка');
    if (amount > balance) throw new Error('Недостаточно монет');
    balance -= amount;
    this.notify();
    return { ok: true, balance, game };
  },
  async payout(amount) {
    await wait();
    balance += amount;
    this.notify();
    return balance;
  },
  async crashResult() {
    await wait();
    const crash = Math.max(1.02, +(1.1 + Math.random() * 6 * Math.pow(Math.random(), 1.8)).toFixed(2));
    return { crash };
  },
  async rouletteResult() {
    await wait();
    const pockets = 37;
    const pocket = Math.floor(Math.random() * pockets);
    return { pocket, red: pocket !== 0 && [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(pocket) };
  },
  async plinkoResult(rows = 8) {
    await wait();
    let position = 0;
    for (let i = 0; i < rows; i++) position += Math.random() > 0.5 ? 1 : 0;
    const multipliers = [8, 3, 1.5, 0.5, 0.3, 0.5, 1.5, 3, 8];
    const index = Math.min(multipliers.length - 1, position);
    return { position: index, multiplier: multipliers[index] };
  },
  async slotsResult() {
    await wait();
    const symbols = ['◆', '7', '◆', '★', '♠', '●', '♦'];
    const reels = [0, 0, 0].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    const first = reels[0];
    const count = reels.filter(x => x === first).length;
    const multiplier = count === 3 ? 5 : count === 2 ? 1.5 : 0;
    return { reels, multiplier };
  }
};
