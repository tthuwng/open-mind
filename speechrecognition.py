import librosa
import soundfile
import os, glob, pickle
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score

AUDIO_FILEPATH ='/Users/kunal/OneDrive/Documents/1. Stanford University/Sophomore Year/Personal Projects/MetroHacks 2021/ravdess-data/Actor_*/*.wav'#/GitHub/prag-feature-distribution'

#Emotions in the RAVDESS dataset
emotions={
  '01':'neutral',
  '02':'calm',
  '03':'happy',
  '04':'sad',
  '05':'angry',
  '06':'fearful',
  '07':'disgust',
  '08':'surprised'
}

#Emotions to observe
observed_emotions=['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised']

#Extract features (mfcc, chroma, mel) from a sound file
def extract_feature(file_name, mfcc, chroma, mel):
    with soundfile.SoundFile(file_name) as sound_file:
        X = sound_file.read(dtype="float32")
        sample_rate=sound_file.samplerate
        if chroma:
            stft=np.abs(librosa.stft(X))
        result=np.array([])
        if mfcc:
            mfccs=np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
            result=np.hstack((result, mfccs))
        if chroma:
            chroma=np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T,axis=0)
            result=np.hstack((result, chroma))
        if mel:
            mel=np.mean(librosa.feature.melspectrogram(X, sr=sample_rate).T,axis=0)
            result=np.hstack((result, mel))
        return result

#Load the data from the audio files and extract their features
def load_data(test_size=0.2):
    features_list, emotions_list = [], []
    for file in glob.glob(AUDIO_FILEPATH):
        file_name = os.path.basename(file)
        emotion = emotions[file_name.split('-')[2]]
        if emotion in observed_emotions:
            feature = extract_feature(file, mfcc=True, chroma=True, mel=True)
            features_list.append(feature)
            emotions_list.append(emotion)
    return train_test_split(np.array(features_list), np.asarray(emotions_list), test_size=test_size, random_state=9)

#Split the dataset into training data and test data
x_train,x_test,y_train,y_test=load_data(test_size=0.25)
print('The shape of the training data is', x_train.shape[0])
print('The shape of the training data is', x_test.shape[0])
print('The number of features extracted is,', x_train.shape[1])