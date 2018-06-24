'use strict';

// Define Constraints for the user media
const mediaConstraints = {
    video: true,
    audio: true
}

// Video element where the stream will be placed
const videoElement = document.querySelector('video');


// Local Stream that will be replaced by the video
let localStream;

// Pass the stream to the video element on Success
function onSuccess(mediaStream){
    localStream = mediaStream
    videoElement.srcObject = mediaStream
}

// Display the errors when something goes wrong
function onError(error){
    console.log('Error occurred while streaming your video', error)
}

// Initilize the media stream
navigator.mediaDevices.getUserMedia(mediaConstraints).then(
    onSuccess
).catch(
    onError
)