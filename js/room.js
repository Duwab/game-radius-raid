// ici, le modèle ne se préoccupe pas de gérer la connexion
// l'instance existe côté serveur, le manager s'occuper de gérer le réseau
// celui-ci ne traite que ce qui est actionnable
// on est dans la partie métier du jeu (quelque soit le transport utilisé pour véhiculer l'info)
$.Room = function({id, token} = {}) {
    this.id = id;
    this.token = token;
    this.lastActiveUser = null;
}

$.Room.prototype.init = function() {
    //
}

$.Room.prototype.getDeviceState = function(deviceId) {
    return {}
}

$.Room.prototype.onControl = function(deviceId, {
    action,
    angle,
    intensity,
    controlName,
}) {
    const player = this.getPlayer(deviceId);
    if (!player) throw new Error(`No player for device ${deviceId}`);
    if (controlName === 'position') {
        player.control.state.down = 0;
        player.control.state.up = 0;
        player.control.state.right = 0;
        player.control.state.left = 0;

        if (action === 'drop') return;

        if (angle < 0) {
            player.control.state.up = 1;
        } else if (angle > 0) {
            player.control.state.down = 1;
        }

        if (Math.abs(angle) < Math.PI / 2) {
            player.control.state.right = 1;
        } else if (Math.abs(angle) > Math.PI / 2) {
            player.control.state.left = 1;
        }
    } else if (controlName === 'shoot') {
        player.control.state.shoot = intensity && action !== 'drop';
        player.control.state.shootAngle = angle;
    }
}

$.Room.prototype.onDeviceJoin = function(deviceId) {
    console.log('push new player', deviceId);
    $.players.push(new $.Player(deviceId));
};

$.Room.prototype.onDeviceLeave = function(deviceId) {
    console.log('filter player', deviceId);
    $.players = $.players.filter(p => p.id === deviceId);

};

$.Room.prototype.onDeviceReconnect = function(deviceId) {
    console.log('device reconnected', deviceId);
};

$.Room.prototype.onDeviceDisconnected = function(deviceId) {
    console.log('device disconnected', deviceId);
};

$.Room.prototype.getPlayer = function(deviceId) {
    return $.players.find(p => p.id === deviceId);
};

$.Room.prototype.getRandomPlayer = function() {
    const i = Math.floor(Math.random() * $.players.length);
    return $.players[i];
};

$.Room.prototype.resetPlayers = function() {
    $.players = Object.values($.roomManager.devices)
        .map(({id, member}) => member && new $.Player(id))
        .filter(p => p);
    this.lastActiveUser = null;
};

$.Room.prototype.getFirstActiveUser = function() {
    const firstActiveUser = this.getLivingPlayers()[0];
    if (firstActiveUser) {
        this.lastActiveUser = firstActiveUser;
    }
    return this.lastActiveUser;
};

$.Room.prototype.areAllPlayersDead = function() {
    if (!$.players.length) return false;

    return this.getLivingPlayers().length === 0;
};

$.Room.prototype.getLivingPlayers = function() {
    return $.players.filter(p => {
        const isAlive = p.life > 0;
        const deviceInfo = $.roomManager.devices[p.id];

        return isAlive && deviceInfo.connected && deviceInfo.member;
    });
};

$.Room.prototype.setPlayersValue = function(path, value) {
    $.players.forEach(p => {
        _set(p, path, value);
    });
};

$.Room.prototype.forEachPlayer = function(callback) {
    $.players.forEach(callback);
};

$.Room.prototype.findPlayer = function(callback) {
    $.players.find(callback);
};

const _set = function(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}
