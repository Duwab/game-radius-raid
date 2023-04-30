$.RoomManager = function(url) {
    this.deviceId = localStorage.getItem("deviceId");
    this.roomId = localStorage.getItem("roomId");
    this.roomToken = localStorage.getItem("roomToken");
    this.socket = io(url);

    this.socket.once("connect", () => {
        this.socket.emit('hello from client', this.deviceId);
        this.init();
    });

    this.socket.on('device-join', (...args) => console.log('device-join', ...args));
    this.socket.on('device-leave', (...args) => console.log('device-leave', ...args));
    this.socket.on('device-disconnected', (...args) => console.log('device-disconnected', ...args));
    this.socket.on('control', ({
        id,
        action,
        angle,
        intensity,
        tags,
        deviceId,
        roomId,
        ...others
    }) => console.log('control', id,
        action,
        angle,
        intensity,
        tags,
        deviceId,
        roomId,
        others,
    ));
}

$.RoomManager.prototype.init = async function() {
    await this.createDeviceIdIfNotExists();
    await this.createRoomIfNotExists();
    console.log('room created', this.roomId);
    this.socket.emit('join-room', { roomId: this.roomId, token: this.roomToken });

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            this.socket.off('join-room-ack');
            console.error('failed joining', this.roomId);
            reject();
        }, 5000);
        this.socket.once('join-room-ack', () => {
            clearTimeout(timeout);
            console.log('successfully joined', this.roomId);
            resolve();
        });
    })
}

$.RoomManager.prototype.createDeviceIdIfNotExists = async function() {
    if (!this.deviceId) {
        this.deviceId = `raid-${Math.round(Math.random() * 100000000)}`;
        localStorage.setItem("deviceId", this.deviceId);
    }
}

$.RoomManager.prototype.createRoomIfNotExists = async function() {
    if (!this.roomId || !this.roomToken) {
        const { id, token } = await this.createRoom();
        this.roomId = id;
        this.roomToken = token;
        localStorage.setItem("roomId", id);
        localStorage.setItem("roomToken", token);
        console.log('created room', this.roomId);
    }
}

$.RoomManager.prototype.createRoom = async function() {
    if (this.room) throw new Error('won\'t create romm if one already exists');

    const { data } = await axios.post(`${BASE_URL}/api/room`);

    return data;
}
