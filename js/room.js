// ici, le modèle ne se préoccupe pas de gérer la connexion
// l'instance existe côté serveur, le manager s'occuper de gérer le réseau
// celui-ci ne traite que ce qui est actionnable
// on est dans la partie métier du jeu (quelque soit le transport utilisé pour véhiculer l'info)
$.Room = function({id, token} = {}) {
    this.id = id;
    this.token = token;
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
$.Room.prototype.resetPlayers = function() {
    $.players = Object.values($.roomManager.devices)
        .map(({deviceId, member}) => member && new $.Player(deviceId))
        .filter(p => p);
};
