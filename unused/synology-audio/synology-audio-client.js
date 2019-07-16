
import { fireEvent, registerUrlApplication, generateButton, appDisable, appEnable } from '../../client-api.js';
import { myFetch } from '../../utils.js';

const appName = 'audio';
let lastState = false;

// TODO: change check to use is-available
function check() {
	myFetch('/synology-audio/webapi/AudioStation/remote_player_status.cgi?'
	+ '_dc=1538833384301&SynoToken=Qlq65TfjvM0Ow&api=SYNO.AudioStation.RemotePlayerStatus&method=getstatus'
	+ '&id=__SYNO_USB_PLAYER__'
	+ '&additional=song_tag%2Csong_audio%2Csubplayer_volume'
	+ '&version=1', { format: 'json' })
		.then(json => {
			const data = json.data;
			// "state": "playing"
			if (data && 'state'in data && data.state == 'playing') {
				if (lastState == false) {
					appEnable(appName);
				}
				fireEvent('audio.playing', data);
				lastState = true;
			} else {
				if (lastState == true) {
					appDisable(appName);
					fireEvent('audio.unreachable');
				}
				lastState = false;
			}
		}, _err => { /* console.error(_err); throw _err; */ })
		.finally(() => {
			setTimeout(check, 5000);
		});
}
check();

class KioskAudioStatus extends HTMLElement {
	get eventListeners() {
		return {
			'audio.playing': (data) => this.playing(data)
		};
	}

	playing(data) {
		this.innerHTML = `<div>
			<div>${data.song.title}</div>
			<div style='font-decorator: italic'>${data.song.additional.song_tag.artist}</div>
			<div>${data.song.additional.song_tag.year}</div>
		`;
	}
}

customElements.define('kiosk-audio-status', KioskAudioStatus);

registerUrlApplication(500, appName, '/synology-audio/', {
	// Status page:
	statusElement: new KioskAudioStatus(),

	// Link page:
	menuElement: generateButton('Musique', '/synology-audio/webman/3rdparty/AudioStation/images/audio_station_64.png')
});
appDisable(appName);
fireEvent('audio.unreachable');

/*

# Official API
https://www.synology.com/en-us/support/developer#tool

# Lib
https://github.com/kwent/syno
https://forum.synology.com/enu/viewtopic.php?t=102647
http://192.168.1.9/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=1&account=<USER>&passwd=<PASSWORD>

# Scripts
https://1drv.ms/f/s!AhSV8BnLHqYImitlCFD5B-CMn9w0

webapi="$host/webapi"

function initRemotePlayer {
  remotePlayerId=$(getRemotePlayerId $remotePlayerName)
  if [ -z "$remotePlayerId" ]
  then
    exitError "Remote Player '$remotePlayerName' not found."
  else
    echo "Id of Remote Player '$remotePlayerName' = $remotePlayerId"
  fi
}

function getWebApiAudioStation {
  echo $(getWebApi AudioStation $1 $2 $3 $4 $5)
}

function getWebApi {
  webapiName=$1
  cgiName=$2
  apiName=$3
  version=$4
  method=$5
  tail=$6

  if [ -z "$webapiName" ]
  then
    result="$webapi/$cgiName.cgi"
  else
    result="$webapi/$webapiName/$cgiName.cgi"
  fi

  if [ ! -z "$apiName" ]
  then
    result="$result?api=$apiName"
    if [ ! -z "$version" ]
    then
      result="$result&version=$version"
    fi
    if [ ! -z "$method" ]
    then
      result="$result&method=$method"
    fi
    if [ ! -z "$tail" ]
    then
      result="$result&$tail"
    fi
  else
    if [ ! -z "$tail" ]
    then
      result="$result?$tail"
    fi
  fi

  echo "$result"
}

function sendRequest {
  url=$1
  data=$2
  method=$3 # curl default = -G (GET)
  doUrlEncode=$4

  if [ -z "$doUrlEncode" ]
  then
    doUrlEncode=0
  fi

  if [ -z "$data" ]
  then
    result=$(curl $method -s --cookie cookie.txt $url)
  else
    if [ $doUrlEncode -eq 1 ]
    then
      result=$(curl $method -s --cookie cookie.txt --data-urlencode $data $url)
    else
      result=$(curl $method -s --cookie cookie.txt --data $data $url)
    fi
  fi
  echo $result
}

*/
