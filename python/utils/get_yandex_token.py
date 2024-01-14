import requests


client_id = "e8326838910e46dda6e209601c4e4f10"
client_secret = "0f9521fad8b7493cbd0b4bc3c1c30f42"

print("Open the following URL in your web browser to get the authorization code:")
print(f"https://oauth.yandex.ru/authorize?response_type=code&client_id={client_id}")

auth_code = input("Enter the authorization code: ")

headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
}
data = {
  'grant_type': 'authorization_code',
  'code': auth_code,
  'client_id': client_id,
  'client_secret': client_secret
}

response = requests.post('https://oauth.yandex.ru/token', headers=headers, data=data)
if response.status_code == 200:
    json_response = response.json()
    print("Your token is: " + json_response['access_token'])
else:
    print("Failed to get token. Please check your inputs and try again.")