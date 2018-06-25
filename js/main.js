'use strict'

let localVideo = document.getElementById('localVideo')
let remoteVideo = document.getElementById('remoteVideo')

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

let mediaStreamConstraints = {
    video : true,
};

let offerOptions = {
    offerToReceiveVideo : 1,
};


function getLocalMediaStream(stream){
    localStream = stream;
    localVideo.srcObject = stream;
    console.log('Added stream to the local connection')
}

function getRemoteMediaStream(event){
    remoteStream = event.stream;
    remoteVideo.srcObject = event.stream;
    console.log('Added stream to the remote connection')
}


// Assign actions for the buttons 
let start = document.getElementById('startButton')
let call = document.getElementById('callButton')
let hangUp = document.getElementById('hangupButton')

start.addEventListener('click',startAction)
call.addEventListener('click',callAction)

function callAction(){
    const servers = null;  // Allows for RTC server configuration.
    localPeerConnection =  new RTCPeerConnection(servers);
    localPeerConnection.addEventListener('icecandidate',handleSuccess)
    localPeerConnection.addEventListener('iceconnectionstatechange',handleConnectionChange)
    
    remotePeerConnection = new RTCPeerConnection(servers);
    remotePeerConnection.addEventListener('icecandidate',handleSuccess)
    remotePeerConnection.addEventListener('iceconnectionstatechange',handleConnectionChange)
    remotePeerConnection.addEventListener('addstream',getRemoteMediaStream)

    // Add local stream to connection and create offer to connect.
    localPeerConnection.addStream(localStream);
    console.log('Added local stream to localPeerConnection.');

    localPeerConnection.createOffer(offerOptions)
    .then(createdOffer)
    .catch((error) => console.log(`Error while creating offer ${error}`))
}

function startAction(){
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(getLocalMediaStream)
    .catch(() => console.log(`Error occured`))
}



// Offer and Accept handlers
function createdOffer(description){
    console.log('Starting an offer')
    localPeerConnection.setLocalDescription(description)
    .then(() => console.log(`Local Description successfully added for localPeer`))
    .catch(() =>console.log(`Error occured in localPeer localDescription`))

    remotePeerConnection.setRemoteDescription(description)
    .then(() => console.log(`Remote Description successfully added for remotePeer`))
    .catch(() => console.log(`Error occured in remotePeer remoteDescription`))
    
    remotePeerConnection.createAnswer()
    .then(createdAnswer)
    .catch(() => console.log(`Error occured while creating the answer`))
}

function createdAnswer(description){
    console.log('Creating the answer')
    localPeerConnection.setRemoteDescription(description)
    .then(() => console.log(`Remote Description successfully added for localPeer`))
    .catch(() => console.log(`Error occured in localPeer remoteDescription`))

    remotePeerConnection.setLocalDescription(description)
    .then(() => console.log(`Local Description successfully added for remotePeer`))
    .catch(() =>  console.log(`Error occured in remotePeer localDescription`))
}



function handleSuccess(event){
    const peerConnection = event.target;
    const iceCandidate = event.candidate;
    if(iceCandidate){
        const newIceCandidate = new RTCIceCandidate(iceCandidate)
        const otherPeer = getOtherPeer(peerConnection)
        otherPeer.addIceCandidate(newIceCandidate)
        .then(() => {
            console.log(`Successfully connected to ${getPeerName(otherPeer)}`)
        })
        .catch(() => {
            console.log(`Error occured while adding ${getPeerName(otherPeer)}`)
        })
    }
}

function handleConnectionChange(event){
    const peerConnection = event.target;
    console.log(`ICE Candidate Connection Change ${event}`);
    console.log(`${getPeerName(peerConnection)} ICE State: ${peerConnection.iceConnectionState}`)

}

// Helper Function
function getOtherPeer(peerConnection){
    return (peerConnection === localPeerConnection) ? 
        remotePeerConnection : localPeerConnection
}

function getPeerName(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        'localPeerConnection' : 'remotePeerConnection';
}


