import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  Button,
  StyleSheet,
  View,
  Slider,
  Dimensions,
  TouchableHighlight,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Icons from '../components/Icons';
import * as FileSystem from 'expo-file-system';
import * as Font from 'expo-font';

let recording = null;
let sound = null;
let recordingSettings = Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY;
let isSeeking = false;
let shouldPlayAtEndOfSeek = false;

const BACKGROUND_COLOR = '#FFF8ED';
const LIVE_COLOR = '#FF0000';
const DISABLED_OPACITY = 0.5;
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

const RecordingScreen = ({ navigation, route }) => {
  const [recordURI, setRecordURI] = React.useState();
  const [isRecording, setIsRecording] = useState(false);
  const [audioPerm, setAudioPerm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [volume, setVolume] = useState(1.0);

  const [soundDuration, setSoundDuration] = useState(null);
  const [soundPosition, setSoundPosition] = useState(null);

  const [muted, setMuted] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(null);
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(false);
  const player = useRef(new Audio.Sound());

  useEffect(() => {
    askForPermissions();
  }, []);

  const askForPermissions = async () => {
    const getAudioPerm = await Audio.requestPermissionsAsync();
    setAudioPerm(getAudioPerm.granted);
  };

  //   const getPermission = async () => {
  //     const getAudioPerm = await Audio.requestPermissionsAsync();
  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: true,
  //       playsInSilentModeIOS: true,
  //     });
  //     setAudioPerm(getAudioPerm.granted);
  //   };

  const updateScreenForSoundStatus = (status) => {
    if (status.isLoaded) {
      setSoundDuration(status.durationMillis ?? null);
      setSoundPosition(status.positionMillis);
      setShouldPlay(status.shouldPlay);
      setIsPlaying(status.isPlaying);
      setMuted(status.muted);
      setVolume(status.volume);
      setIsPlaybackAllowed(true);
      //   this.setState({
      //     soundDuration: status.durationMillis ?? null,
      //     soundPosition: status.positionMillis,
      //     shouldPlay: status.shouldPlay,
      //     isPlaying: status.isPlaying,
      //     rate: status.rate,
      //     muted: status.isMuted,
      //     volume: status.volume,
      //     shouldCorrectPitch: status.shouldCorrectPitch,
      //     isPlaybackAllowed: true,
      //   });
    } else {
      setSoundDuration(null);
      setSoundPosition(null);
      setIsPlaybackAllowed(false);

      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  const updateScreenForRecordingStatus = (status) => {
    if (status.canRecord) {
      setIsRecording(status.isRecording);
      setRecordingDuration(status.durationMillis);
    } else if (status.isDoneRecording) {
      setIsRecording(false);
      setRecordingDuration(status.durationMillis);

      if (!isLoading) {
        stopRecordingAndEnablePlayBack();
      }
    }
  };

  const stopPlaybackAndBeginRecording = async () => {
    setIsLoading(true);
    if (sound !== null) {
      await sound.unloadAsync();
      sound.setOnPlaybackStatusUpdate(null);
      sound = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });

    if (recording !== null) {
      recording.setOnRecordingStatusUpdate(null);
      recording = null;
    }

    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync(recordingSettings);
    newRecording.setOnRecordingStatusUpdate(updateScreenForRecordingStatus);

    recording = newRecording;
    await recording.startAsync(); // Will call _updateScreenForRecordingStatus to update the screen.
    setIsLoading(false);
  };

  const stopRecordingAndEnablePlayBack = async () => {
    setIsLoading(true);
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      if (error.code === 'E_AUDIO_NODATA') {
        console.log(
          `Stop was called too quickly, no data has yet been received (${error.message})`
        );
      } else {
        console.log('STOP ERROR: ', error.code, error.name, error.message);
      }
      setIsLoading(false);
      return;
    }
    const info = await recording.getURI();
    console.log(`FILE INFO: ${JSON.stringify(info)}`);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    const { resSound, status } = await recording.createNewLoadedSoundAsync(
      {
        isLooping: true,
        isMuted: muted,
        volume: volume,
        // shouldCorrectPitch: shouldCrorrectPitch,
      },
      updateScreenForSoundStatus
    );
    sound = resSound;
    setIsLoading(false);
  };

  async function onRecordPressed() {
    if (isRecording) {
      console.log('stopRecordingAndEnablePlayBack');
      stopRecordingAndEnablePlayBack();
    } else {
      console.log('stopPlaybackAndBeginRecording');
      stopPlaybackAndBeginRecording();
    }
    // console.log('Starting recording..');
    // if (audioPerm === true) {
    //   try {
    //     await recording.prepareToRecordAsync(
    //       Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
    //     );
    //     await recording.startAsync();
    //     setIsRecording(true);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // } else {
    //   getPermission();
    // }
  }

  const onPlayPausePressed = () => {
    if (sound != null) {
      if (isPlaying) {
        sound.pauseAsync();
      } else {
        sound.playAsync();
      }
    }
  };

  const onStopPressed = () => {
    if (sound != null) {
      sound.stopAsync();
    }
  };

  const onMutePressed = () => {
    if (sound != null) {
      sound.setIsMutedAsync(!muted);
    }
  };

  const onVolumeSliderValueChange = (value) => {
    if (sound != null) {
      sound.setVolumeAsync(value);
    }
  };

  function getMMSSFromMillis(millis) {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = (number) => {
      const string = number.toString();
      if (number < 10) {
        return '0' + string;
      }
      return string;
    };
    return padWithZero(minutes) + ':' + padWithZero(seconds);
  }

  function onSeekSliderValueChange() {
    if (sound != null && !isSeeking) {
      isSeeking = true;
      shouldPlayAtEndOfSeek = shouldPlay;
      sound.pauseSync();
    }
  }

  const onSeekSliderSlidingComplete = async (value) => {
    if (sound != null) {
      isSeeking = false;
      const seekPosition = value * (soundDuration || 0);
      if (shouldPlayAtEndOfSeek) {
        sound.playFromPositionAsync(seekPosition);
      } else {
        sound.setPositionAsync(seekPosition);
      }
    }
  };

  const getSeekSliderPosition = () => {
    if (sound != null && soundPosition != null && soundDuration != null) {
      return soundPosition / soundDuration;
    }
    return 0;
  };
  const getPlaybackTimestamp = () => {
    console.log(sound, soundPosition, soundDuration);
    if (sound != null && soundPosition != null && soundDuration != null) {
      return `${getMMSSFromMillis(soundPosition)} / ${getMMSSFromMillis(
        soundDuration
      )}`;
    }
    return '';
  };

  function getRecordingTimestamp() {
    if (recordingDuration != null) {
      return `${getMMSSFromMillis(recordingDuration)}`;
    }
    return getMMSSFromMillis(0);
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    try {
      await recording.stopAndUnloadAsync();
      const result = recording.getURI();
      setRecordURI(result); // Here is the URI
      recording = new Audio.Recording();
      setIsRecording(false);
    } catch (error) {
      console.log(error);
    }
    console.log('Recording stopped and stored at', recordURI);
  }

  async function playSound() {
    try {
      const result = await player.current.loadAsync(
        { uri: recordURI },
        {},
        true
      );

      const response = await player.current.getStatusAsync();
      if (response.isLoaded) {
        if (response.isPlaying === false) {
          player.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  const stopSound = async () => {
    try {
      const checkLoading = await player.current.getStatusAsync();
      if (checkLoading.isLoaded === true) {
        await player.current.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (!audioPerm) {
    return (
      <View style={styles.container}>
        <View />
        <Text style={[styles.noPermissionsText]}>
          You must enable audio recording permissions in order to use this app.
        </Text>
        <View />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          // styles.halfScreenContainer,
          {
            opacity: isLoading ? DISABLED_OPACITY : 1.0,
          },
        ]}
      >
        {/* <View /> */}
        <View style={styles.recordingContainer}>
          <View />
          <TouchableHighlight
            underlayColor={BACKGROUND_COLOR}
            style={styles.wrapper}
            onPress={onRecordPressed}
            disabled={isLoading}
          >
            <Image style={styles.image} source={Icons.RECORD_BUTTON.module} />
          </TouchableHighlight>
          <View style={styles.recordingDataContainer}>
            <View />
            <Text style={[styles.liveText]}>{isRecording ? 'LIVE' : ''}</Text>
            <View style={styles.recordingDataRowContainer}>
              <Image
                style={[styles.image, { opacity: isRecording ? 1.0 : 0.0 }]}
                source={Icons.RECORDING.module}
              />
              <Text style={[styles.recordingTimestamp]}>
                {getRecordingTimestamp()}
              </Text>
            </View>
            <View />
          </View>
          <View />
        </View>
      </View>
      <View
        style={[
          styles.halfScreenContainer,
          {
            opacity: !isPlaybackAllowed || isLoading ? DISABLED_OPACITY : 1.0,
          },
        ]}
      >
        {/* <View /> */}
        <View style={styles.playbackContainer}>
          <Slider
            style={styles.playbackSlider}
            trackImage={Icons.TRACK_1.module}
            thumbImage={Icons.THUMB_1.module}
            value={getSeekSliderPosition()}
            onValueChange={onSeekSliderValueChange}
            onSlidingComplete={onSeekSliderSlidingComplete}
            disabled={!isPlaybackAllowed || isLoading}
          />
          <Text style={[styles.playbackTimestamp]}>
            {getPlaybackTimestamp()}
          </Text>
        </View>
        <View
          style={[styles.buttonsContainerBase, styles.buttonsContainerTopRow]}
        >
          <View style={styles.volumeContainer}>
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={onMutePressed}
              disabled={!isPlaybackAllowed || isLoading}
            >
              <Image
                style={styles.image}
                source={
                  muted
                    ? Icons.MUTED_BUTTON.module
                    : Icons.UNMUTED_BUTTON.module
                }
              />
            </TouchableHighlight>
            <Slider
              style={styles.volumeSlider}
              trackImage={Icons.TRACK_1.module}
              thumbImage={Icons.THUMB_2.module}
              value={1}
              onValueChange={onVolumeSliderValueChange}
              disabled={!isPlaybackAllowed || isLoading}
            />
          </View>
          <View style={styles.playStopContainer}>
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={onPlayPausePressed}
              disabled={!isPlaybackAllowed || isLoading}
            >
              <Image
                style={styles.image}
                source={
                  isPlaying
                    ? Icons.PAUSE_BUTTON.module
                    : Icons.PLAY_BUTTON.module
                }
              />
            </TouchableHighlight>
            <TouchableHighlight
              underlayColor={BACKGROUND_COLOR}
              style={styles.wrapper}
              onPress={onStopPressed}
              disabled={!isPlaybackAllowed || isLoading}
            >
              <Image style={styles.image} source={Icons.STOP_BUTTON.module} />
            </TouchableHighlight>
          </View>
          <View />
        </View>
      </View>

      <View />
      {/* <View style={styles.container}>
        <Button
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
          onPress={isRecording ? stopRecording : () => startRecording()}
        />
      </View>

      <View style={styles.container}>
        <Button
          title={isPlaying ? 'Stop Sound' : 'Play Sound'}
          onPress={isPlaying ? () => stopSound : () => playSound()}
        />
      </View> */}

      {/* <Button
        title='Go to Insight Screen'
        onPress={() => navigation.navigate('Insight', { name: 'Jane' })}
      /> */}
    </View>
  );
};
export default RecordingScreen;

const styles = StyleSheet.create({
  emptyContainer: {
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_COLOR,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_COLOR,
    minHeight: DEVICE_HEIGHT,
    maxHeight: DEVICE_HEIGHT,
  },
  noPermissionsText: {
    textAlign: 'center',
  },
  wrapper: {},
  halfScreenContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    // minHeight: DEVICE_HEIGHT / 2.0,
    maxHeight: DEVICE_HEIGHT / 2.0,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: Icons.RECORD_BUTTON.height,
    maxHeight: Icons.RECORD_BUTTON.height,
  },
  recordingDataContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: Icons.RECORD_BUTTON.height,
    maxHeight: Icons.RECORD_BUTTON.height,
    minWidth: Icons.RECORD_BUTTON.width * 3.0,
    maxWidth: Icons.RECORD_BUTTON.width * 3.0,
  },
  recordingDataRowContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: Icons.RECORDING.height,
    maxHeight: Icons.RECORDING.height,
  },
  playbackContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: Icons.THUMB_1.height * 2.0,
    maxHeight: Icons.THUMB_1.height * 2.0,
  },
  playbackSlider: {
    alignSelf: 'stretch',
  },
  liveText: {
    color: LIVE_COLOR,
  },
  recordingTimestamp: {
    paddingLeft: 20,
  },
  playbackTimestamp: {
    textAlign: 'right',
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  image: {
    backgroundColor: BACKGROUND_COLOR,
  },
  textButton: {
    backgroundColor: BACKGROUND_COLOR,
    padding: 10,
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonsContainerTopRow: {
    maxHeight: Icons.MUTED_BUTTON.height,
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  playStopContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: ((Icons.PLAY_BUTTON.width + Icons.STOP_BUTTON.width) * 3.0) / 2.0,
    maxWidth: ((Icons.PLAY_BUTTON.width + Icons.STOP_BUTTON.width) * 3.0) / 2.0,
  },
  volumeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  volumeSlider: {
    width: DEVICE_WIDTH / 2.0 - Icons.MUTED_BUTTON.width,
  },
  buttonsContainerBottomRow: {
    maxHeight: Icons.THUMB_1.height,
    alignSelf: 'stretch',
    paddingRight: 20,
    paddingLeft: 20,
  },
  timestamp: {
    // fontFamily: 'cutive-mono-regular',
  },
  rateSlider: {
    width: DEVICE_WIDTH / 2.0,
  },
});
