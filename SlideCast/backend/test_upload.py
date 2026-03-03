import requests

def upload_file():
    url = 'http://localhost:5000/api/files/convert'
    file_path = '../test.ppt'
    
    try:
        files = {'file': open(file_path, 'rb')}
        response = requests.post(url, files=files)
        print('Response:', response.json())
        return response.json()
    except Exception as e:
        print('Error:', str(e))

if __name__ == '__main__':
    upload_file()
