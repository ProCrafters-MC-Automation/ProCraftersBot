import random

class Agent:
    def __init__(self):
        self.x = 0
        self.y = 0
        self.z = 0
        self.inventory = []
        self.enemies = []
        self.Q = {}

    def move_left(self):
        self.x -= 1

    def move_right(self):
        self.x += 1

    def move_up(self):
        self.y += 1

    def move_down(self):
        self.y -= 1

    def attack(self, enemy):
        if enemy in self.enemies:
            self.enemies.remove(enemy)

    def goto(self, x, y, z):
        if self.x < x:
            self.move_right()
        elif self.x > x:
            self.move_left()

        if self.y < y:
            self.move_up()
        elif self.y > y:
            self.move_down()

        if self.z < z:
            self.move_up()
        elif self.z > z:
            self.move_down()

    def act(self, state):
        actions = []
        for action in ["move_left", "move_right", "move_up", "move_down", "attack"]:
            actions.append((action, self.Q.get((state, action), 0)))

        best_action, best_Q_value = max(actions, key=lambda x: x[1])
        return best_action

    def learn(self, state, action, reward, next_state):
        Q_prime = max(self.Q.get(next_state, {}).values(), 0)
        self.Q[(state, action)] += self.alpha * (reward + self.gamma * Q_prime - self.Q[(state, action)])

