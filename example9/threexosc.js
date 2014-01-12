var ThreeXOSC = function(audioContext){
	// save the audioContext to the new instance
	this.audioContext = audioContext;
	// creates 3 osc
	this.osc = [];
	this.osc[0] = audioContext.createOscillator();
	this.osc[1] = audioContext.createOscillator();
	this.osc[2] = audioContext.createOscillator();
	
	// creat gain nodes for every osc
	var oscGains = [];
	this.osc.forEach(function(osc, i) {
		var gainNode = audioContext.createGain();
		gainNode.value = 0.5;
		osc.gainNode = gainNode;
		osc.gain = gainNode.gain;
		oscGains.push(osc);
	});
	this.oscGains = oscGains
	//create the gain for the output node
	this.gain = audioContext.createGain();
	this.output = this.gain;
	//set default osc types
	this.osc[0].type = 3;
	this.osc[1].type = 2;
	this.osc[2].type = 1;
	//set default detune values
	this.osc[0].detune.value = 0;
	this.osc[1].detune.value = -1200;
	this.osc[2].detune.value = -2400;
	// we need that because forEach has a different scope
	var output =  this.output;
	this.osc.forEach(function(osc, i) {
		osc.connect(osc.gainNode);
		osc.gainNode.connect(output);
	});
}
//start all of them 
ThreeXOSC.prototype.start = function(t) {
	this.osc.forEach(function(osc) {
		osc.start(t);
	});
}