"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var db = require('../util/db');
var rooms = {};
var creatingRooms = {};
var userLocation = {};
var totalRooms = 0;
var DI_FEN = [1, 2, 5];
var MAX_FAN = [3, 4, 5];
var JU_SHU = [4, 8];
var JU_SHU_COST = [2, 3];
function generateRoomId() {
    var roomId = "";
    for (var i = 0; i < 6; ++i) {
        roomId += Math.floor(Math.random() * 10);
    }
    return roomId;
}
function constructRoomFromDb(dbdata) {
    var roomInfo = {
        uuid: dbdata.uuid,
        id: dbdata.id,
        numOfGames: dbdata.num_of_turns,
        createTime: dbdata.create_time,
        nextButton: dbdata.next_button,
        seats: new Array(4),
        conf: JSON.parse(dbdata.base_info)
    };
    var roomId = roomInfo.id;
    for (var i = 0; i < 4; ++i) {
        var s = roomInfo.seats[i] = {}; //userId:string,score:string,name:string,ready:boolean,seatIndex:number
        // s.userId = dbdata["user_id" + i];
        // s.score = dbdata["user_score" + i];
        // s.name = dbdata["user_name" + i];
        // s.ready = false;
        // s.seatIndex = i;
        // if(s.userId > 0){
        // 	userLocation[s.userId] = {
        // 		roomId:roomId,
        // 		seatIndex:i
        // 	};
        // }
    }
    rooms[roomId] = roomInfo;
    totalRooms++;
    return roomInfo;
}
exports.createRoom = function () {
    let roomId = generateRoomId();
    while (rooms[roomId]) {
        roomId = generateRoomId();
    }
    console.log('创建房间生成的房间号：' + roomId);
    return roomId;
};
exports.destroy = function (roomId) {
    var roomInfo = rooms[roomId];
    if (roomInfo == null) {
        return;
    }
    for (var i = 0; i < 4; ++i) {
        var userId = roomInfo.seats[i].userId;
        if (userId > 0) {
            delete userLocation[userId];
            db.set_room_id_of_user(userId, null);
        }
    }
    delete rooms[roomId];
    totalRooms--;
    db.delete_room(roomId);
};
exports.getTotalRooms = function () {
    return totalRooms;
};
exports.getRoom = function (roomId) {
    return rooms[roomId];
};
exports.isCreator = function (roomId, userId) {
    var roomInfo = rooms[roomId];
    if (roomInfo == null) {
        return false;
    }
    return roomInfo.conf.creator == userId;
};
exports.enterRoom = function (roomId, userId, userName, callback) {
    var fnTakeSeat = function (room) {
        if (exports.getUserRoom(userId) == roomId) {
            //已存在
            return 0;
        }
        for (var i = 0; i < 4; ++i) {
            var seat = room.seats[i];
            if (seat.userId <= 0) {
                seat.userId = userId;
                seat.name = userName;
                userLocation[userId] = {
                    roomId: roomId,
                    seatIndex: i
                };
                //console.log(userLocation[userId]);
                db.update_seat_info(roomId, i, seat.userId, "", seat.name);
                //正常
                return 0;
            }
        }
        //房间已满
        return 1;
    };
    var room = rooms[roomId];
    if (room) {
        var ret = fnTakeSeat(room);
        callback(ret);
    }
    else {
        db.get_room_data(roomId, function (dbdata) {
            if (dbdata == null) {
                //找不到房间
                callback(2);
            }
            else {
                //construct room.
                room = constructRoomFromDb(dbdata);
                //
                var ret = fnTakeSeat(room);
                callback(ret);
            }
        });
    }
};
exports.setReady = function (userId, value) {
    var roomId = exports.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var room = exports.getRoom(roomId);
    if (room == null) {
        return;
    }
    var seatIndex = exports.getUserSeat(userId);
    if (seatIndex == null) {
        return;
    }
    var s = room.seats[seatIndex];
    s.ready = value;
};
exports.isReady = function (userId) {
    var roomId = exports.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var room = exports.getRoom(roomId);
    if (room == null) {
        return;
    }
    var seatIndex = exports.getUserSeat(userId);
    if (seatIndex == null) {
        return;
    }
    var s = room.seats[seatIndex];
    return s.ready;
};
exports.getUserRoom = function (userId) {
    var location = userLocation[userId];
    if (location != null) {
        return location.roomId;
    }
    return null;
};
exports.getUserSeat = function (userId) {
    var location = userLocation[userId];
    //console.log(userLocation[userId]);
    if (location != null) {
        return location.seatIndex;
    }
    return null;
};
exports.getUserLocations = function () {
    return userLocation;
};
exports.exitRoom = function (userId) {
    var location = userLocation[userId];
    if (location == null)
        return;
    var roomId = location.roomId;
    var seatIndex = location.seatIndex;
    var room = rooms[roomId];
    delete userLocation[userId];
    if (room == null || seatIndex == null) {
        return;
    }
    var seat = room.seats[seatIndex];
    seat.userId = 0;
    seat.name = "";
    var numOfPlayers = 0;
    for (var i = 0; i < room.seats.length; ++i) {
        if (room.seats[i].userId > 0) {
            numOfPlayers++;
        }
    }
    db.set_room_id_of_user(userId, null);
    if (numOfPlayers == 0) {
        exports.destroy(roomId);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vbW1nci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2FwcC9tb2RlbC9yb29tbWdyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRS9CLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUV2QixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFDdEIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBRW5CLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN2QixJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDeEIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEIsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFekI7SUFDSSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUN4QixNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7S0FDNUM7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBRUQsNkJBQTZCLE1BQU07SUFDL0IsSUFBSSxRQUFRLEdBQUc7UUFDWCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7UUFDakIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1FBQ2IsVUFBVSxFQUFFLE1BQU0sQ0FBQyxZQUFZO1FBQy9CLFVBQVUsRUFBRSxNQUFNLENBQUMsV0FBVztRQUM5QixVQUFV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