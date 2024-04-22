import requests  
  
# POST request to localhost:9000/pp  
post_response = requests.post('http://localhost:8887/invocations')  
print('POST response:', post_response.text)  
  
# GET request to localhost:9000/ping  
get_response = requests.get('http://localhost:8887/ping')  
print('GET response:', get_response.text)  