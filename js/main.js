let sendChannel;
let receiveChannel;

let localPeerConnection;
let remotePeerConnection;


var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
let start =  document.querySelector('button#startButton')
let send = document.querySelector('button#sendButton')
let close = document.querySelector('button#closeButton')

send.disabled = true;
close.disabled = true;

let servers;
let pcConstraints;
let dataConstraints;

start.onclick = createConnection;
send.onclick = sendMessage;
close.onclick = closeConnection;

function sendMessage(event){
    console.log(`Send Message: ${dataChannelSend.value}`)
    sendChannel.send(dataChannelSend.value)
    dataChannelSend.value = '';
}

function closeConnection(event){
    start.disabled = false;
    send.disabled = true;
    close.disabled = true;
    
    console.log('Closing data channel')
    sendChannel.close()
    receiveChannel.close()

    console.log('Closing peer connection')
    localPeerConnection.close()
    remotePeerConnection.close()
    localPeerConnection = null;
    remotePeerConnection = null;

    dataChannelSend.value = '';
    dataChannelReceive.value = '';
    dataChannelSend.disabled = true;
    
}

function createConnection(){
    console.log('Using SCTP protocol for Arbitary Data Transmission')
    dataChannelSend.value = '';

    localPeerConnection = new RTCPeerConnection(servers, pcConstraints)
    localPeerConnection.onicecandidate = iceCallback1;
    console.log('Created local Peer connection')

    sendChannel = localPeerConnection.createDataChannel('sendDataChannel',dataConstraints)
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;
    console.log('Created local send channel')

    remotePeerConnection = new RTCPeerConnection(servers, pcConstraints)
    remotePeerConnection.onicecandidate = iceCallback2;
    remotePeerConnection.ondatachannel = receiveChannelCallback;
    console.log('Created Remote Peer Connection')
    
    localPeerConnection.createOffer()
    .then(offerAccepted)
    .catch(handleError)
    dataChannelSend.disabled = false;
    start.disabled = true;
    send.disabled = false;
    close.disabled = false;
}

function receiveChannelCallback(event){
    console.log(`On Receive Channel Callback`)
    if(event.channel){
        receiveChannel = event.channel;
        receiveChannel.onmessage = handleMessage;
        receiveChannel.onopen = onReceiveChannelStateChange;
        receiveChannel.onclose = onReceiveChannelStateChange;
    }
}

function offerAccepted(description){
    console.log('Offer Accepted')
    if(description){
        localPeerConnection.setLocalDescription(description)
        remotePeerConnection.setRemoteDescription(description)
        remotePeerConnection.createAnswer()
        .then(answerAccepted)
        .catch(handleError)
    }
}

function answerAccepted(description){
    console.log('Answer Accepted')
    if(description){
        localPeerConnection.setRemoteDescription(description)
        remotePeerConnection.setLocalDescription(description)
    }
}


function iceCallback1(event){
    console.log('On local Callback')
    if(event.candidate){
        localPeerConnection.addIceCandidate(
            event.candidate
        ).then(
            successAddIceCandidate,
        ).catch(
            errorAddIceCandidate
        )
    }
}

function iceCallback2(event){
    console.log('On Remote Callback')
    if(event.candidate){
        localPeerConnection.addIceCandidate(
            event.candidate
        ).then(
            successAddIceCandidate,
        ).catch(
            errorAddIceCandidate
        )
    }
}


function handleError(event){
    console.log(`Error occured in the event: ${event}`)
}

function successAddIceCandidate(){
    console.log(`Ice candidate added successfully`)
}

function errorAddIceCandidate(error){
    console.log(`Error in adding connection ice candidate`)
}

function onSendChannelStateChange(){
    console.log(`Send Channel state ${sendChannel.readyState}`)
}

function onReceiveChannelStateChange(){
    console.log(`Receive Channel state ${receiveChannel.readyState}`)
}

function handleMessage(event){
    console.log(`Message: ${event.data}`)
    dataChannelReceive.value = event.data
}