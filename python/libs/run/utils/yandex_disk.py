import io
import requests
from urllib.parse import quote




def download_file(token: str, file_path: str) -> io.BytesIO:
    print (f"downloading {file_path}")
    encoded_file_path = quote(file_path)
    headers = {
        "Authorization": f"OAuth {token}",
    }
    response = requests.get(
        f"https://cloud-api.yandex.net/v1/disk/resources/download?path={encoded_file_path}",
        headers=headers,
    )
    if response.status_code == 200:
        # Parse the JSON response and get the download link
        json_response = response.json()
        download_link = json_response["href"]
        response = requests.get(download_link, stream=True)
        if response.status_code == 200:
            print (f"file {file_path} downloaded")
            return io.BytesIO(response.content)
        else:
            raise Exception("Failed to download the file. Response: " + response.text)
    else:
        raise Exception("Failed to get download link.  Response: " + response.text)
