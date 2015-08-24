
function getId(id) { return document.getElementById(id); }

$(document).ready(function(){

	// if we showed new options right away
	// there would be no scrollbars (wtf)
  setTimeout(restoreOptions, 1);
  
  $("#startbtn").click(startRefresh);

  $("#r08").click(function(){ getId('tcustom').focus(); });
  $("#tcustom").focus(function(){ getId('r08').checked = true; });

  $("#r07").click(function(){ getId('tmin').focus(); });
  $("#tmin").focus(function(){ getId('r07').checked = true; });
  $("#tmax").focus(function(){ getId('r07').checked = true; });

  $("#timerbtn").click(startTimer);
});


function get_interval( )
{
  var time_result = new Array();
  var interval_time = 5000;
  var radio_arr = document.getElementsByName("reloadOption");
  var total = radio_arr.length;

  for(i=0;i<total;i++) {
	if(radio_arr[i].checked) {
		if(radio_arr[i].value == 'rand') {
			var tmin = $("#tmin").val() - 0;
			var tmax = $("#tmax").val() - 0;
			//tmin should < tmax
			if(tmin > tmax) {
				interval_time = tmax+'-'+tmin;
			} else {
				interval_time = tmin+'-'+tmax;
			}
			time_result[0] = interval_time;
			time_result[1] = 'rand';
		}else if(radio_arr[i].value == 'custom') {
			var tcustom = $("#tcustom").val() - 0;
			if(tcustom < 0) {
				interval_time = 1000;
				$("#tcustom").val("1");
			} else {
				interval_time = Math.round(tcustom * 1000);
			}
			time_result[0] = interval_time;
			time_result[1] = 'custom';
		} else {
			interval_time = radio_arr[i].value;
			time_result[0] = interval_time;
			time_result[1] = 'stand';
		}
	}
  }

  return time_result;
}

function set_interval(time_interval, time_type) {

  if(time_type == 'custom') {
    getId('r08').checked = true;
    var tcustom_inp = getId("tcustom");
    tcustom_inp.value = Math.floor(time_interval / 1000);
	return;
  } else if(time_type == 'rand') {
	getId('r07').checked = true;
	var min_max_arr = time_interval.split("-");
    getId("tmin").value = min_max_arr[0];
	getId("tmax").value = min_max_arr[1];
	return;
  }

  var radio_arr = document.getElementsByName("reloadOption");
  var total = radio_arr.length;
  for(i=0;i<total;i++) {
    if(radio_arr[i].value == time_interval) {
        radio_arr[i].checked = true;
        return;
    }
  }
}

function startRefresh() {
  if ( getId("startbtn").value == "Start" ) {

  	getId("startbtn").classList.add("stop");
    getId("startbtn").value = "Stop";

		getId("timerbtn").value = "Start Timer";
		getId("timerbtn").classList.remove("stop");

		var myInterval = get_interval();
		var views = chrome.extension.getViews();
		var checkme = getId("contentid").value;
		var preurl = getId("pdurlinp").value;

    for (var i in views) {
			if(checkme) {
				var page_monitor_pattern = getId("pmpattern").value;
				if (views[i].loop_start) {
					views[i].loop_start(-1, myInterval[0], myInterval[1], checkme, page_monitor_pattern, preurl);
				}
			} else {
				if (views[i].loop_start) {
					views[i].loop_start(-1, myInterval[0], myInterval[1], null, null, preurl);
				}
			}
		}
  } else {
    getId("startbtn").value = "Start";
    getId("startbtn").classList.remove("stop");
    var views = chrome.extension.getViews();
    for (var i in views) {
        if (views[i].loop_stop) {
            views[i].loop_stop();
        }
    }
  }
}

function startTimer() {
  if (getId("timerbtn").value == "Start Timer" ) {
	var myInterval = get_interval();
	var checkme = getId("contentid").value;
	var preurl = getId("pdurlinp").value;

  	var timer_mode = getId("timermode").value;

  	if(timer_mode == "1") {
		var tHour = parseInt(getId("timerHour").value);
		var tMin = parseInt(getId("timerMin").value);
		var tSec = parseInt(getId("timerSec").value);
		if(isNaN(tHour)) {tHour = 0;getId("timerHour").value = "0";}
		if(isNaN(tMin)) {tMin = 0;getId("timerMin").value = "0";}
		if(isNaN(tSec)) {tSec = 0;getId("timerSec").value = "0";}
	
		var waitTime = (tHour * 3600 + tMin * 60 + tSec) * 1000;
	
		if(waitTime <= 0) {
			//alert("Counddown can't be 0!");
		} else {
			var views = chrome.extension.getViews();
			for (var i in views) {
				if(checkme) {
					var page_monitor_pattern = getId("pmpattern").value;
					if (views[i].loop_start) {
						views[i].loop_start(waitTime, myInterval[0], myInterval[1], checkme, page_monitor_pattern, preurl);
					}
				} else {
					if (views[i].loop_start) {
						views[i].loop_start(waitTime, myInterval[0], myInterval[1], null, null, preurl);
					}
				}
			}
			getId("timerbtn").value = "Cancel Timer";
			getId("timerbtn").classList.add("stop");

			getId("startbtn").value = "Start";
			getId("startbtn").classList.remove("stop");
		}
	} else {
		var dateStr = getId("dateInp").value;
		var dDate = new Date(dateStr);
		if(isNaN(dDate)) {
			//alert("Date is invalid.<br>The format must be yyyy-MM-dd, e.g., 2012-09-21");
			return;
		}
		var dateTimeStr = dateStr+" "+getId("timeInp").value;
		var dTime = new Date(dateTimeStr);
		if(isNaN(dTime)) {
			//alert("Time is invalid.<br>The format must be HH:mm:ss, e.g., 23:10:11");
			return;
		}
		var now = new Date();
		if(now.getTime() >= dTime.getTime()) {
			//alert("Date time can't be earlier than the current time!");
		} else {
			var the_month =  dTime.getMonth() + 1;
			var dDate = dTime.getFullYear() + "/" + the_month + "/" + dTime.getDate();
			var dTime = dTime.getHours() + ":" + dTime.getMinutes() + ":" + dTime.getSeconds();
			var waitTime = dDate+" "+dTime;
			var views = chrome.extension.getViews();
			for (var i in views) {
				if(checkme) {
					var page_monitor_pattern = getId("pmpattern").value;
					if (views[i].loop_start) {
						views[i].loop_start(waitTime, myInterval[0], myInterval[1], checkme, page_monitor_pattern, preurl);
					}
				} else {
					if (views[i].loop_start) {
						views[i].loop_start(waitTime, myInterval[0], myInterval[1], null, null, preurl);
					}
				}
			}
			getId("timerbtn").value = "Cancel Timer";
			getId("timerbtn").classList.add("stop");

			getId("startbtn").value = "Start";
			getId("startbtn").classList.remove("stop");
		}
	}
  } else {
    getId("timerbtn").value = "Start Timer";
    getId("timerbtn").classList.remove("stop");
    var views = chrome.extension.getViews();
    for (var i in views) {
        if (views[i].loop_stop) {
            views[i].loop_stop();
        }
    }
  }
}

function restoreOptions() {
	if(localStorage['default_time']) {
		set_interval(localStorage['default_time']*1000, "custom");
	}
	if(localStorage['random_time'] == 'true') {
		$('#randombox').show();
	}
	if(localStorage['pmonitor'] && localStorage['pmonitor'] == 'true'){
		$('#monitorbox').show();
		if(localStorage['pmpattern'] && localStorage['pmpattern'] == 'B') {
			$('#pagemr02').show();
			$('#pagemr01').hide();
			$('#pmpattern').val("B");
		} else {
			$('#pagemr02').hide();
			$('#pagemr01').show();
			$('#pmpattern').val("A");
		}
	}
	if(localStorage['pdcheck'] && localStorage['pdcheck'] == 'true'){
		$('#pdurlbox').show();
		var pdurl = localStorage['pdurl'];
		$('#pdurlinp').val(pdurl);
	}
	if(localStorage['timercheck'] && localStorage['timercheck'] == 'true') {
		$('#timerbox').show();
		if(localStorage['timermode'] == "1") {
			$('#countdownMode').show();
			$('#timermode').val("1");
		} else {
			$('#timermode').val("2");
			$('#dateMode').show();
			//10 minutes later
			var nowTime = new Date((new Date()).getTime() + 600000);
			var theMonth = nowTime.getMonth() + 1;
			if(theMonth < 10) {
				theMonth = "0"+theMonth;
			}
			var dDate = nowTime.getFullYear() + "/" + theMonth + "/" + nowTime.getDate();
			var dTime = nowTime.getHours() + ":" + nowTime.getMinutes() + ":" + nowTime.getSeconds();
			$('#dateInp').val(dDate);
			$('#timeInp').val(dTime);
		}
	}
	var port = chrome.extension.connect({name: "getOptions"});
	port.onMessage.addListener(recvData);
	port.postMessage({msg:'getAllOptions'});

	// quick fix for mac scrollbar
	document.body.style.paddingRight = '11px';
}

function recvData(data){
	if(data.status == 'start') {
		getId("startbtn").value = "Stop";
		getId("startbtn").classList.add("stop");
	} else if(data.status == 'wait') {
		getId("timerbtn").value = "Cancel Timer";
		getId("timerbtn").classList.add("stop");
	} else {
		getId("startbtn").value = "Start";
		getId("startbtn").classList.remove("stop");
		getId("timerbtn").value = "Start Timer";
		getId("timerbtn").classList.remove("stop");
	}

	set_interval(data.time_interval, data.time_type);
	if(data.checkme) {
		getId('contentid').value = data.checkme;
	}

	if(data.wait_time) {
		//console.log(data.wait_time.toString());
		if(data.wait_time.toString().search(" ") == -1) {
			var waitTime = data.wait_time / 1000;
			var tHour = Math.floor(waitTime / 3600);
			var tMin = Math.floor((waitTime - tHour * 3600) / 60);
			var tSec = Math.floor(waitTime - (tHour * 3600) - (tMin * 60));
			getId('timerHour').value = tHour;
			getId('timerMin').value = tMin;
			getId('timerSec').value = tSec;
			$('#timermode').val("1");
		} else {
			var nowTime = new Date(data.wait_time);
			var theMonth = nowTime.getMonth() + 1;
			if(theMonth < 10) {
				theMonth = "0"+theMonth;
			}
			var theDate = nowTime.getDate() + 1;
			if(theDate < 10) {
				theDate = "0"+theDate;
			}
			var theMin = nowTime.getMinutes() + 1;
			if(theMin < 10) {
				theMin = "0"+theMin;
			}
			var theSec = nowTime.getSeconds() + 1;
			if(theSec < 10) {
				theSec = "0"+theSec;
			}
			var dDate = nowTime.getFullYear() + "/" + theMonth + "/" + nowTime.getDate();
			var dTime = nowTime.getHours() + ":" + theMin + ":" + theSec;
			$('#dateInp').val(dDate);
			$('#timeInp').val(dTime);
			$('#timermode').val("2");
		}
	}
}

var scrollRoot = document.body;
var header = getId('header');
var is_scrolling = true;

function update() {
	if (is_scrolling) {
		if (scrollRoot.scrollTop)
			header.classList.add('scrolled');
		else
			header.classList.remove('scrolled');
		is_scrolling = false;
	}
	requestAnimationFrame(update);
}
update();

document.onscroll = function () {
	is_scrolling = true;
}
