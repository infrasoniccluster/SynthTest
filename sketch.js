var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext(); // defines an audio context
//Section 1  - Pulsaret Envelope
//The function createPulsaretEnvelope() is borrowed and reworked from (Ennis 2014)

function createPulsaretEnvelope() {       // Pulsaret Envelope
  
var sampleRate = 44100;                   
var curve = new Float32Array(sampleRate);  // creates a typed array of 32 bit floating point numbers   
                                           // of the sampling rate
  
for (i = 0;i < sampleRate;i++) {          // loops the from 0 to 44099
 
var x = i * 2 / sampleRate - 1.008;        // scales the values of the sampleRate between -1.2 and 0.79.      
 
 // TRANSFER FUNCTIONS
 
curve[i]=2/Math.sqrt(3 * Math.PI)*Math.exp(-260 * x * x)/-1; //  Gaussian curve borrowed and reworked from (Davies and Jonsson 2013)
//curve[i] = (Math.sin(Math.PI * x * 6) / ( Math.PI * x * -7 ));  // large sine cardinal   borrowed and reworked (night owl 2012)
//curve[i] = (Math.sin(Math.PI * x * 30) / ( Math.PI * x * -43 ));// narrow sine cardinal   borrowed and reworked (night owl 2012)
}
  
  return curve;
};
var pulsaretEnv = audioCtx.createWaveShaper();    
pulsaretEnv.curve = createPulsaretEnvelope(); // Inserts the function above in the the pulsaretEnv WaveShaper  
pulsaretEnv.oversample = '4x';      // Interpolation occurs before the signal is distorted 

 
 
var emitter = audioCtx.createOscillator(); // fundamental frequency oscillator  

var vol = audioCtx.createGain();                

var output = audioCtx.createGain();            // gain node that goes to the AudioDestination and is modulated by the Pulsaret Envelope


emitter.connect(pulsaretEnv); // fundamental frequency oscillator connects to waveshaper 

pulsaretEnv.connect(vol);                        

vol.connect(output.gain); // output gain node is modulated by the waveshaper signal
 
output.connect(audioCtx.destination);
 

 
emitter.type = 'sine';   // fundamental frequency oscillator is a sine                       

vol.gain.value = 0.3;             

emitter.frequency.value = 3.0;  // fundamental frequency preset is 3Hz  

emitter.start(0);
 

 
/////////////////////////////////////////////////////////////////////////////////////////////////////////


//Section 2 - Duty Cycle-Silence Ratio
 
// Borrowed and reworked from (Harman 2014)
 
//********************************************************************************************************************************************
// Subsection 2.1 - This section is for the data that will be inserted into the arbitraryShaper().
 
var samp = 44100;  //sampling rate
var arbitraryWave =new Float32Array(samp); // store a typed array of the sampling rate

//// Harman's square wave shaping method (2014)
for (var i=0; i<samp / 2; i++) {  
arbitraryWave[i]=-1;       
arbitraryWave[i+samp]=1; 
}


/// Transfer function method for Pulsaet Waveform

//for (var i=0; i<samp; i++) {   
  
//var x = i * 2 / samp - 1.08; 

//arbitraryWave[i] = 2 / Math.sqrt(3 * Math.PI) * Math.exp(-20 * i * i) / - 1; // Gaussian curve borrowed and reworked from (Davies and Jonsson 2013)
//arbitraryWave[i]  =  (Math.sin(Math.PI * x * 1) - ( Math.PI * x * 40 ) / ( Math.PI * x * 100 )) * 0.5 + 0.23; // variation on a sine wave 
//}

//**********************************************************************************************************************************
// Subsection 2.2 - This is the section for the data to be inserted into the DCoffsetshaper().

var DCoffset = new Float32Array(2); // Creates DC offset 
DCoffset[0] = 0.5;
DCoffset[1] = 0.5;

//**********************************************************************************************************************************

var arbitraryShaper = audioCtx.createWaveShaper(); // Shapes the sawtooth and DC offset signal to a square wave
    arbitraryShaper.curve = arbitraryWave;
   
var DCoffsetshaper = audioCtx.createWaveShaper(); // takes the data from DCoffset and applies it to the signal 
    DCoffsetshaper.curve = DCoffset;  
    
  
   // creating the other nodes
   
   var osc = audioCtx.createOscillator();   //   Pitch-Frequency oscillator  
   
   var DCOffsetGain= audioCtx.createGain(); //  gain for DC offset 
   
    

// Making the connections between the nodes  
   
   osc.connect(arbitraryShaper);                            
   
   osc.connect(DCoffsetshaper);
   
   DCoffsetshaper.connect(DCOffsetGain);
   
   DCOffsetGain.connect(arbitraryShaper);
   
   arbitraryShaper.connect(output);
 
    
    
// Setting the values of the nodes 

  osc.type = "sine";
    
  osc.frequency.value = 440;
     
  osc.width=DCOffsetGain.gain;   //  Pulsaret Waveform oscillator is assigned the 'gain' AudioParam of the DCOffsetGain
                                  // Harman (2014)
  DCOffsetGain.gain.value = 0.0;
    
  output.gain.value = 0.0;
    

 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   


// SECTION 3 - Buffer Envelope for DCOffsetGain
//Buffer used to modulate the Widthgain node of the Duty Cycle Silence Ratio Engine
// The loadSound and playSound functions are borrowed and reworked from (Smus 2011).

var envBuffer;  // variable for buffer that contains the envelope shape that will the DC gain node

var source;    //  variable for the AudioBufferSource that play back the data.

function loadSound() { 
       
   var request = new XMLHttpRequest(); // start a XMLHttpRequest
       
    
      request.open('GET', "data/gauss.wav", true); // this line 'gets' a sound file labeled ``gauss.wav'' in a folder called `data'  
      //request.open('GET', "data/Quasi-Gaussian.wav", true);
      //request.open('GET', "data/Three Stage Line Segment.wav", true);
      //request.open('GET', "data/Triangle.wav", true);
      //request.open('GET', "data/sinc.wav", true);
      //request.open('GET', "data/line.wav", true);        
      //request.open('GET', "data/Expodec.wav", true);
      //request.open('GET', "data/rexpodec.wav", true);
      //request.open('GET', "data/Noise.wav", true);
      //request.open('GET', "data/SquareBurstMask.wav", true); 
// All of the sound files above except the "sinc", "line", "Noise"
// "Triangle" and "SquareBurstMask" are borrowed from (Wolek 2014).  

       
       
       
       request.responseType = 'arraybuffer';  // a buffer is created to store the retrived data
       
       request.onload = function() {          //   data from buffer is decoded asynchronously   
       
       audioCtx.decodeAudioData(request.response, function(buffer) {envBuffer = buffer;}); // the envBuffer variable is assigned the sound file  
      }
      request.send();
}
 

function playSound() {                  // The audio data retrieved above is activeted inside this function            

source = audioCtx.createBufferSource(); // BufferSource playsback the sound file   

source.buffer = envBuffer;              // envBuffer is inserted into the audio buffer source    

source.loop = true;                     // Boolean value true tells buffer to loop  

source.playbackRate.value = 0.2000331;     // Play back rate has a range from 0.0031 to 0.30

source.connect(DCOffsetGain.gain);         // This is where the buffer node modulates the DCOffsetGain node of the  Duty Cycle silence Ratio 

source.start(0);                        // Starts Audio Source buffer at instantly 

}
// function is activated after the "Load Buffer" and "Play Buffer" buttons are clicked 
// button is borrowed and reworked from (w3schools, n.d.)

 


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////






//Section 4 - Interface Controls
// Subsection 4.1 - Sliders


function changeEmissionRate() { // Infrasonic range slider 0 - 20Hz for fundamental frequency
var emissionRate = parseFloat(document.getElementById("rate").value);
emitter.frequency.value = emissionRate;
}

function changeEmissionRateAboveTwenty() {// Audio range slider 20 - 100Hz for fundamental frequency
var emissionRate = parseFloat(document.getElementById("rateTwentyPlus").value); 
emitter.frequency.value = emissionRate; 
}

// functions for the slider to control the fundamental frequency is borrowed and reworked from (Wilson 2013)


function changeFreq() { // controls the frequency of the pulsaret oscillator
var freqValue = parseFloat(document.getElementById("freq").value); // gets data from slider 
osc.frequency.value = freqValue;
}    
    

function changePWM() { //controls the DCOffsetGain node 
var dutyCycle = parseFloat(document.getElementById("pwm").value); // gets data from slider 
DCOffsetGain.gain.value=dutyCycle;
}   
   
// function changeFreq() and changePWM() are borrowed and reworked from (Wilson 2013)
// to accept data from a slider


function changeDCRate() {  // controls play back rate of the buffer with a slider in the HTML document      

var dcBuffRate = parseFloat(document.getElementById("dcRate").value);  // accepts data from slider 'Duty cycle silence ratio envelope rate' slider
                                                                    
source.playbackRate.value = dcBuffRate; // variable goes to play back rate value 

}

 
function changeSlowDCRate() { //data from this slider is in a range from 0.000001 to 0.0003

var dcBuffSlowRate = parseFloat(document.getElementById("slowdcRate").value);  // accepts data from slider 'Duty cycle silence ratio envelope rate' slider
  
 source.playbackRate.value = dcBuffSlowRate; // variable goes to play back rate value 
 
  
}


// changeDCRate function takes data from the slider with "dcRate" id. 
// This method of parsing float numbers from a slider was borrowed and reworked from Oscilloscope (Wilson 2013). 


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////







//Subsection 4.2 - Buttons

function oscOn() {  //  synth is engaged after "on" button is clicked
   osc.start(0);
}

 
function StoparbitraryShaper() {    // disconnects the arbitraryShaper to here the unwaveshped signal 
                                     // of the Pitch Frequency oscillator
                                     // However Pulse Width Modulation is not possible
arbitraryShaper.disconnect();        
 
osc.disconnect(arbitraryShaper);     // disconnects the DCOffsetGain and osc nodes from arbitraryShaper
 
DCOffsetGain.connect(arbitraryShaper);

osc.connect(output);                 // reconnects the DCOffsetGain and osc nodes to the output gain node
DCOffsetGain.connect(output);
  
}


function sine() { // function changes Pitch frequency oscillator to sine
osc.type = 'sine';  
}
function square() { // function changes Pitch frequency oscillator to square
osc.type = 'square';  
}
function saw() { // function changes Pitch frequency oscillator to sawtooth
osc.type = 'sawtooth';  
}
function triangle() { // function changes Pitch frequency oscillator to triangle
osc.type = 'triangle';  
}

// functions sine(), square(), saw(), triangle(), StopSquareWaveShaper(), function oscOff(), function oscOn() all use the 
// same button set up to be activated. Borrowed and reworked from (w3schools n.d.)  



function trainSchedule() { // automate the fundamental frequnecy
  
  var now = audioCtx.currentTime;
   
    emitter.frequency.cancelScheduledValues(now);
 
    emitter.frequency.setValueAtTime(emitter.frequency.value, now);
    
    emitter.frequency.linearRampToValueAtTime(emitter.frequency.value , now + 0.020); 
    
    emitter.frequency.linearRampToValueAtTime(12.4 , now + 3.070); 
    
    emitter.frequency.linearRampToValueAtTime(24.4 , now + 6.100); 
    
    emitter.frequency.linearRampToValueAtTime(1.4 , now + 12.120); 
  
}   
   
// The trainSchedule() automate the fundamental frequency in order envelope it.
// Borrowed and reworked from (Ziya 2013). 
   
 
   
   
   