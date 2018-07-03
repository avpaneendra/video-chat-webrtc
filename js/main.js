'use strict'


// Flag to distinguish local peer from remote peer
let isInitiater = false;
let isStarted = false;
let isChannelReady = false;

let localStream;
let remoteStream;
let peerConnection;

let socket = io.connect();

// Setting static room
let room = 'foo';


if (room !== ''){
    socket.emit('create or join',room)
    console.log('Attempted to create room')
}

socket.on('join',(room) => {
    console.log(`Person joined ${room}`)
    isChannelReady = true;
})

socket.on('joined',(socketId, room) => {
    console.log(`${socketId} joined the ${room}`)
    isChannelReady = true;
})

socket.on('created',(room) => {
    isInitiater = true;
    console.log(`${room} room created`)
})

socket.on('log', array => {
    console.log.apply(console, array)
})

socket.on('ready', () => {
    console.log('Room is ready')
})

socket.on('full', (room) => {
    console.log('Room is already is filled')
})

socket.on('message', message => {
    console.log('Client received message: ', message)
    if (message === 'got user media'){
        maybeStart()
    }else if(message.type === 'offer'){
        if(!isStarted && !isInitiater){
            maybeStart()
        }

        // Adding remote description for remote peer
        peerConnection.setRemoteDescription(new RTCSessionDescription(message))
        doAnswer();
    }else if(message.type === 'answer' && isStarted){

        // Adding remote description for local peer
        peerConnection.setRemoteDescription(new RTCSessionDescription(message))

    }else if(message.type === 'candidate' && isStarted){
        let candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate : message.candidate
        });
        peerConnection.addIceCandidate(candidate)
        console.log('Ice candidate added')
    }  else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
})


function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}

//////////////////////////////////////////
//////////////////////////////////////////


// Getting User Media
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
}).then(gotStream)
.catch(gotUserMediaErrorHandler)

function gotStream(stream){
    console.log('Adding local Stream')
    localStream = stream;
    localVideo.srcObject = stream;
    sendMessage('got user media')
    if(isInitiater){
        maybeStart();
    }
}

///////////////////////////////////////////////
//////////////////////////////////////////////

function maybeStart(){
    console.log('maybeStart >>>>>>>>>',isStarted, localStream, isChannelReady)
    if(!isStarted && localStream !== 'undefined' && isChannelReady){
        createPeerConnection();
        peerConnection.addStream(localStream);
        if(isInitiater){
            doCall();
        }
        isStarted = true;
        
    }
}

function createPeerConnection(){
    console.log('Starting peer connection')
    peerConnection = new RTCPeerConnection(null)

    // Add the event handlers here
    peerConnection.onicecandidate = handleIceCandidate;
    peerConnection.onaddstream = handleAddStream;
    peerConnection.onremovestream = handleRemoveStream;
    console.log('Added event listeners')   
}

function handleIceCandidate(event){
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

function handleAddStream(event){
    if(event.stream){
        console.log('Adding remote Video to the page')
        console.log(event.stream)
        remoteStream = event.stream;
        remoteVideo.srcObject = remoteStream;
    }
}
function handleRemoveStream(event){
    remoteStream = null;
    remoteVideo.srcObject = null;
    console.log('Removing remove Video stream from the page')
}

function doCall(){
    console.log('Creating Offer')
    peerConnection.createOffer(handleOfferSuccess, handleOfferError)
}

function handleOfferSuccess(description) {
    peerConnection.setLocalDescription(description)
    sendMessage(description)
}

function doAnswer(){
    console.log('Creating Answer')
    peerConnection.createAnswer(handleAnswerSuccess, handleAnswerError)
}

function handleAnswerSuccess(description){
    peerConnection.setLocalDescription(description)
    sendMessage(description)
}



/////////////////////////////////////////////////
/////////////////////////////////////////////////

// Error Handlers

function gotUserMediaErrorHandler(error){
    console.log(`Error in gotUserMediaHandler ${error}`)
}

function handleOfferError(error){
    console.log(`Error in offer ${error}`)
}

function handleAnswerError(error){
    console.log(`Error in answer ${error}`)
}


//////////////////////////////////////////
//////////////////////////////////////////

// On Close

window.onbeforeunload = function() {
    sendMessage('bye');
};

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
  