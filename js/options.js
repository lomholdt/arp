
var default_options = {}

$(document).ready(function(){
  read_options();
  //$("#sel1").click(function(){ tab_click(1); });
  $("#save").click(save_options);
  $("#cancel").click(function(){ window.close(); });
  init();
});


function getId(id) { return document.getElementById(id); }

// Option to save current value to localstorage
function save_options(){
	if(getId('default_time').value < 0) {
		getId('default_time').value = 0;
	}

	localStorage['default_time'] = getId('default_time').value;
	localStorage['random_time'] = getId('randomTime').checked
	localStorage['autostart'] = getId('autostart').checked;
	localStorage['asurl'] = getId('asurl').value;
	localStorage['pdcheck'] = getId('pdcheck').checked
	localStorage['pdurl'] = getId('pdurl').value;
	localStorage['timercheck'] = getId('timercheck').checked;


	if(getId('timer01').checked) {
		localStorage['timermode'] = '1';
	} else {
		localStorage['timermode'] = '2';
	}

	localStorage['pmonitor'] = getId('pmonitor').checked

	if(getId('pagemr01').checked) {
		localStorage['pmpattern'] = 'A';
	} else {
		localStorage['pmpattern'] = 'B';
	}

	if(getId('pmsound01').checked) {
		localStorage['sound'] = '1';
	} else if(getId('pmsound02').checked) {
		localStorage['sound'] = '2';
	} else if(getId('pmsound03').checked) {
		localStorage['sound'] = '3';
	} else if(getId('pmsound04').checked) {
		localStorage['sound'] = '4';
	}

	localStorage['soundurl'] = getId('soundurl').value;
	localStorage['soundvolume'] = getId('soundvolume').value;

	// notification closing
	if (getId('pm_sound_til_click').checked) {
		localStorage['pm_sound_til'] = 'click';
	} else if (getId('pm_sound_til_sound').checked) {
		localStorage['pm_sound_til'] = 'sound';
	} else if (getId('pm_sound_til_timeout').checked) {
		localStorage['pm_sound_til'] = 'timeout';
	}

	localStorage['pm_sound_timeout']  = getId('pm_sound_timeout').value;


  localStorage.support = !(document.getElementById("dontsupport").checked);///

	show_save_animation();
}

function read_options(){
	if(localStorage['default_time']) {
		getId('default_time').value = localStorage['default_time'];
	}

 	getId('randomTime').checked  = (localStorage['random_time'] == 'true');
 	getId('autostart').checked  = (localStorage['autostart'] == 'true');
 	getId('pdcheck').checked  = (localStorage['pdcheck'] == 'true');
 	getId('pmonitor').checked  = (localStorage['pmonitor'] == 'true');
 	getId('timercheck').checked  = (localStorage['timercheck'] == 'true');

	getId('asurl').value = localStorage['asurl'] || '';

		// timer
	if(localStorage['timermode']) {
		if(localStorage['timermode'] == '1') {
			getId('timer01').checked = true;
		} else if(localStorage['timermode'] == '2') {
			getId('timer02').checked = true;
		}
	} else {
		getId('timer01').checked = true;
	}
	if(localStorage['pmpattern'] && localStorage['pmpattern'] == 'B') {
		getId('pagemr02').checked = true;
	} else {
		getId('pagemr01').checked = true;
	}

 	// sound
	if(localStorage['sound'] && localStorage['sound'] == '2') {
		getId('pmsound02').checked = true;
	} else if(localStorage['sound'] && localStorage['sound'] == '3') {
		getId('pmsound03').checked = true;
	} else if(localStorage['sound'] && localStorage['sound'] == '4') {
		getId('pmsound04').checked = true;
	} else {
		getId('pmsound01').checked = true;
	}
	getId('soundvolume').value = localStorage['soundvolume'];

	getId('pdurl').value = localStorage['pdurl'] || '';
	getId('soundurl').value = localStorage['soundurl'] || '';


	// notification closing
	if (!localStorage['pm_sound_til']) {
		localStorage['pm_sound_til'] = 'click';
	}
	getId('pm_sound_til_' + localStorage['pm_sound_til']).checked = true;
	getId('pm_sound_timeout').value = localStorage['pm_sound_timeout'] || 5;

	document.getElementById("dontsupport").checked = (localStorage.support == "false");///
}


function show_save_animation() {
	var style = getId('saved').style;
	style.zIndex = 100;
	style.opacity = 1;
	//getId('tab1').style.opacity = .5;
	setTimeout(function () {
		//getId('tab1').style.opacity = 1;
		style.opacity = 0;
		setTimeout(function () {
			style.zIndex = -1;
		}, 150+10);
	}, 800);
}


var sound = new Audio();
var is_sound_playing = false;
var volume_change_timer;
var volume_fadeout_timer;

function play_sound() {
	clearInterval(volume_fadeout_timer);
	if (getId('pmsound02').checked)
		var sound_file = './sound/sound1.mp3';
	else if(getId('pmsound03').checked)
		var sound_file = './sound/sound2.mp3';
	else if(getId('pmsound04').checked)
		var sound_file = getId('soundurl').value;

	if (sound_file) {
		sound.volume = getId('soundvolume').value;
		sound.src = sound_file;
		sound.play();
	}
}

function pause_sound() {
	sound.pause();
}

function pause_sound_with_fadeout(sound) {
	var volume = sound.volume;
	volume_fadeout_timer = setInterval(function() {
		if (volume > 0) {
			volume -= 0.05;
			sound.volume = Math.max(volume, 0);
		} else {
			clearInterval(volume_fadeout_timer);
			sound.pause();
		}
	}, 16)
}

function init() {
	getId('test-play').onclick = play_sound;
	var soundoptions = document.getElementsByClassName('pmsound');
	[].forEach.call(soundoptions, function (soundoption) {
		soundoption.onclick = play_sound;
	});

	getId('soundvolume').onchange = function() {
		sound.volume = this.value;
		if (sound.paused)
			play_sound();
		clearTimeout(volume_change_timer);
		volume_change_timer = setTimeout(function () {
			//sound.pause();
			pause_sound_with_fadeout(sound);
		}, 2000)
	}

	getId('incognito').onclick = function() {
		chrome.tabs.create({url: getId('incognito').href, active: true})
	}
}
