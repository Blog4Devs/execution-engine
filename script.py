# script to test auto-scaling, it sends parallel requests to the k8s service
import concurrent.futures
import requests

# Change this to your target URL
TARGET_URL = 'http://localhost:32000/api/execute'

# Define the JSON payload you want to send in the POST request
payload = {
    "language": "javascript",
    "code": "console.log(\"hi\")"
}

def send_request():
    try:
        # Sending a POST request with the JSON payload
        response = requests.post(TARGET_URL, json=payload)
        print(f'Response Code: {response.status_code}, Response: {response.text}')
    except Exception as e:
        print(f'An error occurred: {e}')

def main():
    number_of_requests = 200

    # Use ThreadPoolExecutor to send requests in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        # Submit tasks to the executor
        futures = [executor.submit(send_request) for _ in range(number_of_requests)]

        # Optionally, wait for all futures to complete
        for future in concurrent.futures.as_completed(futures):
            future.result()  # This will raise an exception if the request failed

if __name__ == '__main__':
    main()
