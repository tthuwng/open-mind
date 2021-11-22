from ISStreamer.Streamer import Streamer
from flask import Flask
from flask_restful import Resource, Api, reqparse
import pandas as pd
import ast

app=Flask(__name__)
api = Api(app)

#/users
users_path='''wherever user data is stored (For example, "./data/users.csv")'''
#/audio
#/accuracy (maybe)


#may need to switch around the components of the user and audio class based on what you need and do not need

class Users(Resource):
    def get(self):
        data = pd.read_csv(users_path) #replace csv with whatever end path is used according to users_path
        data = data.to_dict()
        return {'data':data}, 200 #not sure if this number is the right one

    def post(self):
        parser=reqparse.RequestParser()
        parser.add_argument('audioId',required=True, type=int##if int data is being acquired, I'm not sure)
        ##parser.add_argument('name',required=True, type=str)
        args = parser.parse_args()
        audio, ##name maybe then uncomment the above parser statement
        data = pd.read_csv(users_path) #again it might be different than csv

        if args['audioId'] in data['audioId']:
            return {
            'message': f"{args['audioId']} already exists"
            },409 #might use a different number
        else:
            data = data.append({
                'audioId':str(args['audioId']) , ##str() is for if the data is used as string I think
                #'name':args['name']
            }, ignore_index = True)
            return {'data':data.to_dict()},200 #might need a different number but should probably match with the other place w 200

    def delete(self):
        parser=reqparse.RequestParser()
        parser.add_argument('audioId',required=True, type=int##if int data is being acquired, I'm not sure)
        ##parser.add_argument('name',required=True, type=str)
        args = parser.parse_args()

        if args['audioId'] in data['audioId']:
            data= data[data['audioId']!=args['audioId']]
            data.to_csv(users_path, index=False) #different file path instead csv may be needed
            return {'data':data.to_dict()},200 #number may be different
        else:
            return {'message':f"{args['audioId']} does not exist!"
            },404 #different number may be needed


class Audio(Resource):
    pass



api.add_resource(Users,'/users')
api.add_resource(Audio,'/audio')

if __name__ == "__main__":
    app.run(debug=True)


ACCESS_KEY = "ist_Dhztjg5pZmQeJuFgID3dinHYM7PqX2v7"
BUCKET_KEY = "RVCXRFDKET8E"
BUCKET_NAME = "Emotion recognition"

# create a Streamer instance
streamer = Streamer(bucket_name=BUCKET_NAME, bucket_key=BUCKET_KEY, access_key=ACCESS_KEY)

# send some data
streamer.log("myNumber", 25)

# flush and close the stream
streamer.flush()
