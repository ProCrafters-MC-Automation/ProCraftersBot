const vec3 = require('vec3');

function OctahedronIterator(center) {
    this.center = center.floored();
    this.apothem = 1;
    this.x = -1;
    this.y = -1;
    this.z = -1;
    this.L = this.apothem;
    this.R = this.L + 1;
}

OctahedronIterator.prototype.next = function () {
    this.R -= 1;
    if (this.R < 0) {
        this.L -= 1;
        if (this.L < 0) {
            this.z += 2;
            if (this.z > 1) {
                this.y += 2;
                if (this.y > 1) {
                    this.x += 2;
                    if (this.x > 1) {
                        this.apothem += 1;
                        this.x = -1;
                    }
                    this.y = -1;
                }
                this.z = -1;
            }
            this.L = this.apothem;
        }
        this.R = this.L;
    }
    const X = this.x * this.R;
    const Y = this.y * (this.apothem - this.L);
    const Z = this.z * (this.apothem - Math.abs(Math.abs(X) + Math.abs(Y)));
    const offset = vec3(X, Y, Z);
    return offset.plus(this.center);
};

function load(bot) {
    bot.findBlockSync = function (options) {
        const point = options.point || bot.entity.position;
        const matching = options.matching;
        const count = options.count == null ? 1 : options.count;
        const maxDistance = options.maxDistance == null ? 64 : options.maxDistance;

        const it = new OctahedronIterator(point);
        const result = [];

        while (result.length < count && it.apothem <= maxDistance) {
            const block = bot.blockAt(it.next());
            if (block) {
                if (typeof matching === 'number' && block.type === matching) {
                    result.push(block);
                } else if (typeof matching === 'string' && block.name === matching) {
                    result.push(block);
                }
            }
        }

        return result;
    };
}

module.exports = {
    load
};
