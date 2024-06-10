class QLearning {
  constructor(bot) {
    this.bot = bot;
    this.qTable = {}; // Q-table for storing Q-values
    this.state = this.getState();
    this.alpha = 0.1; // Learning rate
    this.gamma = 0.9; // Discount factor
    this.epsilon = 0.2; // Exploration rate
  }

  getState() {
    // Define the state based on bot's current situation
    // Simplified example: state could be just bot's health
    return Math.floor(this.bot.health);
  }

  chooseAction() {
    // Epsilon-greedy action selection
    if (Math.random() < this.epsilon) {
      return Math.random() < 0.5 ? 'attack' : 'follow';
    } else {
      const qAttack = this.qTable[this.state] ? this.qTable[this.state]['attack'] || 0 : 0;
      const qFollow = this.qTable[this.state] ? this.qTable[this.state]['follow'] || 0 : 0;
      return qAttack > qFollow ? 'attack' : 'follow';
    }
  }

  updateQTable(state, action, reward, nextState) {
    if (!this.qTable[state]) this.qTable[state] = {};
    if (!this.qTable[nextState]) this.qTable[nextState] = {};

    const q = this.qTable[state][action] || 0;
    const maxQNext = Math.max(this.qTable[nextState]['attack'] || 0, this.qTable[nextState]['follow'] || 0);

    this.qTable[state][action] = q + this.alpha * (reward + this.gamma * maxQNext - q);
  }

  reward(amount) {
    const nextState = this.getState();
    this.updateQTable(this.state, 'attack', amount, nextState);
    this.state = nextState;
  }

  penalize(amount) {
    const nextState = this.getState();
    this.updateQTable(this.state, 'follow', -amount, nextState);
    this.state = nextState;
  }
}

module.exports = QLearning;
