import numpy as np
from flask import Flask, request
from flask_socketio import SocketIO
import eventlet
from stable_baselines3 import DQN
from stable_baselines3.common.envs import DummyVecEnv
import gym

app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet')

class PvPEnv(gym.Env):
    def __init__(self):
        super(PvPEnv, self).__init__()
        self.action_space = gym.spaces.Discrete(5)
        self.observation_space = gym.spaces.Box(low=-np.inf, high=np.inf, shape=(4,), dtype=np.float32)
        self.state = None
        self.reward = 0

    def step(self, action):
        self.state = np.random.rand(4)
        self.reward = np.random.randint(-10, 10)
        done = False
        return self.state, self.reward, done, {}

    def reset(self):
        self.state = np.random.rand(4)
        return self.state

env = DummyVecEnv([lambda: PvPEnv()])

model = DQN('MlpPolicy', env, verbose=1)
model.learn(total_timesteps=1000)

@socketio.on('state')
def handle_state(data):
    bot = data['bot']
    state = np.array([data['state']['x'], data['state']['y'], data['state']['z'], data['state']['health']])
    action, _ = model.predict(state)
    socketio.emit('action', {'bot': bot, 'action': int(action)})

@socketio.on('reward')
def handle_reward(data):
    winning_group = data['winningGroup']
    losing_group = data['losingGroup']
    reward_winner = 100
    reward_loser = -100

    for bot in winning_group:
        state = np.random.rand(4)  # Placeholder for actual state
        action = np.random.randint(0, 5)  # Placeholder for actual action
        env.step(action)
        model.learn(total_timesteps=10, reset_num_timesteps=False)

    for bot in losing_group:
        state = np.random.rand(4)  # Placeholder for actual state
        action = np.random.randint(0, 5)  # Placeholder for actual action
        env.step(action)
        model.learn(total_timesteps=10, reset_num_timesteps=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
