import requests
from urllib.parse import quote

token = "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8"
disk_file_path = "МРСК/Разное/Пример данных для загрузки.xlsx"
local_file_path = r"C:\Bin\Текущие работы.xlsx"


disk_file_path = quote(disk_file_path)

headers = {
    "Authorization": f"OAuth {token}",
}


response = requests.get(
    f"https://cloud-api.yandex.net/v1/disk/resources/download?path={disk_file_path}",
    headers=headers,
)

# Check if the request was successful
if response.status_code == 200:
    # Parse the JSON response and get the download link
    json_response = response.json()
    download_link = json_response["href"]

    # Download the file
    response = requests.get(download_link, stream=True)
    if response.status_code == 200:
        # Save the file
        with open(local_file_path, "wb") as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        print("File downloaded successfully.")
    else:
        print("Failed to download the file.")
else:
    print("Failed to get download link.  Response: " + response.text)
