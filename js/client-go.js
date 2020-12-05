'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

/////////////////////////////////////////////
$(function () {
    "use strict";

    // var room = '333';
    room = prompt('Enter room name:');

    var myName, yourName;

    var connection = new WebSocket('ws://127.0.0.1:1338');

    connection.onopen = function () {
        if (room !== '') {
            connection.send(JSON.stringify({type: 'create or join', room_id: room}));
            console.log('Attempted to create or  join room', room);
        }
    };

    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        message = json
        console.log("요거 보셈 ", message)

        console.log("메시지 왔다~ ", message.type)
        if (message.type === 'created') {
            console.log('Created room ' + room);
            myName = "Alice"
            yourName = "Bob"
            isInitiator = true;
            console.log("myName is ", myName)

        } else if (message.type === 'join') {
            isChannelReady = true;

        } else if (message.type === 'full') {
            console.log('Room ' + room + ' is full');

        } else if (message.type === 'joined') {
            if (myName !== "Alice") {
                myName = "Bob"
                yourName = "Alice"
                console.log("myName is ", myName)
            }
            console.log('joined: ' + room);
            isChannelReady = true;
        } else if (message.type === 'log') {
            console.log.apply(console, message.data);

        } else if (message.type === 'message') {
            console.log(message.name, ":", message.message);
            message = message.message

            if (message === 'got user media') {
                maybeStart();

            } else if (message.type === 'offer') {

                if (!isInitiator && !isStarted) {
                    maybeStart();
                }
                pc.setRemoteDescription(new RTCSessionDescription(message)).catch(() => console.log(myName, "야!!!!!"))
                doAnswer();

            } else if (message.type === 'answer' && isStarted) {
                pc.setRemoteDescription(new RTCSessionDescription(message)).catch(() => console.log(myName, "야!!!!!"))

            } else if (message.type === 'candidate' && isStarted) {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                pc.addIceCandidate(candidate);

            } else if (message === 'bye' && isStarted) {
                handleRemoteHangup();
            }
        }
    }

    function sendMessage(message) {
        console.log(myName, ": ", message);
        let tmp = {
            type: "message",
            name: myName,
            message: message
        }
        connection.send(JSON.stringify(tmp));
    }


    var localVideo = document.querySelector('#localVideo');
    var remoteVideo = document.querySelector('#remoteVideo');

    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
    })
        .then(gotStream)
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });

    function gotStream(stream) {
        console.log('Adding local stream.');
        localStream = stream;
        localVideo.srcObject = stream;
        sendMessage('got user media');
        console.log("isInitiator", isInitiator)
        if (isInitiator) {
            maybeStart();
        }
    }

    var constraints = {
        video: true
    };

    console.log('Getting user media with constraints', constraints);

    if (location.hostname !== 'localhost') {
        // requestTurn(
        //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
        // );
    }

    function maybeStart() {
        console.log('maybeStart() ', isStarted, localStream, isChannelReady);
        if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
            console.log('creating peer connection');
            createPeerConnection();
            pc.addStream(localStream);
            isStarted = true;
            console.log('isInitiator', isInitiator);
            if (isInitiator) {
                doCall();
            }
        }
    }

    window.onbeforeunload = function () {
        sendMessage('bye');
    };

    /////////////////////////////////////////////////////////

    function createPeerConnection() {
        try {
            pc = new RTCPeerConnection(null);
            // 생성되면 전달해 주는 역할
            pc.onicecandidate = handleIceCandidate;
            pc.onaddstream = handleRemoteStreamAdded;
            pc.onremovestream = handleRemoteStreamRemoved;
            console.log('Created RTCPeerConnnection');
        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
    }

    function handleIceCandidate(event) {
        console.log('icecandidate event: ', event);
        if (event.candidate) {
            sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates.');
        }
    }

    function handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
    }

    function doCall() {
        console.log('Sending offer to peer');
        pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }

    function doAnswer() {
        console.log('Sending answer to peer.');
        pc.createAnswer().then(
            setLocalAndSendMessage,
            onCreateSessionDescriptionError
        );
    }

    function setLocalAndSendMessage(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        sendMessage(sessionDescription);
    }

    function onCreateSessionDescriptionError(error) {
        trace('Failed to create session description: ' + error.toString());
    }

    function handleRemoteStreamAdded(event) {
        console.log('Remote stream added.');
        remoteStream = event.stream;
        remoteVideo.srcObject = remoteStream;
    }

    function handleRemoteStreamRemoved(event) {
        console.log('Remote stream removed. Event: ', event);
    }

    function hangup() {
        console.log('Hanging up.');
        stop();
        sendMessage('bye');
    }

    function handleRemoteHangup() {
        console.log('Session terminated.');
        stop();
        isInitiator = false;
    }

    function stop() {
        isStarted = false;
        pc.close();
        pc = null;
    }

})
