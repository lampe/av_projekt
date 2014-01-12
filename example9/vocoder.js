var Vocoder = function(audioContext, Bands){
	//set default Bands
	Bands = Bands || 64;
	//save audioContext
	this.audioContext = audioContext;

	this.gain = audioContext.createGain();
	this.modulatorEnvelopes = [];
	this.modulatorGain = audioContext.createGain();
	this.carrierGains = [];
	this.carrierFilters = [[], []];
	this.carrierGain = audioContext.createGain();
	this.output = this.gain;
	this.carrierInput = this.carrierGain;
	this.modulatorInput = this.modulatorGain;
	this.modulator = null;


	//we need to get more bounds on the lower frequencys
	this.freqBounds = (function(freqStart, freqEnd, Bands) {
		var bounds = [];
		var pStart = Math.log(freqStart);
		var pEnd = Math.log(freqEnd);
		var	pDel = (pEnd - pStart) / Bands;

		for (var i = 0; i < Bands; i++) {
			bounds.push(Math.exp(pStart + i * pDel));
		}
		return bounds;
	})(200, 4800, Bands); // a little bit more then 44 000 khz

	/// Configuration
	this.gain.gain.value = 1;
	this.carrierGain.gain.value = 1;
	this.modulatorGain.gain.value = 1;

	/// Nodes for each band on the carrier side
	for (var i = 0; i < Bands; i++) {
		var bandGain = audioContext.createGain();
		var filter1 = audioContext.createBiquadFilter();
		var filter2 = audioContext.createBiquadFilter();
		//lets get the middle
		var f0 = (this.freqBounds[i] + this.freqBounds[i+1]) / 2;
		if (isNaN(f0)) return;
		//we need the 
		var bandwidth = (this.freqBounds[i+1] - this.freqBounds[i]);

		/// Envelope follower
		var envelope = this.vocoderBandMeter(audioContext, f0, bandwidth);
		this.modulatorGain.connect(envelope.input);
		this.modulatorEnvelopes.push(envelope);

		/// Gain node
		bandGain.gain.value = 0;
		bandGain.connect(this.gain);
		envelope.output.connect(bandGain.gain);
		this.carrierGains.push(bandGain);

		/// Second filter
		filter2.type = filter2.BANDPASS;
		filter2.frequency.value = f0;
		filter2.Q.value = f0 / bandwidth;
		filter2.connect(bandGain);
		this.carrierFilters[1].push(filter2);

		/// First filter
		filter1.type = filter1.BANDPASS;
		filter1.frequency.value = f0;
		filter1.Q.value = f0 / bandwidth;
		filter1.connect(filter2);
		this.carrierFilters[0].push(filter1);
		this.carrierGain.connect(filter1);
	}
}
Vocoder.prototype.initModulator = function() {
	// Get microphone input
	var self = this;
	navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	navigator.getUserMedia({audio: true, video: false}, function(stream) {
		self.modulator = self.audioContext.createMediaStreamSource(stream);
		self.modulator.connect(self.modulatorInput);
	}, function(error){alert(error.name)});
}

Vocoder.prototype.squareSignal = function(ev) {
	var inp = ev.inputBuffer.getChannelData(0);
	var out = ev.outputBuffer.getChannelData(0);
	for (var i = 0, n = inp.length; i < n; ++i) {
		out[i] = inp[i]*inp[i];
	}
}
Vocoder.prototype.sqrtSignal = function(ev) {
	var inp = ev.inputBuffer.getChannelData(0);
	var out = ev.outputBuffer.getChannelData(0);
	for (var i = 0, n = inp.length; i < n; ++i) {
		out[i] = inp[i] > 0 ? 8 * Math.sqrt(inp[i]) : 0; // sqrt + little boost
	}
}

Vocoder.prototype.vocoderBandMeter = function(context, f0, bandwidth) {
	if (isNaN(f0)) return;
	var sys = {};

	sys.sqrt = context.createScriptProcessor(512, 1, 1); // sqrt node
	sys.lowpass = context.createBiquadFilter();
	sys.square = context.createScriptProcessor(256, 1, 1);
	sys.bandpass2 = context.createBiquadFilter();
	sys.bandpass1 = context.createBiquadFilter();

	sys.output = sys.sqrt;
	sys.input = sys.bandpass1;

	sys.sqrt.onaudioprocess = this.sqrtSignal;

	sys.lowpass.type = sys.lowpass.LOWPASS;
	sys.lowpass.frequency.value = 50;
	sys.lowpass.connect(sys.sqrt);

	sys.square.onaudioprocess = this.squareSignal;
	sys.square.connect(sys.lowpass);

	sys.bandpass2.type = sys.bandpass2.BANDPASS;
	sys.bandpass2.frequency.value = f0;
	
	sys.bandpass2.Q.value = f0 / bandwidth;
	sys.bandpass2.connect(sys.square);

	sys.bandpass1.type = sys.bandpass1.BANDPASS;
	sys.bandpass1.frequency.value = f0;
	sys.bandpass1.Q.value = f0 / bandwidth;
	sys.bandpass1.connect(sys.bandpass2);

	return sys;
}