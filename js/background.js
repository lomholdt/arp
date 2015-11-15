
function getCurrentTab(callback) {
    chrome.tabs.query(
        {  currentWindow: true, active: true, windowType:'normal' },
        function (array) { callback(array[0]); }
    );
}

if (typeof localStorage['soundvolume'] == 'undefined')
	localStorage['soundvolume'] = 1;


var tabs = new Array();
var auto_start_url = localStorage['asurl'];
if (localStorage['autostart'] == "true" && auto_start_url) {
	var default_time = 5000;
	if(localStorage['default_time']) {
		default_time = localStorage['default_time'] * 1000;
	}
	loop_start(-1, default_time, 'C', '', '', auto_start_url);
}
chrome.extension.onConnect.addListener(function(port) {
	if (port.name === 'getOptions') {
		port.onMessage.addListener(function(data) {
			if (data.msg === 'getAllOptions') {
				getCurrentTab( function(tab) {
					var tabIsReloaderActive = tabs[tab.id] || false;
					if (tabIsReloaderActive) {
						port.postMessage({status:tabs[tab.id].status, time_interval:tabs[tab.id].interval_time, time_type:tabs[tab.id].time_type, checkme:tabs[tab.id].checkme, wait_time:tabs[tab.id].wait_time});
					}
				});
			}
		});
	}
});


var RELOAD_LIMIT = 10;
var counters = {}; // TODO: tabs[id].count
var pending_reloads = {};
var blank_page = chrome.extension.getURL('blank.html');//'about:blank'; //

function updateTab(tabId, theurl){
  try {
  	counters[tabId] = counters[tabId] || 0;
  	counters[tabId] += 1;

  	/// NOTE: Blank page isn't used for now
  	//if (counters[tabId] < RELOAD_LIMIT) {
  	if (true) {
  		//pro: scroll position, contra: predefined URL
  		//var details = {code: "window.location.reload(true)"};
  		//chrome.tabs.executeScript(tabId, details);
    	chrome.tabs.update(tabId, {url: theurl});
  	}
    else {
    	// make sure we're cycling in a blank page to release leaked memory
    	counters[tabId] = 0;
    	pending_reloads[tabId] = theurl;
    	updateTabWithBlankSandwich(tabId, theurl);
    	//chrome.tabs.update(tabId, {url: blank_page});
    }
  } catch (e) {
    alert(e);
  }
}

function updateTabWithBlankSandwich(tabId, url) {
	chrome.tabs.update(tabId, {url: blank_page});
}

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
	  if (	info.url == blank_page &&
	  			pending_reloads[tabId] &&
	  			info.status == 'loading') 
	  {
		delete pending_reloads[tabId];
	  }
});



function real_start(tabId, actionUrl) {
	stopBadgeTimer(tabId);
	tabs[tabId]['status'] = 'start';
	chrome.tabs.onUpdated.addListener(onUpdateListener);
	reload_it(tabId, actionUrl);
}

function get_rand_time(tmin, tmax) {
	var rand_time = Math.round(Math.random()*(tmax-tmin-0)) + (tmin - 0);
	return rand_time;
}

function loop_start(waitTime, interval_time, interval_type, checkme, page_monitor_pattern, predefined_url) {

	getCurrentTab( function(tab) {
		var currentTabId = tab.id;

		//For restore scroll bar
		chrome.tabs.sendMessage(currentTabId, {pattern: "C"}, null);
		if (tabs[currentTabId]) {
			reload_cancel(tab.id, "no");
		}

		tabs[currentTabId] = new Array();
		if(predefined_url) {
			tabs[currentTabId]['pre_url'] = predefined_url;
			tabs[currentTabId]['action_url'] = predefined_url;
		} else {
			tabs[currentTabId]['action_url'] = tab.url;
		}
		tabs[currentTabId]['interval_time'] = interval_time;
		if(interval_type == 'rand') {
			var min_max_arr = interval_time.split("-");
			var interval_time_tmp = get_rand_time(min_max_arr[0], min_max_arr[1]);
			tabs[currentTabId]['time_between_load'] = interval_time_tmp * 1000;
		} else {
			tabs[currentTabId]['time_between_load'] = interval_time;
		}
		tabs[currentTabId]['time_type'] = interval_type;
		tabs[currentTabId]['next_round'] = tabs[currentTabId]['time_between_load']/1000;
		if(checkme) {
			tabs[currentTabId]['checkme'] = checkme;
		}
		if(page_monitor_pattern) {
			tabs[currentTabId]['pmpattern'] = page_monitor_pattern;
		}

		tabs[currentTabId]['count'] = 0;
		var the_action_url = tabs[currentTabId]['action_url'];
		if(waitTime == -1) {
			tabs[currentTabId]['status'] = 'start';
			tabs[currentTabId]['wait_time'] = 0;
			tabs[currentTabId]['wait_next_round'] = 0;

			if(tabs[currentTabId].displayTimer) {
				stopBadgeTimer(currentTabId);
			}
			real_start(currentTabId, the_action_url);
		} else {
			tabs[currentTabId]['wait_time'] = waitTime;
			var timeDelay = 0;

			//Timer mode 2
			if(waitTime.toString().search(" ") > 0) {
				tabs[currentTabId]['status'] = 'wait';
				timeDelay = (new Date(waitTime)).getTime() - (new Date()).getTime();
				tabs[currentTabId]['wait_next_round'] = Math.floor(timeDelay/1000);
			//Timer mode 1
			} else {
				tabs[currentTabId]['status'] = 'wait';
				timeDelay = waitTime;
				tabs[currentTabId]['wait_next_round'] = waitTime/1000;
			}

			tabs[currentTabId].displayTimer = window.setInterval(function(tabId) {
				tabs[tabId].wait_next_round--;
				setTimerBadgeText(tabId);
			}, 1000, currentTabId);
			setTimeout(function(){real_start(currentTabId, the_action_url)}, timeDelay);
		}
	});
}

function loop_stop() {
	getCurrentTab( function(tab) {
		chrome.tabs.sendMessage(tab.id, {pattern: "D"}, null);
		reload_cancel(tab.id, "no");
	});
}

function onUpdateListener(tabId, changeInfo, tab) {

	if (tab.url == blank_page) return;

	chrome.browserAction.setBadgeText({text:'', tabId:tabId});
	var tabIsReloaderActive = (tabs[tabId] || false) && (tabs[tabId].status == 'start' || false) && (tabs[tabId].time_between_load > 0 || false);
	if (tabIsReloaderActive) {

		if (changeInfo['status'] === 'loading') {
			var urlChanged=changeInfo['url'] || false;
			if(tabs[tabId]['pre_url']) {
				tabs[tabId]['action_url'] = tabs[tabId]['pre_url'];
			} else if (urlChanged) {
				tabs[tabId]['action_url'] = urlChanged;
			}
		} else if (changeInfo['status'] === 'complete') {
			if(tabs[tabId]['time_type'] == 'rand') {
				var min_max_arr = tabs[tabId]['interval_time'].split("-");
				var interval_time_tmp = get_rand_time(min_max_arr[0], min_max_arr[1]);
				tabs[tabId]['time_between_load'] = interval_time_tmp * 1000;
			}
			tabs[tabId].next_round = tabs[tabId].time_between_load/1000;
			setTheBadgeText(tabId);
			setupReloadTimer(tabId);
			stopBadgeTimer(tabId);
			tabs[tabId].displayTimer = window.setInterval(function(tabId) {
					tabs[tabId].next_round--;
					setTheBadgeText(tabId);
				}, 1000, tabId);
		}
	}
}

function setupReloadTimer(tabId) {
	if (tabs[tabId].reloadTimer) {
		clearTimeout(tabs[tabId].reloadTimer);
		tabs[tabId].reloadTimer = null;
	}
	tabs[tabId].reloadTimer = window.setTimeout(function(tabId) {
			reload_it(tabId, tabs[tabId]['action_url']);
		}, tabs[tabId].time_between_load, tabId);
}

function stopBadgeTimer(tabId) {
	if (tabs[tabId].displayTimer || false) {
		clearTimeout(tabs[tabId].displayTimer);
		tabs[tabId].displayTimer = null;
	}
}

function setTimerBadgeText(tabId) {
	chrome.browserAction.setBadgeBackgroundColor({color:[0, 128, 0, 255], tabId:tabId});
	var badgeText = String(tabs[tabId].wait_next_round);
	var secs = tabs[tabId].wait_next_round%60;
	var mins = Math.floor((tabs[tabId].wait_next_round/60)%60);
	var hours = Math.floor((tabs[tabId].wait_next_round/(60*60))%24);
	var days = Math.floor((tabs[tabId].wait_next_round/(60*60*24)));
	if (days > 999) {
		badgeText = '9...';
	} else if (days > 9) {
		badgeText = String(days) + 'd';
	} else if (days > 0) {
		badgeText = String(days) + 'd' + String(hours) + 'h';
	} else if (hours > 0) {
		if (mins < 10) {
			mins = '0' + String(mins);
		}
		if (secs % 2) {
			var blinker = ':';
		} else {
			var blinker = ' ';
		}
		badgeText = String(hours) + blinker + String(mins);
	} else {
		if (secs < 10) {
			secs = '0' + String(secs);
		}
		badgeText = String(mins) + ':' + String(secs);
	}
	chrome.browserAction.setBadgeText({text:badgeText, tabId:tabId});
}

function setTheBadgeText(tabId) {
	if (tabs[tabId].next_round < 0) {
			chrome.browserAction.setBadgeText({text:String(), tabId:tabId});
			stopBadgeTimer(tabId);
	} else {
		var badgeText = String(tabs[tabId].next_round);
		var secs = tabs[tabId].next_round%60;
		var mins = Math.floor((tabs[tabId].next_round/60)%60);
		var hours = Math.floor((tabs[tabId].next_round/(60*60))%24);
		var days = Math.floor((tabs[tabId].next_round/(60*60*24)));
		if (days > 999) {
			badgeText = '9...';
		} else if (days > 9) {
			badgeText = String(days) + 'd';
		} else if (days > 0) {
			badgeText = String(days) + 'd' + String(hours) + 'h';
		} else if (hours > 0) {
			if (mins < 10) {
				mins = '0' + String(mins);
			}
			if (secs % 2) {
				var blinker = ':';
			} else {
				var blinker = ' ';
			}
			badgeText = String(hours) + blinker + String(mins);
		} else {
			if (secs < 10) {
				secs = '0' + String(secs);
			}
			badgeText = String(mins) + ':' + String(secs);
		}
		chrome.browserAction.setBadgeText({text:badgeText, tabId:tabId});
	}
}

// notificationId => fn callback
var onClickForNotifications = {};
var onCloseForNotifications = {};

function fireNotificationClick(id) {
	onClickForNotifications[id] && onClickForNotifications[id]();
}

function fireNotificationClose(id) {
	onCloseForNotifications[id] && onCloseForNotifications[id]();
}

chrome.notifications.onClicked.addListener(function (id) {
	fireNotificationClick(id);
});

chrome.notifications.onButtonClicked.addListener(function (id, button) {
	if (button == 0) // show tab
		fireNotificationClick(id);
	else if (button == 1) // dismiss
		fireNotificationClose(id);
});

chrome.notifications.onClosed.addListener(function (id) {
	fireNotificationClose(id);
	delete onCloseForNotifications[id];
	delete onClickForNotifications[id];
});

function show_notification(pmpattern, check_content, onclick) {
	var action = (pmpattern == 'B') ? 'Lost' : 'Found';
	var time = /(..):(..)/.exec(new Date);       // The prettyprinted time.
	var hour = time[1] % 12 || 12;               // The prettyprinted hour.
	var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
	var options = {
	  type: "basic", // hour + ':' + time[2] + ' ' + period,
	  title: action + " the target text! - ARP",
	  message: "\"" + check_content  + "\"",
	  iconUrl: "Icon/icon-80.png",
	  contextMessage: "Click on this box to see the tab.",
	  buttons: [{title: "Show tab"}, {title: "Dismiss"}],
	  isClickable: true
	}
	
	var notification = new Notification(
		options.title,
		{
			body: "\n" + options.message + "\n\n" + options.contextMessage,
			icon: "Icon/icon-128.png"
		}
	);
	notification.onclick = function() {
			onclick && onclick();
			pause_sound();
	};
	notification.onclose = pause_sound;

	var sound_file = '';
	if(localStorage['sound'] && localStorage['sound'] == '2') {
		sound_file = './sound/sound1.mp3';
	} else if(localStorage['sound'] && localStorage['sound'] == '3') {
		sound_file = './sound/sound2.mp3';
	} else if(localStorage['sound'] && localStorage['sound'] == '4') {
		if(localStorage['soundurl']) {
			sound_file = localStorage['soundurl'];
		} else {
			sound_file = './sound/sound1.mp3';
		}
	}

	function pause_sound() {
		pause_sound_with_fadeout(sound_elem);
	}

	var sound_elem = document.getElementById("sound_elem");
	//var pause_sound = sound_elem.pause.bind(sound_elem);
	if (sound_file) {
		sound_elem.src = sound_file;
		sound_elem.loop = (localStorage['pm_sound_til'] != 'sound');
		sound_elem.play();
		sound_elem.volume = localStorage['soundvolume'];
		if (localStorage['pm_sound_til'] == 'timeout') {
			setTimeout(pause_sound, localStorage['pm_sound_timeout']*1000 || 5000);
		}
	}
}

function pause_sound_with_fadeout(sound) {
	if (!sound) return;
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

function reload_it(tabId, tab_url) {

	if(tabs[tabId]['checkme']) {
		var check_content = tabs[tabId]['checkme'];
		var pmpattern = tabs[tabId]['pmpattern'];

		if(tabs[tabId]['count'] == 0) {
			updateTab(tabId, tab_url);
		} else {
			chrome.tabs.sendMessage(tabId, {checkme: check_content, pattern: pmpattern}, function(response) {
			if (response.findresult == "yes") {
				reload_cancel(tabId, 'yes');
				// notification & tab handling
				chrome.tabs.get(tabId, function (tab) {
					chrome.windows.getLastFocused({}, function (lastFocusedWindow) {
						// draw attention to target window if it's not focused inside Chrome
						// (or not focused at all) and switch to the target tab
						if (lastFocusedWindow.id != tab.windowId || !lastFocusedWindow.focused) {
							chrome.windows.update(tab.windowId, {drawAttention: true});
							chrome.tabs.update(tabId, {active: true});
						}
						// show notification box
						show_notification(pmpattern, check_content, function () {
							// switch to target tab & its window upon clicking the box
							chrome.tabs.update(tabId, {active: true});
							chrome.windows.update(tab.windowId, {focused: true});
						});
					});
				});
			} else {
				chrome.browserAction.setBadgeText({text:'', tabId:tabId});
				updateTab(tabId, tab_url);
			 }
			});
		}
	} else {
		chrome.browserAction.setBadgeText({text:'', tabId:tabId});
		updateTab(tabId, tab_url);
	}
	tabs[tabId]['count']++;
}

function reload_cancel(tabId, content_detect) {

   if (tabs[tabId].reloadTimer) {
            clearTimeout(tabs[tabId].reloadTimer);
            tabs[tabId].reloadTimer = null;
   }
	if (tabs[tabId].displayTimer) {
		clearTimeout(tabs[tabId].displayTimer);
		tabs[tabId].displayTimer = null;
	}
	tabs[tabId].status = 'stop';
	tabs[tabId].next_round = 0;
	if(content_detect == "yes") {
		chrome.browserAction.setBadgeText({text:"YES", tabId:tabId});
	} else {
		chrome.browserAction.setBadgeText({text:"", tabId:tabId});
	}
}
