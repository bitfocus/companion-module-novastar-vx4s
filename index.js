// NovaStar-VX4S

var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.CHOICES_INPUTS = [
	{ id: '0', label: 'DVI' },
	{ id: '1', label: 'HDMI' },
	{ id: '2', label: 'VGA 1' },
	{ id: '3', label: 'VGA 2' },
	{ id: '4', label: 'CVBS 1' },
	{ id: '5', label: 'CVBS 2' },
	{ id: '6', label: 'SDI' },
	{ id: '7', label: 'Display Port' }
]

instance.prototype.CHOICES_DISPLAY_MODES = [
	{ id: '0', label: 'Normal' },
	{ id: '1', label: 'Freeze' },
	{ id: '2', label: 'Black' }
]


instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init_tcp();
}

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.init_tcp();
}

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.port === undefined) {
		self.config.port = 5200;
	}

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug('Network error', err);
			self.log('error','Network error: ' + err.message);
		});

		self.socket.on('connect', function () {
			let cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x02,0x00,0x00,0x00,0x02,0x00,0x57,0x56]);
			self.socket.send(cmd);
			debug('Connected');
		});

		// if we get any data, display it to stdout
		self.socket.on('data', function(buffer) {
			//var indata = buffer.toString('hex');
			//future feedback can be added here
			//console.log(indata);
			console.log('Buffer:', buffer);
		});

	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will connect to a NovaStar VX4S LED Processor.'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'IP Address',
			width: 6,
			default: '192.168.0.1',
			regex: self.REGEX_IP
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug('destroy', self.id);
}

instance.prototype.actions = function() {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		
		'change_input': {
			label: 'Change Input',
			options:
			[
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: self.CHOICES_INPUTS
				}
			]
		},
		'change_display_mode': {
			label: 'Change Display Mode',
			options:
			[
				{
					type: 'dropdown',
					label: 'Display Mode',
					id: 'display_mode',
					default: '0',
					choices: self.CHOICES_DISPLAY_MODES
				}
			]
		},
		'pip_onoff': {
			label: 'Turn Picture In Picture (PIP) On or Off',
			options:
			[
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'value',
					default: '0',
					choices:
					[
						{ id: '0', label: 'Off' },
						{ id: '1', label: 'On' }
					]
				}
			]
		}
		
	});
}

instance.prototype.action = function(action) {

	var self = this;
	var cmd;
	var options = action.options;
	
	var lf = '\u000a';
	
	switch(action.action) {
		case 'change_input':
			switch(options.input) {
				case '0':
					//DVI
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0x10,0xB4,0x56]);
					break;
				case '1':
					//HDMI
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0xA0,0x44,0x57]);
					break;
				case '2':
					//VGA 1
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0x01,0xA5,0x56]);
					break;
				case '3':
					//VGA 2
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0x02,0xA6,0x56]);
					break;
				case '4':
					//CVBS 1
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0x71,0x15,0x57]);
					break;
				case '5':
					//CVBS 2
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0x72,0x16,0x57]);
					break;
				case '6':
					//SDI
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0x40,0xE4,0x56]);
					break;
				case '7':
					//Display Port
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x2D,0x00,0x20,0x02,0x01,0x00,0x90,0x34,0x57]);
					break;
			}
			break;
		case 'change_display_mode':
			switch(options.display_mode) {
				case '0':
					//Normal
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x50,0x00,0x20,0x02,0x01,0x00,0x02,0xC7,0x56]);
					break;
				case '1':
					//Freeze
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x50,0x00,0x20,0x02,0x01,0x00,0x02,0xC8,0x56]);
					break;
				case '2':
					//Black
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x50,0x00,0x20,0x02,0x01,0x00,0x02,0xC9,0x56]);
					break;
			}
			break;
		case 'pip_onoff':
			switch(options.value) {
				case '0':
					//Off
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0xFF,0x00,0x00,0x00,0x00,0x01,0x00,0x30,0x00,0x20,0x02,0x01,0x00,0x00,0xA6,0x57]);
					break;
				case '1':
					//On
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0xFF,0x00,0x00,0x00,0x00,0x01,0x00,0x30,0x00,0x20,0x02,0x01,0x00,0x01,0xA7,0x57]);
			break;
			}
			break;
	}

	if (cmd !== undefined) {
		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd);
		} else {
			debug('Socket not connected :(');
		}

	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;