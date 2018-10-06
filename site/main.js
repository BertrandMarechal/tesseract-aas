
let video;
let canvas;
let ctx;

var crop = function(canvas, offsetX, offsetY, width, height, callback) {
    var buffer = document.createElement('canvas');
    var b_ctx = buffer.getContext('2d');
    buffer.width = width;
    buffer.height = height;
    b_ctx.drawImage(canvas, offsetX, offsetY, width, height,
                    0, 0, buffer.width, buffer.height);
    callback(buffer.toDataURL('image/png'));
};
function callTesseract() {
    setTimeout(() => {
        ctx.drawImage(video, 0, 0, 640, 480);
        crop(canvas, 0, 0, 640, 480, (data) => {
            $.ajax({
                url: 'http://localhost:65065/upload',
                type: 'post',
                data: {Body: data},
                success: function( data2, textStatus, jQxhr ){
                    $('#response').html( JSON.stringify( data2 ) );
                    callTesseract();
                },
                error: function( jqXhr, textStatus, errorThrown ){
                    console.log( errorThrown );
                }
            });
        });
    }, 1000);
}
$(document).ready(() => {
    console.log('initialized');

    let localstream;
    video = $('#video').get(0);
    canvas = $('#canvas').get(0);
    ctx = canvas.getContext('2d');

    setTimeout(() => {
        if (video && !localstream) {
          if (navigator.mediaDevices) {
            const _video = video;
            console.log(video);
            if (navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {
                localstream = stream;
                _video.srcObject = stream;
                _video.play();
                callTesseract();
              });
            }
          }
        }
    }, 100);
});

