import requests
##not sure if this is helpful for audio data
res = requests.get('''audio data''')
with open('''specify folder possibly''') as fp:
    fp.write(res.text)
